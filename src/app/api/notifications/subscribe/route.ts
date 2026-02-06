import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';
import { verifyAuth, createAuthError } from '@/lib/authMiddleware';

export async function POST(request: NextRequest) {
    try {
        // Usa il tuo sistema di autenticazione JWT
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        const { subscription } = await request.json();

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json(
                { success: false, error: 'Dati subscription non validi' },
                { status: 400 }
            );
        }

        await connectDB();

        const userAgent = request.headers.get('user-agent') || undefined;

        // Upsert: aggiorna se esiste, crea se non esiste
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
                createdAt: new Date() // Resetta il timer di scadenza
            },
            {
                upsert: true,
                new: true
            }
        );

        console.log('✅ Subscription salvata:', result._id);

        return NextResponse.json({
            success: true,
            message: 'Subscription salvata con successo',
            subscriptionId: result._id
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

        console.log('✅ Subscription rimossa:', result.deletedCount);

        return NextResponse.json({
            success: true,
            message: 'Subscription rimossa con successo'
        });
    } catch (error: any) {
        console.error('❌ Errore rimozione subscription:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server', details: error.message },
            { status: 500 }
        );
    }
}
