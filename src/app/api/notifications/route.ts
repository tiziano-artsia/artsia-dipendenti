import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { verifyAuth, createAuthError } from '@/lib/authMiddleware';

export async function GET(request: NextRequest) {

    try {
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        const query: any = { userId: user.id };

        if (unreadOnly) {
            query.read = false;
        }

        const [notifications, unreadCount, totalCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean(),
            Notification.countDocuments({
                userId: user.id,
                read: false
            }),
            Notification.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            notifications,
            unreadCount,
            totalCount,
            hasMore: totalCount > skip + limit
        });
    } catch (error: any) {
        console.error('❌ Errore recupero notifiche:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH - Aggiorna notifiche (segna come lette/non lette)
export async function PATCH(request: NextRequest) {
    try {
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        const { notificationIds, read } = await request.json();

        if (!Array.isArray(notificationIds) || typeof read !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'Dati non validi' },
                { status: 400 }
            );
        }

        await connectDB();

        const result = await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                userId: user.id
            },
            { read }
        );

        console.log(`✅ Aggiornate ${result.modifiedCount} notifiche`);

        return NextResponse.json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error: any) {
        console.error('❌ Errore aggiornamento notifiche:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Elimina notifiche
export async function DELETE(request: NextRequest) {
    try {
        const user = await verifyAuth(request);

        if (!user) {
            return createAuthError();
        }

        const { notificationIds } = await request.json();

        if (!Array.isArray(notificationIds)) {
            return NextResponse.json(
                { success: false, error: 'notificationIds deve essere un array' },
                { status: 400 }
            );
        }

        await connectDB();

        const result = await Notification.deleteMany({
            _id: { $in: notificationIds },
            userId: user.id
        });

        console.log(`🗑️ Eliminate ${result.deletedCount} notifiche`);

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount
        });
    } catch (error: any) {
        console.error('❌ Errore eliminazione notifiche:', error);
        return NextResponse.json(
            { success: false, error: 'Errore interno del server', details: error.message },
            { status: 500 }
        );
    }
}
