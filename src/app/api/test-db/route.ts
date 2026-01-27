import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({
            success: true,
            message: 'MongoDB Connesso!',
            connected: true
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Errore sconosciuto',
            connected: false
        }, { status: 500 });
    }
}
