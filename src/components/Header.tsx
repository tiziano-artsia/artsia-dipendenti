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
        markAllAsRead
    } = useNotifications();
    const unreadCount = useAtomValue(unreadCountAtom);
    const [isDropdownOpen, setIsDropdownOpen] = useAtom(notificationDropdownAtom);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // ✅ Blocca scroll body quando dropdown aperto (mobile)
    useEffect(() => {
        if (isDropdownOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isDropdownOpen]);

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
            {/* Banner Permessi Notifiche */}
            {showPermissionBanner && permission !== 'granted' && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 py-3 relative">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <p className="text-xs sm:text-sm font-medium line-clamp-2">
                                Abilita le notifiche per ricevere aggiornamenti in tempo reale
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                                onClick={() => {
                                    requestPermission();
                                    setShowPermissionBanner(false);
                                }}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-purple-600 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                            >
                                Attiva
                            </button>
                            <button
                                onClick={() => setShowPermissionBanner(false)}
                                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        {/* Navigazione Sinistra */}
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            {showBackButton && (
                                <Link
                                    href="/dashboard"
                                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm group flex items-center flex-shrink-0"
                                >
                                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                                </Link>
                            )}

                            {/* Logo */}
                            <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center p-2 sm:p-2.5 shadow-xl border border-gray-200 flex-shrink-0">
                                    <img
                                        src="https://www.artsia.it/assets/images/logos/logo-artsia.svg"
                                        alt="Artsia Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                                        Artsia SRL
                                    </h1>
                                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">
                                        Gestione Dipendenti
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Campanello Notifiche */}
                        {user && (
                            <div className="relative flex-shrink-0" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="relative p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                                >
                                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* ✅ Dropdown Notifiche - Responsive */}
                                {isDropdownOpen && (
                                    <>
                                        {/* Overlay mobile */}
                                        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsDropdownOpen(false)} />

                                        {/* Dropdown */}
                                        <div className="fixed md:absolute inset-x-0 bottom-0 md:inset-auto md:right-0 md:top-full md:mt-2 w-full md:w-96 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-gray-200 overflow-hidden z-50 max-h-[80vh] md:max-h-[32rem] flex flex-col">
                                            {/* Header Dropdown */}
                                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-4 flex items-center justify-between flex-shrink-0">
                                                <h3 className="text-white font-semibold text-lg">Notifiche</h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAllAsRead();
                                                        }}
                                                        className="text-white/90 hover:text-white text-xs sm:text-sm font-medium flex items-center space-x-1 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
                                                    >
                                                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span>Segna tutte</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Lista Notifiche - Scrollabile */}
                                            <div className="flex-1 overflow-y-auto overscroll-contain">
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
                                                                className={`px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer ${
                                                                    !notification.read ? 'bg-blue-50/30' : ''
                                                                }`}
                                                                onClick={() => handleNotificationClick(notification)}
                                                            >
                                                                <div className="flex items-start space-x-3">
                                                                    <div className={`${style.bg} ${style.border} border rounded-lg p-2 flex-shrink-0`}>
                                                                        <Bell className={`w-4 h-4 ${style.color}`} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <h4 className={`text-sm font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''} line-clamp-2`}>
                                                                                {notification.title}
                                                                            </h4>
                                                                            {!notification.read && (
                                                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                                            {notification.body}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400 mt-1.5">
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
                                                        Vedi tutte le notifiche
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
