'use client';

import { useState, useEffect } from 'react';

import type {EmployeePresence} from "@/types";
import {useAuth} from "@/hooks/useAuth";



interface UseDailyPresencesReturn {
    smart: EmployeePresence[];
    office: EmployeePresence[];
    loading: boolean;
    total: number;
}

export default function useDailyPresences(date: string): UseDailyPresencesReturn {
    const { token } = useAuth();
    const [presences, setPresences] = useState<EmployeePresence[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!date || !token) {
            setLoading(false);
            return;
        }

        const fetchPresences = async (): Promise<void> => {
            try {
                setLoading(true);
                const res = await fetch(`/api/presences?date=${date}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data: EmployeePresence[] = await res.json();
                if (res.ok) {
                    // Filtra: escludi fullRemote true e team Bottega
                    const filtered = data.filter(
                        (emp: EmployeePresence) => !emp.fullRemote && emp.team !== 'Bottega'
                    );
                    setPresences(filtered);
                }
            } catch (err) {
                console.error('Errore fetch presenze:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPresences();
    }, [date, token]);

    const smart = presences.filter((p: EmployeePresence) => p.status === 'smart');
    const office = presences.filter((p: EmployeePresence) => p.status === 'ufficio');

    return {
        smart,
        office,
        loading,
        total: presences.length
    };
}
