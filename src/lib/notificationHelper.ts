import type {NotificationType} from '@/lib/models/Notification';
import { sendNotification } from './sendNotification';

/**
 * Helper per notificare gli admin di una nuova richiesta
 */
export async function notifyAdminsNewRequest(
    employeeName: string,
    requestType: 'ferie' | 'permesso',
    startDate: string,
    endDate: string,
    requestId: string,
    adminIds: string[]
) {
    const notifications = adminIds.map(adminId =>
        sendNotification({
            userId: adminId,
            type: (requestType === 'ferie' ? 'leave_request' : 'permit_request') as NotificationType,
            title: `Nuova Richiesta di ${requestType === 'ferie' ? 'Ferie' : 'Permesso'}`,
            body: `${employeeName} ha richiesto ${requestType} dal ${startDate} al ${endDate}`,
            relatedRequestId: requestId,
            url: `/dashboard/approvazioni/${requestId}`,
        })
    );

    const results = await Promise.all(notifications);
    console.log('📢 Notifiche admin inviate:', results);
}

/**
 * Helper per notificare il dipendente dell'approvazione
 */
export async function notifyEmployeeApproval(
    userId: string,
    requestType: 'ferie' | 'permesso',
    approved: boolean,
    requestId: string,
    startDate?: string,
    endDate?: string
) {
    const type = (requestType === 'ferie'
        ? (approved ? 'leave_approved' : 'leave_rejected')
        : (approved ? 'permit_approved' : 'permit_rejected')) as NotificationType;

    const title = approved
        ? `Richiesta ${requestType === 'ferie' ? 'Ferie' : 'Permesso'} Approvata ✅`
        : `Richiesta ${requestType === 'ferie' ? 'Ferie' : 'Permesso'} Rifiutata ❌`;

    let body = approved
        ? `La tua richiesta di ${requestType} è stata approvata`
        : `La tua richiesta di ${requestType} è stata rifiutata`;

    if (startDate && endDate) {
        body += ` (${startDate} - ${endDate})`;
    }

    const result = await sendNotification({
        userId,
        type,
        title,
        body,
        relatedRequestId: requestId,
        url: `/dashboard/approvazioni`
    });

    console.log('📢 Notifica dipendente inviata:', result);
}
