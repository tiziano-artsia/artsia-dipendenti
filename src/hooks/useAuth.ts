// src/hooks/useAuth.ts - IL TUO + TOKEN
'use client';

import { useState, useEffect } from 'react';

export interface Employee {
    id: number;
    name: string;
    email: string;
    team: string;
    role: string;
}

export interface AuthContextType {
    user: Employee | null;
    token: string | null;  // ← GIÀ OK
    login: (userData: Employee, token?: string) => void;  // ← TOKEN PARAM
    logout: () => void;
    loading: boolean;
}

export function useAuth() {
    const [user, setUser] = useState<Employee | null>(null);
    const [token, setToken] = useState<string | null>(null);  // ← AGGIUNGI
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');  // ← AGGIUNGI

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                // ignore
            }
        }

        if (storedToken) {  // ← AGGIUNGI
            setToken(storedToken);
        }

        setLoading(false);
    }, []);

    const login = (userData: Employee, loginToken?: string) => {  // ← TOKEN PARAM
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', loginToken || '');  // ← SALVA TOKEN
        setUser(userData);
        if (loginToken) setToken(loginToken);  // ← SET TOKEN
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');  // ← PULISCI TOKEN
        setUser(null);
        setToken(null);  // ← RESET TOKEN
    };

    console.log('🔍 useAuth return:', { user: !!user, token: !!token });  // DEBUG

    return { user, token, login, logout, loading };  // ← TOKEN ESPORTO
}

