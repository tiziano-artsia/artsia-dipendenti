import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

let authenticateUser;
try {
    authenticateUser = require('@/lib/db').authenticateUser;
    console.log('✅ DB import OK');
} catch (e) {
    console.error('❌ DB import ERROR:', e);
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-2026-change-me';

export async function POST(request: NextRequest) {
    console.log('🚀 LOGIN API CHIAMATA');

    try {
        const body = await request.json();
        console.log('📥 Body ricevuto:', body);

        const { email, password } = body;

        if (!email || !password) {
            console.log('❌ Campi mancanti');
            return NextResponse.json(
                { success: false, error: 'Email e password richiesti' },
                { status: 400 }
            );
        }

        // TEST DB
        if (!authenticateUser) {
            console.error('❌ authenticateUser NON ESISTE!');
            return NextResponse.json(
                { success: false, error: 'DB non configurato' },
                { status: 500 }
            );
        }

        console.log('🔍 Chiamata authenticateUser...');
        const user = await authenticateUser(email, password);
        console.log('👤 User result:', user ? `${user.name} (${user.role})` : 'NULL');

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

        console.log('✅ LOGIN SUCCESS!', user.email);

        return NextResponse.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error: any) {
        console.error('💥 ERRORE COMPLETO LOGIN:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json(
            { success: false, error: 'Errore interno: ' + error.message },
            { status: 500 }
        );
    }
}
