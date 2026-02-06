// app/api/notifications/stream/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Invia un heartbeat ogni 30s per mantenere connessione
            const intervalId = setInterval(() => {
                controller.enqueue(encoder.encode(': heartbeat\n\n'));
            }, 30000);



            request.signal.addEventListener('abort', () => {
                clearInterval(intervalId);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
