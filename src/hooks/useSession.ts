// src/hooks/useSession.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    nome: string;
    email: string;
    role: 'admin' | 'manager' | 'dipendente';
}

export function useSession() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }, []);

    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: decoded.id,
                    nome: decoded.nome || decoded.email.split('@')[0],
                    email: decoded.email,
                    role: decoded.role
                });
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, [getToken]);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
        router.refresh();
    };

    return { user, loading, logout };
}
