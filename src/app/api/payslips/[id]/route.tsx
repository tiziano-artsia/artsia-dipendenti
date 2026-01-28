import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getPayslipById, EmployeeModel } from '@/lib/db';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await context.params;
        const payslipId = Number(id);

        const payslip = await getPayslipById(payslipId);
        if (!payslip) {
            return NextResponse.json({ error: 'Busta paga non trovata' }, { status: 404 });
        }

        const employee = await EmployeeModel.findOne({ id: payslip.employeeId });
        if (!employee) {
            return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
        }

        // Verifica che il file sia base64 valido
        if (!payslip.filePath || typeof payslip.filePath !== 'string' || !payslip.filePath.startsWith('data:application/pdf;base64,')) {
            return NextResponse.json({ error: 'File non valido' }, { status: 404 });
        }

        // Rimuovi il prefisso base64 e decodifica
        const base64Data = payslip.filePath.replace(/^data:application\/pdf;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="busta-paga-${payslip.mese}-${payslip.anno}-${employee.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('❌ Download payslip error:', error);
        return NextResponse.json({ error: 'Errore nel download' }, { status: 500 });
    }
}
