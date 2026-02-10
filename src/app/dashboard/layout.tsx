'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
                    <p className="text-gray-600 text-sm">Verifica autenticazione...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
