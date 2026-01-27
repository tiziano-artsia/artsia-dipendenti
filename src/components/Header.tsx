// src/components/Header.tsx
'use client';

import { useSession } from '@/hooks/useSession';
import Link from 'next/link';

export default function Header() {
    const { user, logout } = useSession();

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-xl border border-gray-200">
                            <img
                                src="/icons/logo-artsia.svg"
                                alt="Artsia Logo"
                                className="w-full h-full object-contain"
                                onError={(e) => console.error('Logo error:', e)}
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Artsia SRL
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">Dipendenti Manager</p>
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
