// hooks/useStats.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Stats {
    ferie: number;
    permessi: number;
    smartworking: number;
    malattia: number;
}

export function useStats() {
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats>({
        ferie: 0,
        permessi: 0,
        smartworking: 0,
        malattia: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error('Errore caricamento statistiche');
                }

                const data = await res.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (err) {
                console.error('❌ Fetch stats error:', err);
                setError(err instanceof Error ? err.message : 'Errore sconosciuto');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);

    return { stats, loading, error };
}
