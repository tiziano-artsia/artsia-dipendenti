import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB, EmployeeModel } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

/**
 * GET → Restituisce tutti gli utenti che hanno le chiavi
 */
export async function GET() {
    try {
        await connectDB();

        const holders = await EmployeeModel.find({ hasKeys: true })
            .select('_id name surname')
            .lean();

        const formatted = holders.map((h: any) => ({
            id: h._id.toString(),
            name: `${h.name || ''} ${h.surname || ''}`.trim(),
        }));

        return NextResponse.json({ holders: formatted });

    } catch (error) {
        console.error('GET office-keys error:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT → Utente loggato prende le chiavi
 */
export async function PUT(req: NextRequest) {
    try {
        await connectDB();

        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Non autenticato' },
                { status: 401 }
            );
        }

        await EmployeeModel.findByIdAndUpdate(user.id, {
            hasKeys: true,
        });

        return NextResponse.json({
            success: true,
            message: 'Chiavi prese',
        });

    } catch (error) {
        console.error('PUT office-keys error:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE → Utente loggato rilascia le chiavi
 */
export async function DELETE(req: NextRequest) {
    try {
        await connectDB();

        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Non autenticato' },
                { status: 401 }
            );
        }

        await EmployeeModel.findByIdAndUpdate(user.id, {
            hasKeys: false,
        });

        return NextResponse.json({
            success: true,
            message: 'Chiavi rilasciate',
        });

    } catch (error) {
        console.error('DELETE office-keys error:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

/**
 * Helper per estrarre utente dal JWT
 */
async function getUserFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
        return null;
    }
}