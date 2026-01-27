'use client';

import { useState, useEffect } from 'react';

export function useEmployees() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmployees = async () => {
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
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    return { employees, loading, error };
}
