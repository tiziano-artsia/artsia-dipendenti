'use client';

import { useState, useEffect } from 'react';
import { Key, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Holder {
    id: string;
    name: string;
}

const OfficeKeysWidget = () => {
    const { token } = useAuth();

    const [officeKeysHolders, setOfficeKeysHolders] = useState<Holder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchKeysHolders = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/office-keys', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                // L'API deve restituire:
                // { holders: [{ id: string, name: string }] }
                setOfficeKeysHolders(data?.holders ?? []);
            } catch (err) {
                console.error('Errore caricamento chiavi:', err);
                setError('Errore nel caricamento');
                setOfficeKeysHolders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchKeysHolders();
    }, [token]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 col-span-full">

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <Key className="w-5 h-5 text-zinc-600" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-800">
                    Chiavi Ufficio
                </h2>
            </div>

            {/* Loading */}
            {loading && (
                <p className="text-sm text-zinc-400">Caricamento...</p>
            )}

            {/* Error */}
            {!loading && error && (
                <p className="text-sm text-rose-500">{error}</p>
            )}

            {/* Content */}
            {!loading && !error && (
                officeKeysHolders.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {officeKeysHolders.map((holder) => (
                            <div
                                key={holder.id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2 text-zinc-700">
                                    <User className="w-4 h-4 text-orange-500" />
                                    <span className="font-medium">
                                        {holder.name}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                    In uso
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-600">
                            Nessuno in questo momento ha le chiavi!
                        </span>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            Disponibili
                        </span>
                    </div>
                )
            )}
        </div>
    );
};

export default OfficeKeysWidget;