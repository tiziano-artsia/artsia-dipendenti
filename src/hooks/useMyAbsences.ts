'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface MyAbsence {
    createdAt: any;
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

    const fetchAssenze = useCallback(async () => {

        if (!token) {
            console.log('⏹️ No token - skip');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/my-absences', {
                headers: { Authorization: `Bearer ${token}` }
            });


            if (!res.ok) {
                const errText = await res.text();
                setError(`API ${res.status}: ${errText}`);
                setAssenze([]);
                return;
            }

            const data = await res.json();
            setAssenze(data.data || []);

        } catch (err: any) {
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

    const submitRequest = async (form: { tipo: string; data: string; durata: number; motivo: string }) => {
        console.log('📤 Submit form:', form);

        if (!token) {
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
                    durata: parseInt(String(form.durata)),
                    motivo: form.motivo
                })
            });


            if (res.ok) {
                await fetchAssenze();
                return true;
            } else {
                const err = await res.text();
                return false;
            }
        } catch (err: any) {
            return false;
        }
    };

    console.log('📊 Return:', { assenze: assenze.length, loading, error, token: !!token });

    const cancelRequest = async (absenceId: string) => {

        if (!token) {
            return false;
        }

        try {
            const res = await fetch(`/api/absences/${absenceId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });


            if (!res.ok) {
                const error = await res.json();
                return false;
            }

            await fetchAssenze();
            return true;
        } catch (error) {
            return false;
        }
    };

    return {
        assenze,
        loading,
        error,
        cancelRequest,
        submitRequest,
        refetch: fetchAssenze
    };
}
