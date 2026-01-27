'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface PendingRequest {
    requestedBy: string;
    ruolo: string;
    id: number | string;
    dipendente: string;
    team?: string;
    tipo: string;
    data: string;
    durata: number | string;
    stato: 'pending' | 'approved' | 'rejected';
    motivo?: string;
}

export function usePendingRequests() {
    const { token } = useAuth();
    const [richieste, setRichieste] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRichieste = useCallback(async () => {
        console.log('🚀 fetchRichieste START');

        if (!token) {
            console.log('❌ NO TOKEN');
            setRichieste([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/absences', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('❌ API ERROR:', res.status, errText);
                setError(`Errore API ${res.status}`);
                setRichieste([]);
                return;
            }

            const data = await res.json();
            console.log('✅ API DATA:', data.data?.length || 0);

            // 🔥 MAPPING + FILTER pending
            const pendingMapped = (data.data || [])
                .filter((r: any) => r.status === 'pending')
                .map((r: any) => ({
                    id: r.id,                    // 1768312766718
                    dipendente: r.requestedBy || `ID ${r.employeeId}`,  // ← Mappa employeeId → nome (TEMP)
                    tipo: r.type.toUpperCase(),  // "PERMESSO"
                    data: r.dataInizio,          // "2026-01-13"
                    durata: `${r.durata} ore`,   // "2 ore"
                    stato: r.status,             // "pending"
                    motivo: r.motivo || ''
                }));

            console.log('🔍 MAPPED PENDING:', pendingMapped);
            setRichieste(pendingMapped);

        } catch (err: any) {
            console.error('💥 Fetch error:', err.message);
            setError('Connessione fallita: ' + err.message);
            setRichieste([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRichieste();
    }, [fetchRichieste]);

    const approva = async (id: number | string): Promise<boolean> => {
        console.log('✅ APPROVA ID:', id, typeof id);

        if (!token) return false;

        try {
            const res = await fetch('/api/absences', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id, action: 'approve' })
            });

            console.log('📄 Approva:', res.status);

            if (res.ok) {
                console.log('✅ APPROVATO - Refresh');
                fetchRichieste();
                return true;
            } else {
                const err = await res.text();
                console.error('❌ Approva fail:', err);
                return false;
            }
        } catch (err: any) {
            console.error('💥 Approva:', err);
            return false;
        }
    };

    const rifiuta = async (id: number | string): Promise<boolean> => {
        console.log('❌ RIFIUTA ID:', id, typeof id);

        if (!token) return false;

        try {
            const res = await fetch('/api/absences', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id, action: 'reject' })
            });

            console.log('📄 Rifiuta:', res.status);

            if (res.ok) {
                console.log('✅ RIFIUTATO - Refresh');
                fetchRichieste();
                return true;
            } else {
                const err = await res.text();
                console.error('❌ Rifiuta fail:', err);
                return false;
            }
        } catch (err: any) {
            console.error('💥 Rifiuta:', err);
            return false;
        }
    };

    console.log('📊 RETURN:', { len: richieste.length, sample: richieste[0] });

    return {
        richieste,
        loading,
        error,
        approva,
        rifiuta
    };
}
