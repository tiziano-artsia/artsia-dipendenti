// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { authenticateUser } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(request: NextRequest) {
    console.log('🚀 LOGIN API CHIAMATA');

    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email e password richiesti' },
                { status: 400 }
            );
        }

        const user = await authenticateUser(email, password);  // ✅ Type-safe

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Credenziali errate' },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ LOGIN:', user.email, user.role);

        return NextResponse.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error: any) {
        console.error('💥 LOGIN ERROR:', error);
        return NextResponse.json(
            { success: false, error: 'Errore server' },
            { status: 500 }
        );
    }
}
