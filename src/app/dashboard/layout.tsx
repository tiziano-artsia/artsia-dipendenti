
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {Loader2} from "lucide-react";
import Header from "@/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            // Reindirizza al login
            const redirectUrl = new URL('/login', window.location.origin);
            router.push(redirectUrl.toString());
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
                    <p>Verifica autenticazione...</p>
                </div>
            </div>
        );
    }

    if (!user) return null; // Il redirect è già in corso

    return    <>
        <Header />
        <main className="flex-1 min-h-screen pt-[60px] pb-24 md:pt-0 md:pb-0">
            {children}
        </main>
    </>;
}
