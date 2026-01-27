// src/app/api/approvazioni/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ← Promise!
) {
    const { id } = await params;  // ← await!

    const { action } = await request.json();

    console.log('🔍 API Approvazione:', { id, action });

    try {
        const db = await connectToDatabase();
        const collection = db.collection('richieste');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: action === 'approve' ? 'approved' : 'rejected',
                    approvedBy: 'manager',
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
        }

        console.log('✅ Update:', result);
        return NextResponse.json({ success: true, modified: result.modifiedCount });

    } catch (error) {
        console.error('💥 MongoDB Error:', error);
        return NextResponse.json({ error: 'Errore database' }, { status: 500 });
    }
}
