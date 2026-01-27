import { NextRequest, NextResponse } from 'next/server';
import { AbsenceModel } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
    // ... il tuo codice GET esistente (OK)
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        const absences = await AbsenceModel.find({
            employeeId: decoded.id
        }).sort({ dataInizio: -1 }).lean();

        // 🔥 FIX: mappatura corretta + MALATTIA

        const formatted = absences.map(abs => ({
            id: abs._id,
            data: abs.dataInizio,
            tipo: abs.type === 'ferie' ? 'Ferie' :
                abs.type === 'malattia' ? 'Malattia' :
                    abs.type === 'smartworking' ? 'Smartworking' : 'Permesso',
            durata: abs.durata,
            stato: abs.status,
            motivo:  abs.motivo
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('My absences GET error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}

// 🔥 NUOVO: POST per inserire assenze
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        const body = await request.json();
        console.log('📥 POST ricevuto:', body);

        // 🔥 VALIDAZIONE TIPI
        const tipiValidi = ['ferie', 'permesso', 'smartworking', 'malattia'];
        if (!tipiValidi.includes(body.tipo)) {
            console.log('❌ Tipo non valido:', body.tipo);
            return NextResponse.json(
                { error: `Tipo non valido. Usa: ${tipiValidi.join(', ')}` },
                { status: 400 }
            );
        }

        // 🔥 VALIDAZIONE CAMPI
        const employeeId = decoded.id; // Dal token JWT
        const dataInizio = body.data;
        const durata = parseInt(body.durata);
        const motivo = body.motivo || '';

        if (!dataInizio || !durata || durata <= 0) {
            return NextResponse.json(
                { error: 'Data e durata obbligatorie e positive' },
                { status: 400 }
            );
        }

        // Crea nuova assenza
        const nuovaAssenza = new AbsenceModel({
            employeeId: employeeId,
            dataInizio: dataInizio,  // Campo frontend
            durata: durata,
            type: body.tipo,         // Campo backend
            status: 'pending',
            reason: motivo           // Campo backend
        });

        await nuovaAssenza.save();
        console.log('✅ Nuova assenza salvata:', nuovaAssenza._id);

        return NextResponse.json({
            success: true,
            data: nuovaAssenza
        });

    } catch (error:any) {
        console.error('💥 POST error:', error);

        return NextResponse.json(
            { error: 'Errore server', details: error.message },
            { status: 500 }
        );
    }
}
