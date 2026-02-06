import { connectDB } from './db';
import Notification from '@/lib/models/Notification';
import PushSubscription from '@/lib/models/PushSubscription';
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export async function sendNotification({
                                           userId,
                                           type,
                                           title,
                                           body,
                                           relatedRequestId,
                                           url
                                       }: {
    userId: string;
    type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'permit_request' | 'permit_approved' | 'permit_rejected';
    title: string;
    body: string;
    relatedRequestId?: string;
    url?: string;
}) {
    try {
        console.log('📬 sendNotification START:', { userId, type, title });

        await connectDB();

        // 1. Salva nel database
        const notification = await Notification.create({
            userId,
            type,
            title,
            body,
            relatedRequestId,
            read: false,
            createdAt: new Date()
        });

        console.log('✅ Notifica salvata nel DB:', notification._id);

        // 2. Recupera le subscription push dell'utente
        const subscriptions = await PushSubscription.find({ userId }).lean();
        console.log('🔍 Subscription trovate per userId', userId, ':', subscriptions.length);

        if (subscriptions.length === 0) {
            console.warn('⚠️ Nessuna subscription trovata per userId:', userId);
            return { success: true, message: 'Notifica salvata ma nessuna subscription' };
        }

        // 3. Invia push notification
        const payload = JSON.stringify({
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
                url: url || '/dashboard',
                notificationId: notification._id.toString(),
                type
            }
        });

        console.log('📤 Invio push a', subscriptions.length, 'dispositivi...');

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    console.log('📤 Invio a endpoint:', sub.endpoint.substring(0, 50) + '...');

                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.keys.p256dh,
                                auth: sub.keys.auth
                            }
                        },
                        payload
                    );

                    console.log('✅ Push inviata con successo a', sub.endpoint.substring(0, 50));
                    return { success: true, endpoint: sub.endpoint };
                } catch (error: any) {
                    console.error('❌ Errore invio push:', error.statusCode, error.body);

                    // Rimuovi subscription non valide
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log('🗑️ Rimozione subscription invalida');
                        await PushSubscription.deleteOne({ _id: sub._id });
                    }

                    throw error;
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`✅ Push inviate: ${successful}/${subscriptions.length}`);

        return {
            success: true,
            message: 'Notifica inviata',
            notificationId: notification._id.toString(),
            pushSent: successful
        };

    } catch (error) {
        console.error('❌ Errore sendNotification:', error);
        throw error;
    }
}
