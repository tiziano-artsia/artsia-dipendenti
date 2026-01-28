import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPayslips, createPayslip } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        // Se non è admin, filtra solo le proprie buste paga
        const filter = user.role === 'admin'
            ? {}
            : { employeeId: user.id };

        const payslips = await getPayslips(filter);

        return NextResponse.json({
            success: true,
            data: payslips
        });
    } catch (error) {
        console.error('❌ API Payslips GET error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        const { employeeId, employeeName, mese, anno, netto, file } = await request.json();

        const payslip = await createPayslip({
            employeeId: Number(employeeId),
            employeeName: employeeName,
            mese: mese,
            anno: anno,
            netto: netto,
            filePath: file // Salva il file come stringa base64
        });

        return NextResponse.json({
            success: true,
            data: payslip
        });
    } catch (error) {
        console.error('❌ API Payslips POST error:', error);
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        );
    }
}
