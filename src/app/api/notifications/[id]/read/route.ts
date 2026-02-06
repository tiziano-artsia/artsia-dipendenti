// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
    id: number;
    name: string;
    email: string;
    role: string;
}

function getUserFromToken(request: NextRequest): JWTPayload | null {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) return null;

        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const user = getUserFromToken(request);

        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        await connectDB();

        console.log(`📝 Segnando notifica ${id} come letta per user ${user.id}`);

        // Segna la notifica come letta (verifica che appartenga all'utente)
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: String(user.id) },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            console.log(`❌ Notifica ${id} non trovata per user ${user.id}`);
            return NextResponse.json(
                { error: 'Notifica non trovata' },
                { status: 404 }
            );
        }

        console.log(`✅ Notifica ${id} segnata come letta`);

        return NextResponse.json({
            success: true,
            message: 'Notifica segnata come letta',
            notification
        });

    } catch (error: any) {
        console.error('❌ Errore mark as read:', error);
        return NextResponse.json(
            { error: 'Errore interno del server', details: error.message },
            { status: 500 }
        );
    }
}
