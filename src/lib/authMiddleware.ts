import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthUser {
    id: string;
    email: string;
    role: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
    try {
        const authHeader = request.headers.get('authorization');
        let token: string | null = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (!token) {
            token = request.cookies.get('token')?.value || null;
        }

        if (!token) {
            console.log('⚠️ Token non trovato nella richiesta');
            return null;
        }

        const decoded = await verifyToken(token);

        if (!decoded) {
            console.log('⚠️ Token non valido o scaduto');
            return null;
        }

        // CONVERTI ID IN STRINGA
        return {
            id: String(decoded.id), // <-- IMPORTANTE: converte a stringa
            email: decoded.email,
            role: decoded.role
        };
    } catch (error) {
        console.error('❌ Errore verifica JWT:', error);
        return null;
    }
}

export function createAuthError(message: string = 'Non autenticato') {
    return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
    );
}
