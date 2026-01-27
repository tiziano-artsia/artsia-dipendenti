'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface MyAbsence {
    id: number;
    data: string;
    tipo: string;
    durata: number;
    token: string;
    stato: 'pending' | 'approved' | 'rejected';
}

interface FormData {
    tipo: string;
    data: string;
    durata: string;
    motivo: string;
}

export function useMyAbsences() {
    const { token } = useAuth() as any;
    const [assenze, setAssenze] = useState<MyAbsence[]>([]);
    const [loading, setLoading] = useState(false);  // ← START FALSE
    const [error, setError] = useState<string | null>(null);

    // 🔍 DEBUG
    console.log('🔍 useMyAbsences render - token:', !!token);

    const fetchAssenze = useCallback(async () => {
        console.log('🚀 fetchAssenze chiamata');

        if (!token) {
            console.log('⏹️ No token - skip');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('📡 Fetch /api/my-absences...');
            const res = await fetch('/api/my-absences', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📄 Status:', res.status);

            if (!res.ok) {
                const errText = await res.text();
                console.error('❌ API Error:', res.status, errText);
                setError(`API ${res.status}: ${errText}`);
                setAssenze([]);
                return;
            }

            const data = await res.json();
            console.log('✅ Data:', data.data?.length || 0);
            setAssenze(data.data || []);

        } catch (err: any) {
            console.error('💥 Network error:', err.message);
            setError('Connessione fallita');
            setAssenze([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        console.log('⚙️ useEffect trigger');
        fetchAssenze();
    }, [fetchAssenze]);

    const submitRequest = async (form: FormData) => {
        console.log('📤 Submit form:', form);

        if (!token) {
            console.error('❌ No token per submit');
            return false;
        }

        try {
            const res = await fetch('/api/absences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: form.tipo,
                    dataInizio: form.data,
                    durata: parseInt(form.durata),
                    motivo: form.motivo
                })
            });

            console.log('📤 Submit status:', res.status);

            if (res.ok) {
                console.log('✅ Submit OK - refresh');
                await fetchAssenze();
                return true;
            } else {
                const err = await res.text();
                console.error('❌ Submit error:', err);
                return false;
            }
        } catch (err: any) {
            console.error('💥 Submit catch:', err);
            return false;
        }
    };

    console.log('📊 Return:', { assenze: assenze.length, loading, error, token: !!token });

    return {
        assenze,
        loading,
        error,
        submitRequest,
        refetch: fetchAssenze
    };
}
