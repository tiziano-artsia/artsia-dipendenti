'use client';

import { useCallback, useEffect, useState } from "react";

interface SmartCountResponse {
    success: boolean;
    data?: string;
    count: number;
    error?: string;
}

export function useSmartworkingCount(date: string) {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const getToken = useCallback(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    }, []);

    useEffect(() => {
        const fetchCount = async () => {
            const token = getToken();
            if (!token || !date) {
                setCount(0);
                return;
            }

            try {
                setLoading(true);
                const res = await fetch(`/api/smartworking/count?date=${date}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store'  // Live data
                });

                const data: SmartCountResponse = await res.json();

                if (res.ok && data.success) {
                    setCount(data.count || 0);
                } else {
                    console.warn('Smart count API error:', data.error);
                    setCount(0);
                }
            } catch (err) {
                console.error('Smart count fetch error:', err);
                setCount(0);
            } finally {
                setLoading(false);
            }
        };

        if (date) fetchCount();
    }, [date, getToken]);

    return { count, loading, refetch: () => setLoading(true) };
}
