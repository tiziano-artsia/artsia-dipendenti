import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPayslips } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        // Filtra solo le buste paga dell'utente corrente
        const payslips = await getPayslips({ employeeId: user.id });

        return NextResponse.json({
            success: true,
            data: payslips
        });
    } catch (error) {
        console.error('❌ API Payslips my error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
