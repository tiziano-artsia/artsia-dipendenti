import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB, EmployeeModel } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function GET(req: NextRequest) {

    try {
        await connectDB();

        // @ts-ignore
        const holder = await EmployeeModel.findOne({ hasKeys: true })
            .select('name surname')
            .lean();

        const holderData = holder ? {
            name: `${holder.name || ''}`.trim()
        } : null;

        return NextResponse.json({ holder: holderData });
    } catch (error) {
        console.error(' GET keys error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    console.log(' POST /api/office-keys');

    try {
        await connectDB();

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: string | number; name: string };

        const body = await req.json();
        console.log('POST body:', body);

        // @ts-ignore
        await EmployeeModel.updateMany({}, { hasKeys: false });

        return NextResponse.json({
            success: true,
            message: 'Chiavi rilasciate',
            holder: null
        });
    } catch (error) {
        console.error('❌ POST keys error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
