'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        console.log('🔄 Redirect a /login...');
        router.replace('/login');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4" />
                <p className="text-zinc-600">Reindirizzamento...</p>
            </div>
        </div>
    );
}
