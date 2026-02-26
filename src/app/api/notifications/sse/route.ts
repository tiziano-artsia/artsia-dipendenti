import { NextRequest } from 'next/server';
import {getNotificationsForUser} from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response('userId required', { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            //  Invia notifiche correnti
            const currentNotifications = await getNotificationsForUser(userId);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'init',
                notifications: currentNotifications
            })}\n\n`));

            // Controlla nuovi dati ogni 3s (server-side)
            const checkInterval = setInterval(async () => {
                const updatedNotifications = await getNotificationsForUser(userId);
                if (updatedNotifications.length !== currentNotifications.length) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'update',
                        notifications: updatedNotifications
                    })}\n\n`));
                }
            }, 2000);

            //  Cleanup automatico
            req.signal.addEventListener('abort', () => {
                clearInterval(checkInterval);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        }
    });
}

