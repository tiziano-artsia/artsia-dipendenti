import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getPayslipById, EmployeeModel } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

    const filePath = path.join(process.cwd(), 'public', payslip.filePath);
    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File non trovato' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=busta-paga-${payslip.mese}-${payslip.anno}.pdf`,
        },
    });
}
