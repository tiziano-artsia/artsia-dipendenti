import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {type AbsenceDoc, getAbsences} from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
    id: number;
    role: string;
}

function getUserFromToken(request: NextRequest): JWTPayload | null {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) return null;

        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = getUserFromToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        // 🔥 Fetch assenze APPROVATE utente
        const assenze = await getAbsences({
            employeeId: user.id,
            status: 'approved'
        });

        // 🔥 STATISTICHE Type-safe
        const stats = {
            ferie: 0,
            permessi: 0,
            smartworking: 0,
            malattia: 0
        };

        assenze.forEach((assenza: AbsenceDoc) => {
            const tipo = assenza.type;
            const durata = Number(assenza.durata);

            switch (tipo) {
                case 'ferie':
                    stats.ferie += durata;
                    break;
                case 'permesso':
                    stats.permessi += durata;
                    break;
                case 'smartworking':
                    stats.smartworking += durata;
                    break;
                case 'malattia':
                    stats.malattia += durata;
                    break;
            }
        });

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error: unknown) {
        console.error('❌ Stats API error:', error);
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        );
    }
}
