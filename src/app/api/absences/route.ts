import { NextRequest, NextResponse } from 'next/server';
import {
    getAbsences,
    createAbsence,
    updateAbsenceStatus,
    getEmployeesByRole,
    getEmployees,
    EmployeeModel, connectDB, getTotaleInSmart
} from '@/lib/db';
import { sendNotification } from '@/lib/sendNotification';
import jwt from 'jsonwebtoken';
import {SMART_CONFIG} from "@/config/constant";

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

        const filter: any = {};
        if (user.role !== 'admin') {
            filter.$or = [
                { employeeId: user.id },
                { status: 'approved' }
            ];
        } else if (employeeIdParam) {
            filter.employeeId = Number(employeeIdParam);
        }

        console.log('Filtro:', filter);

        const absences = await getAbsences(filter);
        console.log(` ${absences.length} assenze trovate`);

        return NextResponse.json({
            success: true,
            data: absences,
            count: absences.length
        });

    } catch (error: any) {
        console.error('❌ GET error:', error.message || error);
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

        const tipiValidi = new Set([
            'ferie',
            'permesso',
            'smartworking',
            'malattia',
            'festivita',
            'fuori-sede',
            'congedo-parentale'
        ]);

        if (!tipiValidi.has(typeNorm)) {
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

        let status = body.status || 'pending';
        let approvedBy = body.approvedBy || null;

        // SMARTWORKING
        if (typeNorm === 'smartworking') {
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0);

            const dataRichiesta = new Date(body.dataInizio);
            dataRichiesta.setHours(0, 0, 0, 0);

            const maxData = new Date(oggi);
            maxData.setDate(oggi.getDate() + SMART_CONFIG.MAX_GIORNI_AVANTI);

            const isManagerOrAdmin = user.role === 'manager';

            if (!isManagerOrAdmin && dataRichiesta > maxData) {
                return NextResponse.json(
                    { error: `Lo smartworking può essere richiesto al massimo entro ${SMART_CONFIG.MAX_GIORNI_AVANTI} giorni da oggi.` },
                    { status: 400 }
                );
            }

            await connectDB();

            // ← Controlla se il richiedente è fullRemote
            const richiedente = await EmployeeModel.findOne({ id: Number(body.employeeId || user.id) }).lean();
            const isFullRemote = richiedente?.fullRemote === true || (richiedente?.fullRemote as any) === "true";

            // ← Se fullRemote, skippa il controllo presenze
            if (!isFullRemote) {
                const totalePersone: number = await EmployeeModel.countDocuments({
                    role: { $ne: 'admin' },
                    fullRemote: { $ne: true }
                });

                const totaleInSmart: number = await getTotaleInSmart(
                    body.dataInizio,
                    Number(body.employeeId || user.id)
                );

                const inPresenza: number = totalePersone - totaleInSmart - 1;
                const minimoPresenza: number = totalePersone - SMART_CONFIG.MAX_PERSONE_IN_SMART;

                console.log(`👥 Totale: ${totalePersone} | In smart: ${totaleInSmart} | In presenza dopo: ${inPresenza} | Minimo: ${minimoPresenza}`);

                if (inPresenza < minimoPresenza) {
                    return NextResponse.json(
                        {
                            error: `Smartworking non approvabile: rimarrebbero solo ${inPresenza} persone in presenza (minimo richiesto: ${minimoPresenza}).`,
                            inPresenza,
                            minimoPresenza,
                            totalePersone,
                        },
                        { status: 409 }
                    );
                }
            } else {
                console.log(`🏠 Dipendente fullRemote: skip controllo presenze`);
            }

            status = 'approved';
            approvedBy = user.id;
            console.log('✅ Auto-approvato: smartworking');
        }

        if (typeNorm === 'festivita') {
            status = 'approved';
            approvedBy = user.id;
            console.log(' Auto-approvato: festivita');
        }

        const newAbsence = await createAbsence({
            employeeId: Number(body.employeeId || user.id),
            type: typeNorm,
            dataInizio: body.dataInizio,
            durata: Number(body.durata),
            motivo: (body.motivo || '').trim(),
            status: status,
            requestedBy: body.requestedBy || user.name || user.email,
            approvedBy: approvedBy,
            createdAt: body.createdAt || new Date().toISOString(),
            updatedAt: body.updatedAt || new Date().toISOString(),
            data: body.dataInizio,
            stato: status,
            tipo: typeNorm
        });

        console.log(' Richiesta creata:', newAbsence.id, '| Status:', status);

        const tipiRichiedonoApprovazione = ['ferie', 'permesso', 'malattia', 'fuori-sede', 'congedo-parentale'];

        if (status === 'pending' && tipiRichiedonoApprovazione.includes(typeNorm)) {
            try {
                const admins = await getEmployeesByRole('admin');

                if (admins.length > 0) {
                    const tipoLabels: Record<string, string> = {
                        'ferie': 'Ferie',
                        'permesso': 'Permesso',
                        'malattia': 'Malattia',
                        'fuori-sede': 'Fuori Sede',
                        'congedo-parentale': 'Congedo Parentale'
                    };

                    const tipoLabel = tipoLabels[typeNorm] || 'Assenza';
                    const notificationType = typeNorm === 'permesso' ? 'permit_request' : 'leave_request';
                    const dataFormattata = new Date(body.dataInizio).toLocaleDateString('it-IT');
                    const unitaMisura = typeNorm === 'permesso' ? 'ore' : 'giorni';

                    for (const admin of admins) {
                        try {
                            await sendNotification({
                                userId: String(admin.id),
                                type: notificationType,
                                title: `Nuova Richiesta di ${tipoLabel}`,
                                body: `${user.name} ha richiesto ${tipoLabel} dal ${dataFormattata} (${body.durata} ${unitaMisura})`,
                                relatedRequestId: String(newAbsence.id),
                                url: `/dashboard/approvazioni`
                            });
                            console.log(` Notifica inviata ad admin ${admin.name} (ID: ${admin.id})`);
                        } catch (notifError) {
                            console.error(` Errore notifica admin ${admin.id}:`, notifError);
                        }
                    }
                } else {
                    console.warn(' Nessun admin trovato per le notifiche');
                }
            } catch (adminError) {
                console.error(' Errore recupero admin:', adminError);
            }
        }

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

        // Recupera la richiesta per la notifica
        const absences = await getAbsences({});
        const absence = absences.find((a: any) => a.id === Number(id));

        if (!absence) {
            return NextResponse.json({ error: 'Assenza non trovata' }, { status: 404 });
        }

        // Aggiorna lo stato
        const result = await updateAbsenceStatus(
            id,
            action === 'approve' ? 'approved' : 'rejected',
            user.id
        );

        if (!result) {
            return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 404 });
        }

        console.log('✅ Aggiornato:', { id, status: action });

        //  INVIA NOTIFICA AL DIPENDENTE
        try {
            const typeNorm = absence.type?.toLowerCase() || absence.tipo?.toLowerCase();

            // Mappa tipo → label
            const tipoLabels: Record<string, string> = {
                'ferie': 'Ferie',
                'permesso': 'Permesso',
                'malattia': 'Malattia',
                'fuori-sede': 'Fuori Sede',
                'congedo-parentale': 'Congedo Parentale',
                'smartworking': 'Smartworking',
                'festivita': 'Festività'
            };

            const tipoLabel = tipoLabels[typeNorm] || 'Assenza';

            let notificationType: 'leave_approved' | 'leave_rejected' | 'permit_approved' | 'permit_rejected';

            if (typeNorm === 'permesso') {
                notificationType = action === 'approve' ? 'permit_approved' : 'permit_rejected';
            } else {
                notificationType = action === 'approve' ? 'leave_approved' : 'leave_rejected';
            }

            const statusLabel = action === 'approve' ? 'approvata' : 'rifiutata';
            const emoji = action === 'approve' ? '✅' : '❌';
            const dataFormattata = new Date(absence.dataInizio || absence.data).toLocaleDateString('it-IT');

            await sendNotification({
                userId: String(absence.employeeId),
                type: notificationType,
                title: `${tipoLabel} ${statusLabel}`,
                body: `${emoji} La tua richiesta di ${tipoLabel} del ${dataFormattata} è stata ${statusLabel} da ${user.name}`,
                relatedRequestId: String(absence.id),
                url: `/dashboard/miei-dati`
            });

            console.log(`✅ Notifica ${action} inviata al dipendente ${absence.employeeId}`);
        } catch (notifError) {
            console.error('❌ Errore invio notifica dipendente:', notifError);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ PATCH error:', error);
        return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 });
    }
}
