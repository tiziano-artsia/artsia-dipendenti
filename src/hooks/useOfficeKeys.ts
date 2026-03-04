'use client';
import { useState, useEffect, useCallback } from 'react';
import {useAuth} from "@/hooks/useAuth";

interface KeysHolder {
    name: string;
}

interface UseOfficeKeysReturn {
    myHasKeys: boolean;
    officeKeysHolder: KeysHolder | null;
    loading: boolean;
    toggleKeys: () => Promise<void>;
    refetch: () => Promise<void>;
}

export default function useOfficeKeys(): UseOfficeKeysReturn {
    const { user, token } = useAuth();
    const [myHasKeys, setMyHasKeys] = useState<boolean>(false);
    const [officeKeysHolder, setOfficeKeysHolder] = useState<KeysHolder | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // GET semplice per holder
    const fetchOfficeKeys = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/office-keys', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json() as { holder: KeysHolder | null };
            setOfficeKeysHolder(data.holder);
        } catch (error) {
            console.error('Keys fetch error:', error);
            setOfficeKeysHolder(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // GET mio stato
    const fetchMyKeys = useCallback(async () => {
        if (!token || !user?.id) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/employees/${user.id}/keys`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json() as { hasKeys: boolean };
            setMyHasKeys(data.hasKeys);
        } catch (error) {
            console.error('My keys error:', error);
            setMyHasKeys(false);
        }
    }, [token, user?.id]);

    // Fetch iniziale
    useEffect(() => {
        fetchOfficeKeys();
        fetchMyKeys();
    }, [fetchOfficeKeys, fetchMyKeys]);

    const toggleKeys = useCallback(async () => {
        if (!token || !user?.id) return;

        try {
            if (myHasKeys) {
                // RILASCIO chiavi → aggiorno l'utente
                const res = await fetch(`/api/employees/${user.id}/keys`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ hasKeys: false })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } else {
                // PRENDI chiavi → solo il tuo utente a true
                const res = await fetch(`/api/employees/${user.id}/keys`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ hasKeys: true })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            }

            // Aggiorno stato locale
            await fetchMyKeys();
            await fetchOfficeKeys();

        } catch (error) {
            console.error('Toggle error:', error);
        }
    }, [token, user?.id, myHasKeys, fetchMyKeys, fetchOfficeKeys]);

    const refetch = async (): Promise<void> => {
        await Promise.all([fetchOfficeKeys(), fetchMyKeys()]);
    };

    return {
        myHasKeys,
        officeKeysHolder,
        loading,
        toggleKeys,
        refetch
    };
}
