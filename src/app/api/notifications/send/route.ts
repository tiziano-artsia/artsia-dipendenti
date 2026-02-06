import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, createAuthError } from '@/lib/authMiddleware';
import { sendNotification } from '@/lib/sendNotification';

export async function POST(request: NextRequest) {
    try {
        // Verifica autenticazione
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        // Solo gli admin possono inviare notifiche manualmente
        if (user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Non autorizzato' },
                { status: 403 }
            );
        }

        const {
            userId,
            type,
            title,
            body,
            relatedRequestId,
            url
        } = await request.json();

        // Validazione
        if (!userId || !type || !title || !body) {
            return NextResponse.json(
                { success: false, error: 'Dati mancanti (userId, type, title, body richiesti)' },
                { status: 400 }
            );
        }

        const result = await sendNotification({
            userId,
            type,
            title,
            body,
            relatedRequestId,
            url
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('❌ Errore API send notifiche:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server' },
            { status: 500 }
        );
    }
}
