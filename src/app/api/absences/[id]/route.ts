import {NextResponse} from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { action } = await request.json();

    try {
        const user = getUserFromToken(request);

        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        if (user.role !== 'manager' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        // ✅ Prima recupera la richiesta
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
            let notificationType: 'leave_approved' | 'leave_rejected' | 'permit_approved' | 'permit_rejected';
            let tipoLabel: string;

            if (typeNorm === 'ferie') {
                notificationType = action === 'approve' ? 'leave_approved' : 'leave_rejected';
                tipoLabel = 'Ferie';
            } else if (typeNorm === 'permesso') {
                notificationType = action === 'approve' ? 'permit_approved' : 'permit_rejected';
                tipoLabel = 'Permesso';
            } else {
                notificationType = action === 'approve' ? 'leave_approved' : 'leave_rejected';
                tipoLabel = 'Malattia';
            }

            const statusLabel = action === 'approve' ? 'approvata' : 'rifiutata';
            const emoji = action === 'approve' ? '✅' : '❌';
            const dataFormattata = new Date(absence.dataInizio || absence.data).toLocaleDateString('it-IT');

            await sendNotification({
                userId: String(absence.employeeId),
                type: notificationType,
                title: `${tipoLabel} ${statusLabel}`,
                body: `${emoji} La tua richiesta di ${typeNorm} del ${dataFormattata} è stata ${statusLabel} da ${user.name}`,
                relatedRequestId: String(absence.id),
                url: `/dashboard/miei-dati`
            });

            console.log(`✅ Notifica ${action} inviata al dipendente ${absence.employeeId}`);
        } catch (notifError) {
            console.error('❌ Errore invio notifica dipendente:', notifError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
