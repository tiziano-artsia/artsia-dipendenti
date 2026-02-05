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
        console.log('🔵 POST /api/payslips - Inizio richiesta');

        // 1. Autenticazione
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        let user;

        try {
            user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
            console.log('✅ Token valido, user:', user.id, user.role);
        } catch (jwtError) {
            console.error('❌ JWT Error:', jwtError);
            return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
        }

        // 2. Verifica ruolo admin
        if (user.role !== 'admin') {
            console.error('❌ Utente non admin:', user.role);
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        // 3. Parse body
        let body;
        try {
            body = await request.json();
            console.log('📥 Body ricevuto:', {
                type: body.type,
                employeeId: body.employeeId,
                employeeName: body.employeeName,
                anno: body.anno,
                documentName: body.documentName,
                mese: body.mese,
                fileSize: body.file?.length || 0
            });
        } catch (parseError) {
            console.error('❌ Errore parsing JSON:', parseError);
            return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
        }

        const { type, employeeId, employeeName, anno, file, documentName, mese, netto } = body;

        // 4. Validazione base
        if (!type || !employeeId || !employeeName || !anno || !file) {
            const missing = [];
            if (!type) missing.push('type');
            if (!employeeId) missing.push('employeeId');
            if (!employeeName) missing.push('employeeName');
            if (!anno) missing.push('anno');
            if (!file) missing.push('file');

            console.error('❌ Campi mancanti:', missing);
            return NextResponse.json({
                error: `Campi obbligatori mancanti: ${missing.join(', ')}`
            }, { status: 400 });
        }

        // 5. Validazione specifica per tipo
        if (type === 'payslip') {
            if (!mese) {
                console.error('❌ Mese mancante per busta paga');
                return NextResponse.json({
                    error: 'Campo "mese" obbligatorio per le buste paga'
                }, { status: 400 });
            }
        } else if (type === 'document') {
            if (!documentName) {
                console.error('❌ DocumentName mancante per documento');
                return NextResponse.json({
                    error: 'Campo "documentName" obbligatorio per i documenti'
                }, { status: 400 });
            }
        } else {
            console.error('❌ Tipo non valido:', type);
            return NextResponse.json({
                error: 'Tipo documento non valido'
            }, { status: 400 });
        }

        // 6. Chiamata al database
        console.log('🔵 Chiamata createPayslip...');

        let result;
        try {
            result = await createPayslip({
                type: type as 'payslip' | 'document',
                employeeId: Number(employeeId),
                employeeName: employeeName,
                anno: anno,
                filePath: file,
                ...(type === 'payslip' ? { mese, netto: netto || null } : { documentName })
            });
            console.log('✅ Documento creato:', result.id);
        } catch (dbError: any) {
            console.error('❌ Errore database:', dbError);
            return NextResponse.json({
                error: dbError.message || 'Errore database',
                details: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
            }, { status: 500 });
        }

        // 7. Risposta successo
        return NextResponse.json({
            success: true,
            data: result,
            message: `${type === 'payslip' ? 'Busta paga' : 'Documento'} caricato con successo`
        });

    } catch (error: any) {
        console.error('❌ ERRORE GENERICO POST:', error);
        console.error('Stack:', error.stack);

        return NextResponse.json(
            {
                error: 'Errore durante il caricamento del file',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}