// app/api/notifications/register-device/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';
import { verifyAuth, createAuthError } from '@/lib/authMiddleware';

export async function POST(request: NextRequest) {
    try {
        // ✅ Verifica autenticazione
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        const { subscription } = await request.json();

        // ✅ Validazione subscription
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json(
                { success: false, error: 'Dati subscription non validi' },
                { status: 400 }
            );
        }

        await connectDB();

        const userAgent = request.headers.get('user-agent') || '';

        // ✅ Rileva piattaforma da user agent
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'web';

        // ✅ Upsert: aggiorna se esiste, crea se non esiste
        // Questo previene duplicati quando l'utente riapre l'app
        const result = await PushSubscription.findOneAndUpdate(
            {
                userId: user.id,
                endpoint: subscription.endpoint
            },
            {
                userId: user.id,
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                },
                userAgent,
                platform, // ✅ Salva piattaforma
                lastUsed: new Date(), // ✅ Aggiorna timestamp
                createdAt: new Date()
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        console.log(`✅ Subscription salvata per user ${user.id} (${platform}):`, result._id);

        return NextResponse.json({
            success: true,
            message: 'Subscription salvata con successo',
            subscriptionId: result._id,
            platform
        });
    } catch (error: any) {
        console.error('❌ Errore salvataggio subscription:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json(
                { success: false, error: 'Endpoint mancante' },
                { status: 400 }
            );
        }

        await connectDB();

        const result = await PushSubscription.deleteOne({
            userId: user.id,
            endpoint
        });

        console.log(`✅ Subscription rimossa per user ${user.id}:`, result.deletedCount);

        return NextResponse.json({
            success: true,
            message: 'Subscription rimossa con successo',
            deletedCount: result.deletedCount
        });
    } catch (error: any) {
        console.error('❌ Errore rimozione subscription:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server', details: error.message },
            { status: 500 }
        );
    }
}

// ✅ GET per verificare subscription esistente (utile per debug)
export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        await connectDB();

        const subscriptions = await PushSubscription.find({ userId: user.id });

        return NextResponse.json({
            success: true,
            subscriptions: subscriptions.map(sub => ({
                id: sub._id,
                endpoint: sub.endpoint,
                platform: sub.platform,
                createdAt: sub.createdAt,
                lastUsed: sub.lastUsed
            }))
        });
    } catch (error: any) {
        console.error('❌ Errore recupero subscriptions:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server' },
            { status: 500 }
        );
    }
}
