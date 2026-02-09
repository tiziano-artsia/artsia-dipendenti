import {type NextRequest, NextResponse} from "next/server";
import {getUserFromToken} from "@/lib/auth";
import {deleteAbsence, updateAbsenceStatus} from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { action } = await request.json();

    try {
        const user = await getUserFromToken(request);

        if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        // Prima recupera la richiesta
        const { getAbsences } = await import('@/lib/db');
        const absences = await getAbsences({});
        const absence = absences.find((a: any) => a.id === Number(id));

        if (!absence) {
            return NextResponse.json({ error: 'Assenza non trovata' }, { status: 404 });
        }

        const success = await updateAbsenceStatus(
            id,
            action === 'approve' ? 'approved' : 'rejected',
            user.id
        );

        if (!success) {
            return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 404 });
        }

        // ✅ INVIA NOTIFICA AL DIPENDENTE
        try {
            const { sendNotification } = await import('@/lib/sendNotification');

            const typeNorm = absence.type?.toLowerCase() || absence.tipo?.toLowerCase();

            // ✅ Mappa completa tipo → label
            const tipoLabels: Record<string, string> = {
                'ferie': 'Ferie',
                'permesso': 'Permesso',
                'malattia': 'Malattia',
                'smartworking': 'Smartworking',
                'festivita': 'Festività',
                'fuori-sede': 'Fuori Sede',
                'congedo-parentale': 'Congedo Parentale'
            };

            const tipoLabel = tipoLabels[typeNorm] || 'Assenza';

            // Determina il tipo di notifica
            let notificationType: 'leave_approved' | 'leave_rejected' | 'permit_approved' | 'permit_rejected';

            if (typeNorm === 'permesso') {
                notificationType = action === 'approve' ? 'permit_approved' : 'permit_rejected';
            } else {
                // Tutti gli altri tipi usano leave_*
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

            console.log(`✅ Notifica ${action} inviata al dipendente ${absence.employeeId} per ${tipoLabel}`);
        } catch (notifError) {
            console.error('❌ Errore invio notifica dipendente:', notifError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ PATCH error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}


export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromToken(request);

        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const { id } = await params;

        console.log('🗑️ DELETE richiesta:', { id, userId: user.id });

        // Cancella l'assenza (la funzione deleteAbsence già verifica che sia del dipendente)
        const success = await deleteAbsence(id, user.id);

        if (!success) {
            return NextResponse.json(
                { error: 'Assenza non trovata o non autorizzato' },
                { status: 404 }
            );
        }

        console.log('✅ Assenza eliminata:', id);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('❌ DELETE error:', error);
        return NextResponse.json(
            { error: 'Errore server', details: error.message },
            { status: 500 }
        );
    }
}