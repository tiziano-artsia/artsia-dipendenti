'use client';

import { useState, useEffect } from 'react';

interface Payslip {
    id: number;
    mese: string;
    anno: string;
    netto: string;
    employeeName: string;
}

export function useUserPayslips() {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserPayslips = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Token mancante');
                }

                const res = await fetch('/api/payslips/my', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw new Error('Errore nel caricamento');
                }

                const data = await res.json();
                setPayslips(data.data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPayslips();
    }, []);

    return { payslips, loading, error };
}
