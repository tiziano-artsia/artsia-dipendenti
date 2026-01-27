// src/app/api/approvazioni/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Il tuo DB connect
import { ObjectId } from 'mongodb';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const { action } = await request.json();

    console.log('🔍 API Approvazione:', { id, action });

    try {
        const db = await connectToDatabase();
        const collection = db.collection('richieste'); // Nome tua collection

        const result = await collection.updateOne(
            { _id: new ObjectId(id) }, // ← ObjectId!
            {
                $set: {
                    status: action === 'approve' ? 'approved' : 'rejected',
                    approvedBy: 'manager', // O user.id
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
