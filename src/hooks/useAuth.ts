// src/hooks/useAuth.ts - IL TUO + TOKEN
'use client';

import { useState, useEffect } from 'react';
import {NativeBiometric} from "@capgo/capacitor-native-biometric";

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

/** Restituisce true se il JWT è scaduto (o non valido) */
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp è in secondi
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
}

function clearSession() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
}

export function useAuth() {
    const [user, setUser] = useState<Employee | null>(null);
    const [token, setToken] = useState<string | null>(null);  // ← AGGIUNGI
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');  // ← AGGIUNGI

        if (storedToken && isTokenExpired(storedToken)) {
            // Token scaduto: pulisci subito senza loggare l'utente
            clearSession();
            setLoading(false);
            return;
        }

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

    // Intercetta globalmente i 401 da fetch (token scaduto durante la sessione)
    useEffect(() => {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (response.status === 401) {
                const cloned = response.clone();
                try {
                    const data = await cloned.json();
                    if (data?.error?.toLowerCase().includes('scadut') ||
                        data?.error?.toLowerCase().includes('expired') ||
                        data?.error?.toLowerCase().includes('invalid token') ||
                        data?.error?.toLowerCase().includes('non autenticato')) {
                        clearSession();
                        setUser(null);
                        setToken(null);
                        window.location.href = '/login';
                    }
                } catch { /* risposta non JSON, ignora */ }
            }
            return response;
        };
        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    const login = (userData: Employee, loginToken?: string) => {  // ← TOKEN PARAM
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', loginToken || '');  // ← SALVA TOKEN
        setUser(userData);
        if (loginToken) setToken(loginToken);  // ← SET TOKEN
    };

    async function logout(){
        try {
            await NativeBiometric.deleteCredentials({
                server: 'artsia-app',
            });
            localStorage.removeItem('has_biometric_credentials');
        } catch (error) {
            console.error('Error deleting biometric credentials:', error);
        }
        clearSession();
        setUser(null);
        setToken(null);  // ← RESET TOKEN
    };

    console.log('🔍 useAuth return:', { user: !!user, token: !!token });  // DEBUG

    return { user, token, login, logout, loading };  // ← TOKEN ESPORTO
}


