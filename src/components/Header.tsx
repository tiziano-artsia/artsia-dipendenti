'use client';

import { useAuth } from '@/hooks/useAuth'; // Il tuo hook
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Check, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAtom, useAtomValue } from 'jotai';
import { unreadCountAtom, notificationDropdownAtom } from '@/lib/atoms/notificationAtoms';
import { useEffect, useRef, useState } from 'react';

export default function Header() {
    const { user, logout } = useAuth(); // Usa il tuo hook
    const pathname = usePathname();
    const {
        notifications,
        permission,
        requestPermission,
        markAsRead,
        markAllAsRead
    } = useNotifications();
    const unreadCount = useAtomValue(unreadCountAtom);
    const [isDropdownOpen, setIsDropdownOpen] = useAtom(notificationDropdownAtom);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Determina se siamo nella pagina principale del dashboard
    const isDashboardHome = pathname === '/dashboard';
    const showBackButton = !isDashboardHome && pathname.startsWith('/dashboard');

    // Mostra banner permessi se non concesso
    useEffect(() => {
        if (user && permission === 'default') {
            setShowPermissionBanner(true);
        }
    }, [user, permission]);

    // Chiudi dropdown se clicchi fuori
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isDropdownOpen, setIsDropdownOpen]);

    // Formatta data notifica
    const formatNotificationTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ora';
        if (diffMins < 60) return `${diffMins}m fa`;
        if (diffHours < 24) return `${diffHours}h fa`;
        if (diffDays < 7) return `${diffDays}g fa`;
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    };

    // Icona e colore per tipo notifica
    const getNotificationStyle = (type: string) => {
        switch (type) {
            case 'leave_request':
            case 'permit_request':
                return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
            case 'leave_approved':
            case 'permit_approved':
                return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
            case 'leave_rejected':
            case 'permit_rejected':
                return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
            default:
                return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
        }
    };

    return (
        <>
            {/* Banner Permessi Notifiche */}
            {showPermissionBanner && permission !== 'granted' && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 relative">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5" />
                            <p className="text-sm font-medium">
                                Abilita le notifiche per ricevere aggiornamenti in tempo reale sulle tue richieste
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    requestPermission();
                                    setShowPermissionBanner(false);
                                }}
                                className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Attiva
                            </button>
                            <button
                                onClick={() => setShowPermissionBanner(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Navigazione Sinistra */}
                        <div className="flex items-center space-x-3">
                            {/* Tasto Indietro */}
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
                                        src="https://www.artsia.it/assets/images/logos/logo-artsia.svg"
                                        alt="Artsia Logo"
                                        className="w-full h-full object-contain"
                                        onError={(e) => console.error('Logo error:', e)}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Artsia SRL
                                    </h1>
                                    <p className="text-xs text-gray-500 font-medium">Gestione Dipendenti</p>
                                </div>
                            </Link>
                        </div>

                        {/* Navigazione Destra - Campanello Notifiche */}
                        {user && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                                >
                                    <Bell className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Notifiche */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                                        {/* Header Dropdown */}
                                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between">
                                            <h3 className="text-white font-semibold text-lg">Notifiche</h3>
                                        </div>

                                        {/* Lista Notifiche */}
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-8 text-center">
                                                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-gray-500 text-sm">Nessuna notifica</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => {
                                                    const style = getNotificationStyle(notification.type);
                                                    return (
                                                        <div
                                                            key={notification._id}
                                                            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                                                                !notification.read ? 'bg-blue-50/30' : ''
                                                            }`}
                                                            onClick={() => {
                                                                if (!notification.read) {
                                                                    markAsRead([notification._id]);
                                                                }
                                                                if (notification.relatedRequestId) {
                                                                    const user = JSON.parse(localStorage.getItem('user') || '{}');

                                                                    if (user.role === 'admin') {
                                                                        window.location.href = `/dashboard/approvazioni`;
                                                                    } else {
                                                                        window.location.href = `/dashboard/miei-dati`;
                                                                    }
                                                                }
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                <div className={`${style.bg} ${style.border} border rounded-lg p-2 flex-shrink-0`}>
                                                                    <Bell className={`w-4 h-4 ${style.color}`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between">
                                                                        <h4 className={`text-sm font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                                                                            {notification.title}
                                                                        </h4>
                                                                        {!notification.read && (
                                                                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                                                        {notification.body}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        {formatNotificationTime(notification.createdAt)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Footer */}
                                        {notifications.length > 0 && (
                                            <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-200">
                                                <Link
                                                    href="/dashboard/notifications"
                                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    Vedi tutte le notifiche
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
