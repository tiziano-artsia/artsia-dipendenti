// src/app/api/absences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAbsences, createAbsence, updateAbsenceStatus } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
    name: string;
    email: string;
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

        const { searchParams } = request.nextUrl;
        const employeeIdParam = searchParams.get('employeeId');

        console.log('📊 GET Absences:', {
            role: user.role,
            userId: user.id,
            filter: employeeIdParam || 'tutti'
        });

        // Costruisci filtro
        const filter: any = {};
        if (user.role !== 'admin') {
            filter.$or = [
                { employeeId: user.id },
                { status: 'approved' }
            ];
        } else if (employeeIdParam) {
            // Admin con filtro specifico
            filter.employeeId = Number(employeeIdParam);
        }

        // Admin senza param = tutti (filter vuoto)

        console.log('🔍 Filtro:', filter);

        const absences = await getAbsences(filter);
        console.log(`✅ ${absences.length} assenze trovate`);

        return NextResponse.json({
            success: true,
            data: absences,
            count: absences.length
        });

    } catch (error: any) {
        console.error(' GET error:', error.message || error);
        return NextResponse.json(
            { error: 'Errore interno server', details: error.message },
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
        console.log('📥 POST body:', body);

        const typeNorm = (body.type || '').trim().toLowerCase();
        const tipiValidi = new Set(['ferie', 'permesso', 'smartworking', 'malattia']);

        if (!tipiValidi.has(typeNorm)) {
            console.log('❌ Tipo invalido:', body.type, '→', typeNorm);
            return NextResponse.json(
                {
                    error: `Tipo non valido. Usa: ${Array.from(tipiValidi).join(', ')}`,
                    ricevuto: typeNorm
                },
                { status: 400 }
            );
        }

        if (!body.dataInizio || !body.durata || Number(body.durata) <= 0) {
            return NextResponse.json(
                { error: 'dataInizio e durata (>0) obbligatori' },
                { status: 400 }
            );
        }

        // 🔥 AUTO-APPROVA SMARTWORKING
        let status = body.status || 'pending';
        let approvedBy = body.approvedBy || null;

        if (typeNorm === 'smartworking') {
            status = 'approved';
            approvedBy = user.id;
        }

        const newAbsence = await createAbsence({
            employeeId: Number(body.employeeId || user.id),
            type: typeNorm,
            dataInizio: body.dataInizio,
            durata: Number(body.durata),
            motivo: (body.motivo || '').trim(),
            status: status, // ✅ Auto-approved per smartworking
            requestedBy: body.requestedBy || user.name || user.email,
            approvedBy: approvedBy, // ✅ Auto-approved
            createdAt: body.createdAt || new Date().toISOString(),
            updatedAt: body.updatedAt || new Date().toISOString(),
            // Campi legacy (se DB li richiede)
            data: body.dataInizio,
            stato: status,
            tipo: typeNorm
        });

        console.log('✅ Creata:', newAbsence);

        // Response con data italiana
        const responseData = {
            ...newAbsence,
            dataInizio: newAbsence.dataInizio.includes('/')
                ? newAbsence.dataInizio
                : new Date(newAbsence.dataInizio).toLocaleDateString('it-IT')
        };

        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        console.error('❌ POST error:', error);
        return NextResponse.json(
            { error: 'Errore creazione', details: error.message },
            { status: 500 }
        );
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

        console.log('🔍 PATCH:', { id, action, user: user.email });

        if (!id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'id e action (approve/reject) obbligatori' }, { status: 400 });
        }

        const result = await updateAbsenceStatus(
            id,
            action === 'approve' ? 'approved' : 'rejected',
            user.id
        );

        if (!result) {
            return NextResponse.json({ error: 'Assenza non trovata' }, { status: 404 });
        }

        console.log('✅ Aggiornato:', { id, status: action });
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ PATCH error:', error);
        return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 });
    }
}


