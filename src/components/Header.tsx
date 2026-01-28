'use client';

import { useSession } from '@/hooks/useSession';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Header() {
    const { user, logout } = useSession();
    const pathname = usePathname();

    // Determina se siamo nella pagina principale del dashboard
    const isDashboardHome = pathname === '/dashboard';
    const showBackButton = !isDashboardHome && pathname.startsWith('/dashboard');

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Navigazione Sinistra */}
                    <div className="flex items-center space-x-3">
                        {/* Tasto Indietro (solo se non siamo in /dashboard) */}
                        {showBackButton && (
                            <Link
                                href="/dashboard"
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm group flex items-center"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                            </Link>
                        )}

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
            </div>
        </header>
    );
}
