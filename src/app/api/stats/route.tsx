import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getAbsences } from '@/lib/db';

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

        // 🔥 Fetch tutte le assenze APPROVATE dell'utente
        const filter = {
            employeeId: user.id,
            status: 'approved' // 🔥 SOLO APPROVATE
        };

        const assenze = await getAbsences(filter);

        // 🔥 CALCOLA STATISTICHE
        const stats = {
            ferie: 0,
            permessi: 0,
            smartworking: 0,
            malattia: 0
            
        };

        assenze.forEach((assenza: any) => {
            const tipo = (assenza.type || '').toLowerCase();
            const durata = assenza.durata || assenza.duration || 0;

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

    } catch (error) {
        console.error('❌ Stats API error:', error);
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        );
    }
}
