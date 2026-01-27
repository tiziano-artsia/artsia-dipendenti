import { NextRequest, NextResponse } from 'next/server';
import { connectDB, updateAbsenceStatus } from '@/lib/db';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { action } = await request.json();

    try {
        const success = await updateAbsenceStatus(
            id,
            action === 'approve' ? 'approved' : 'rejected',
            1  // manager ID
        );

        if (!success) {
            return NextResponse.json({ error: 'Assenza non trovata' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('💥 Error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
