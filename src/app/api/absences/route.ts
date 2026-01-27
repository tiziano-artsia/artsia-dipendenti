// src/app/api/absences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAbsences, createAbsence, updateAbsenceStatus } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

        // 🔥 LEGGI QUERY PARAMS
        const searchParams = request.nextUrl.searchParams;
        const employeeIdParam = searchParams.get('employeeId');

        console.log('📊 API Absences GET:', {
            userRole: user.role,
            userId: user.id,
            employeeIdParam
        });

        let filter: any = {};

        // 🔥 LOGICA FILTRO
        if (user.role === 'admin') {
            // Admin: se c'è employeeId filtra per quello, altrimenti tutti
            if (employeeIdParam) {
                filter.employeeId = Number(employeeIdParam);
            }
            // Altrimenti: nessun filtro = tutti
        } else {
            // Non-admin: SOLO le proprie assenze
            filter.employeeId = user.id;
        }

        console.log('🔍 Filter applicato:', filter);

        const absences = await getAbsences(filter);

        console.log(`✅ Trovate ${absences.length} assenze`);

        return NextResponse.json({
            success: true,
            data: absences
        });

    } catch (error) {
        console.error('❌ API Absences error:', error);
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const body = await request.json();
        console.log('📥 POST ricevuto:', body);

        const { type, dataInizio, durata, motivo } = body;

        // 🔥 VALIDAZIONE TIPI COMPLETE
        const tipiValidi = ['ferie', 'permesso', 'smartworking', 'malattia'];
        if (!tipiValidi.includes(type)) {
            console.log('❌ Tipo non valido:', type);
            return NextResponse.json(
                { error: `Tipo non valido. Usa: ${tipiValidi.join(', ')}` },
                { status: 400 }
            );
        }

        if (!dataInizio || !durata || Number(durata) <= 0) {
            return NextResponse.json(
                { error: 'Data e durata (positiva) obbligatori' },
                { status: 400 }
            );
        }

        const newAbsence = await createAbsence({
            employeeId: user.id,
            type,                    // malattia OK!
            dataInizio,              // YYYY-MM-DD
            durata: Number(durata),
            motivo: motivo || '',
            status: 'pending',
            approvedBy: null
        });

        // 🔥 FORMATTA DATA ITALIANA nella risposta
        const response = {
            ...newAbsence,
            dataInizio: new Date(newAbsence.dataInizio).toLocaleDateString('it-IT')
        };

        console.log('✅ Nuova assenza:', response);
        return NextResponse.json({ success: true, data: response });
    } catch (error) {
        console.error('POST absence error:', error);
        return NextResponse.json({ error: 'Errore server', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = getUserFromToken(request);
        if (!user || user.role === 'dipendente') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        const body = await request.json();
        const { id, action } = body;

        console.log('🔍 PATCH absence:', { id, action, manager: user.email });

        if (!id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'ID e action validi richiesti' }, { status: 400 });
        }

        const result = await updateAbsenceStatus(id, action === 'approve' ? 'approved' : 'rejected', user.id);

        if (!result) {
            return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
        }

        console.log('✅ Status aggiornato:', { id, newStatus: action === 'approve' ? 'approved' : 'rejected' });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PATCH absence error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
