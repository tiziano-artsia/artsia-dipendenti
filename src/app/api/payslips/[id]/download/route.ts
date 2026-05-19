import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getPayslipById, EmployeeModel } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;
        const payslipId = Number(id);

        // Recupera la busta paga dal database
        const payslip = await getPayslipById(payslipId);
        if (!payslip) {
            return NextResponse.json({ error: 'Busta paga non trovata' }, { status: 404 });
        }

        // Recupera il dipendente
        const employee = await EmployeeModel.findOne({ id: payslip.employeeId });
        if (!employee) {
            return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
        }

        // Verifica che il file sia base64 valido
        if (!payslip.filePath || typeof payslip.filePath !== 'string') {
            return NextResponse.json({ error: 'File non valido' }, { status: 404 });
        }

        // Rimuovi il prefisso data:application/pdf;base64, se presente
        let base64Data = payslip.filePath;
        if (base64Data.startsWith('data:application/pdf;base64,')) {
            base64Data = base64Data.replace(/^data:application\/pdf;base64,/, '');
        }

        // Converte base64 in buffer
        const fileBuffer = Buffer.from(base64Data, 'base64');

        // Nome file
        const filename = payslip.documentName
            ? `${payslip.documentName.replace(/[^a-z0-9]/gi, '_')}.pdf`
            : `${payslip.mese || 'documento'}-${payslip.anno}-${employee.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('❌ Download payslip error:', error);
        return NextResponse.json({ error: 'Errore nel download' }, { status: 500 });
    }
}
