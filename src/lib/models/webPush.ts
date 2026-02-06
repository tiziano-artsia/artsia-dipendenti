import webpush from 'web-push';

// Configura VAPID
if (
    process.env.VAPID_EMAIL &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('⚠️ Chiavi VAPID non configurate correttamente');
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    requestId?: string;
    type?: string;
    requireInteraction?: boolean;
    tag?: string;
    actions?: Array<{ action: string; title: string }>;
}

export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Invia una push notification a una subscription specifica
 */
export async function sendPushNotification(
    subscription: PushSubscriptionData,
    payload: PushPayload
): Promise<void> {
    try {
        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/dashboard',
            requestId: payload.requestId,
            type: payload.type,
            requireInteraction: payload.requireInteraction || false,
            tag: payload.tag || `artsia-${payload.type || 'notification'}`,
            actions: payload.actions || []
        });

        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            },
            pushPayload,
            {
                TTL: 60 * 60 * 24, // 24 ore
            }
        );

        console.log('✅ Push notification inviata con successo');
    } catch (error: any) {
        console.error('❌ Errore invio push notification:', error);

        // Se la subscription è scaduta o invalida, rilancia l'errore
        if (error.statusCode === 410 || error.statusCode === 404) {
            throw new Error('SUBSCRIPTION_EXPIRED');
        }

        throw error;
    }
}

/**
 * Invia una push notification a più subscriptions
 */
export async function sendPushNotificationToMultiple(
    subscriptions: PushSubscriptionData[],
    payload: PushPayload
): Promise<{
    success: number;
    failed: number;
    expiredSubscriptions: string[];
}> {
    const expiredSubscriptions: string[] = [];
    let success = 0;
    let failed = 0;

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            try {
                await sendPushNotification(sub, payload);
                success++;
                return { success: true, endpoint: sub.endpoint };
            } catch (error: any) {
                failed++;
                if (error.message === 'SUBSCRIPTION_EXPIRED') {
                    expiredSubscriptions.push(sub.endpoint);
                }
                return { success: false, endpoint: sub.endpoint, error };
            }
        })
    );

    return {
        success,
        failed,
        expiredSubscriptions
    };
}

export default webpush;
