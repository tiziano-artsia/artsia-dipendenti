'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Check, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAtom, useAtomValue } from 'jotai';
import { unreadCountAtom, notificationDropdownAtom } from '@/lib/atoms/notificationAtoms';
import { useEffect, useRef, useState } from 'react';

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const {
        notifications,
        permission,
        requestPermission,
        markAsRead,
        markAllAsRead,
        fetchNotifications
    } = useNotifications();
    const unreadCount = useAtomValue(unreadCountAtom);
    const [isDropdownOpen, setIsDropdownOpen] = useAtom(notificationDropdownAtom);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isDashboardHome = pathname === '/dashboard';
    const showBackButton = !isDashboardHome && pathname.startsWith('/dashboard');

    useEffect(() => {
        if (user && permission === 'default') {
            setShowPermissionBanner(true);
        }
    }, [user, permission]);

    // ✅ Chiudi dropdown cliccando fuori
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

    // ✅ Ascolta messaggi dal Service Worker per aggiornare in real-time
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_NOTIFICATION') {
                // Ricarica notifiche senza suonare
                if (fetchNotifications) {
                    fetchNotifications(true); // true = manuale, no suono
                }
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, [fetchNotifications]);

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

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markAsRead(notification._id);
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
    };

    return (
        <>
            {/* Banner Permessi */}
            {showPermissionBanner && permission !== 'granted' && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-6 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <Bell className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                            <p className="text-xs md:text-sm font-medium truncate">
                                Abilita le notifiche per aggiornamenti in tempo reale
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => {
                                    requestPermission();
                                    setShowPermissionBanner(false);
                                }}
                                className="px-3 md:px-4 py-1.5 md:py-2 bg-white text-purple-600 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Attiva
                            </button>
                            <button
                                onClick={() => setShowPermissionBanner(false)}
                                className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo e Back */}
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            {showBackButton && (
                                <Link
                                    href="/dashboard"
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </Link>
                            )}

                            <Link href="/dashboard" className="flex items-center gap-2 md:gap-3 min-w-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center p-2 shadow-lg border border-gray-200 flex-shrink-0">
                                    <img
                                        src="https://www.artsia.it/assets/images/logos/logo-artsia.svg"
                                        alt="Artsia"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                                        Artsia SRL
                                    </h1>
                                    <p className="text-xs text-gray-500 hidden md:block">
                                        Gestione Dipendenti
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Campanello */}
                        {user && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="relative p-2 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>


                                {isDropdownOpen && (
                                    <div className="fixed md:absolute left-0 right-0 md:left-auto md:right-0 top-full md:top-auto md:mt-2 w-full md:w-96 bg-white md:rounded-2xl shadow-2xl border-t md:border border-gray-200 z-50 max-h-[calc(100vh-4rem)] md:max-h-[32rem] flex flex-col">
                                        {/* Header */}
                                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-4 flex items-center justify-between flex-shrink-0">
                                            <h3 className="text-white font-semibold text-lg">Notifiche</h3>
                                        </div>

                                        {/* Lista */}
                                        <div className="flex-1 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-12 text-center">
                                                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-gray-500 text-sm">Nessuna notifica</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => {
                                                    const style = getNotificationStyle(notification.type);
                                                    return (
                                                        <div
                                                            key={notification._id}
                                                            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                                !notification.read ? 'bg-blue-50/50' : ''
                                                            }`}
                                                            onClick={() => handleNotificationClick(notification)}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className={`${style.bg} ${style.border} border rounded-lg p-2 flex-shrink-0 h-8`}>
                                                                    <Bell className={`w-4 h-4 ${style.color}`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className={`text-sm ${!notification.read ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                                                                            {notification.title}
                                                                        </h4>
                                                                        {!notification.read && (
                                                                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mt-1">
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
                                            <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-200 flex-shrink-0">
                                                <Link
                                                    href="/dashboard/notifications"
                                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    Vedi tutte
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
