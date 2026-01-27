// src/hooks/useAbsences.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface Absence {
    id: number;
    employeeId: number;
    type: string;
    dataInizio: string;
    durata: number;
    motivo: string;
    status: 'pending' | 'approved' | 'rejected';
}

export function useAbsences() {
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getToken = useCallback(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    }, []);

    const fetchAbsences = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setError('Non autenticato');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/absences', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }
                throw new Error(await res.text());
            }

            const data = await res.json();
            if (data.success) {
                setAbsences(data.data || []);
            }
        } catch (err: any) {
            console.error('Fetch absences error:', err);
            setError(err.message || 'Errore caricamento assenze');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchAbsences();
    }, [fetchAbsences]);

    const createAbsence = async (absence: Omit<Absence, 'id' | 'status'>) => {
        const token = getToken();
        if (!token) throw new Error('Non autenticato');

        // 🔑 DECODE token per ottenere nome utente richiedente
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const nomeUtente = payload.name || payload.nome || 'Anonimo';

            const res = await fetch('/api/absences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...absence,
                    requestedBy: nomeUtente
                })
            });

            const data = await res.json();
            if (data.success) {
                await fetchAbsences();
                return data.data;
            }
            throw new Error(data.error || 'Errore creazione assenza');
        } catch (decodeError) {
            console.warn('Token decode failed:', decodeError);

        }
    };


    const approveAbsence = async (id: number, status: 'approved' | 'rejected') => {
        const token = getToken();
        if (!token) throw new Error('Non autenticato');

        const res = await fetch(`/api/absences/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await res.json();
        if (data.success) {
            await fetchAbsences();
        }
        return data;
    };

    return {
        absences,
        loading,
        error,
        createAbsence,
        approveAbsence,
        refetch: fetchAbsences
    };
}
