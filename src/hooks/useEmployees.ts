'use client';


import { useState, useEffect, useCallback } from 'react';

export function useEmployees() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Token mancante');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/employees', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            setEmployees(Array.isArray(data.data) ? data.data : []);
        } catch (err: any) {
            setError(err.message || 'Errore caricamento dipendenti');
            console.error('❌ useEmployees error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const refetch = useCallback(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    return {
        employees,
        loading,
        error,
        refetch
    };
}
