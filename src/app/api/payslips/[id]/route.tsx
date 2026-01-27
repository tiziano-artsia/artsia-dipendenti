// pages/api/payslips/[id]/download.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getPayslipById } from '@/lib/db';
import { EmployeeModel } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    await connectDB();

    const id = Number(params.id);
    const payslip = await getPayslipById(id);

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
