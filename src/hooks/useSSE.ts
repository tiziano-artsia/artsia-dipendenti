// hooks/useSSE.ts
'use client';
import { useEffect, useState, useCallback } from 'react';

export function useSSE<T = any[]>(url: string): {
    data: T;
    connected: boolean;
    error: string | null;
} {
    const [data, setData] = useState<T>([] as T);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return;

        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
            console.log('🔗 SSE connesso:', url);
            setConnected(true);
            setError(null);
        };

        eventSource.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                if (parsed.type === 'init' || parsed.type === 'update') {
                    setData(parsed.notifications as T);
                }
            } catch (e) {
                console.error('SSE parse error:', e);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE errore:', err);
            setConnected(false);
            setError('Connessione persa');
        };

        return () => {
            eventSource.close();
            setConnected(false);
        };
    }, [url]);

    return { data, connected, error };
}
