import { NextRequest, NextResponse } from 'next/server';
import { updateAbsenceStatus, deleteAbsence } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
    name: string;
    email: string;
    id: number;
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const user = getUserFromToken(request);

        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const success = await deleteAbsence(id, user.id);

        if (!success) {
            return NextResponse.json(
                { error: 'Impossibile cancellare la richiesta. Verifica che sia tua e in stato pending.' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Richiesta annullata con successo'
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Errore server durante la cancellazione',
            details: error.message
        }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { action } = await request.json();

    try {
        const user = getUserFromToken(request);

        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        if (user.role !== 'manager' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        const success = await updateAbsenceStatus(
            id,
            action === 'approve' ? 'approved' : 'rejected',
            user.id
        );

        if (!success) {
            return NextResponse.json({ error: 'Assenza non trovata' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const user = getUserFromToken(request);

        if (!user) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        return NextResponse.json({
            error: 'Metodo non implementato'
        }, { status: 501 });

    } catch (error) {
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
