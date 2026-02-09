import { NextRequest, NextResponse } from 'next/server';
import { AbsenceModel } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
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

        // ✅ Mappatura completa con tutti i nuovi tipi
        const formatted = absences.map(abs => {
            const tipoLabels: Record<string, string> = {
                'ferie': 'Ferie',
                'malattia': 'Malattia',
                'smartworking': 'Smartworking',
                'permesso': 'Permesso',
                'festivita': 'Festività',
                'fuori-sede': 'Fuori Sede',
                'congedo-parentale': 'Congedo Parentale'
            };

            return {
                id: abs._id,
                data: abs.dataInizio,
                tipo: tipoLabels[abs.type] || 'Altro',
                durata: abs.durata,
                stato: abs.status,
                motivo: abs.motivo
            };
        });

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('My absences GET error:', error);
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        const body = await request.json();
        console.log('📥 POST ricevuto:', body);

        // ✅ VALIDAZIONE TIPI - aggiornata con nuovi tipi
        const tipiValidi = [
            'ferie',
            'permesso',
            'smartworking',
            'malattia',
            'festivita',
            'fuori-sede',
            'congedo-parentale'
        ];

        if (!tipiValidi.includes(body.tipo)) {
            console.log('❌ Tipo non valido:', body.tipo);
            return NextResponse.json(
                { error: `Tipo non valido. Usa: ${tipiValidi.join(', ')}` },
                { status: 400 }
            );
        }

        // VALIDAZIONE CAMPI
        const employeeId = decoded.id;
        const dataInizio = body.data;
        const durata = parseInt(body.durata);
        const motivo = body.motivo || '';

        if (!dataInizio || !durata || durata <= 0) {
            return NextResponse.json(
                { error: 'Data e durata obbligatorie e positive' },
                { status: 400 }
            );
        }

        // ✅ Auto-approvazione per smartworking e festività
        let status = 'pending';
        if (body.tipo === 'smartworking' || body.tipo === 'festivita') {
            status = 'approved';
            console.log(`✅ Auto-approvato: ${body.tipo}`);
        }

        // Crea nuova assenza
        const nuovaAssenza = new AbsenceModel({
            id: Date.now(), // Aggiungi ID univoco
            employeeId: employeeId,
            dataInizio: dataInizio,
            durata: durata,
            type: body.tipo,
            status: status,
            motivo: motivo,
            requestedBy: decoded.name || decoded.email,
            approvedBy: status === 'approved' ? employeeId : null
        });

        await nuovaAssenza.save();
        console.log('✅ Nuova assenza salvata:', nuovaAssenza._id, 'Tipo:', body.tipo, 'Status:', status);

        return NextResponse.json({
            success: true,
            data: {
                id: nuovaAssenza._id,
                tipo: body.tipo,
                data: dataInizio,
                durata: durata,
                stato: status,
                motivo: motivo
            }
        });

    } catch (error: any) {
        console.error('💥 POST error:', error);
        return NextResponse.json(
            { error: 'Errore server', details: error.message },
            { status: 500 }
        );
    }
}
