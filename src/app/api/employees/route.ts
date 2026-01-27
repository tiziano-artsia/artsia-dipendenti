// app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getEmployees } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        // 🔥 TUTTI possono vedere l'elenco dipendenti (per mostrare i nomi)
        const employees = await getEmployees();

        console.log(`✅ API Employees: restituiti ${employees.length} dipendenti`);

        return NextResponse.json({
            success: true,
            data: employees
        });

    } catch (error) {
        console.error('❌ API Employees error:', error);
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        );
    }
}
