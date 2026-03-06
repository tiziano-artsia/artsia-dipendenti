'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft, Bell, Home, CalendarDays, PencilLine, Key} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAtom, useAtomValue } from 'jotai';
import { unreadCountAtom, notificationDropdownAtom } from '@/lib/atoms/notificationAtoms';
import { useEffect, useRef, useState } from 'react';
import {useSSE} from "@/hooks/useSSE";
import useOfficeKeys from "@/hooks/useOfficeKeys";

export default function Header() {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const {
        notifications,
        permission,
        requestPermission,
        markAsRead,
        fetchNotifications
    } = useNotifications();

    const { myHasKeys, toggleKeys, loading: keysLoading } = useOfficeKeys();

    const unreadCount = useAtomValue(unreadCountAtom);
    const [isDropdownOpen, setIsDropdownOpen] = useAtom(notificationDropdownAtom);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const showBackButton = pathname.startsWith('/dashboard') && pathname !== '/dashboard/';

    // ==================== Effects ====================

    useEffect(() => {
        const dismissed = localStorage.getItem('notification_banner_dismissed') === 'true';

        if (user && permission === 'default' && !dismissed) {
            const timer = setTimeout(() => {
                setShowPermissionBanner(true);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [user, permission]);

    useEffect(() => {
        if (!isDropdownOpen) return;

        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isDropdownOpen, setIsDropdownOpen]);

    useEffect(() => {
        if (isDropdownOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_NOTIFICATION') {
                fetchNotifications?.(true);
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
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
        const styles = {
            leave_request: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            permit_request: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            leave_approved: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
            permit_approved: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
            leave_rejected: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
            permit_rejected: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        };
        return styles[type as keyof typeof styles] || { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    };

    const handleNotificationClick = async (notification: any) => {
        // Chiudi il dropdown prima
        setIsDropdownOpen(false);

        // Marca come letta
        if (!notification.read) {
            await markAsRead(notification._id);
        }


        setTimeout(() => {
            if (notification.relatedRequestId) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                window.location.href = user.role === 'admin' ? '/dashboard/approvazioni' : '/dashboard/miei-dati';
            }
        }, 100);
    };

    const toggleDropdown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDropdownOpen) {
            window.location.href = '/dashboard/notifications';
            setIsDropdownOpen(false);
            return;
        }

      if (unreadCount > 0) {
            setIsDropdownOpen(false);
          window.location.href = '/dashboard/notifications';

      } else {
            window.location.href = '/dashboard/notifications';
        }
    };

    const handleDismissBanner = () => {
        setShowPermissionBanner(false);
        localStorage.setItem('notification_banner_dismissed', 'true');
    };

    const handleActivateNotifications = async () => {
        await requestPermission();
        setShowPermissionBanner(false);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const { data: sseNotifications, connected, error } = useSSE(`/api/notifications/sse?userId=${user?.id || 0}`);
    return (
        <>
            {/* Top Header */}
            <header className="bg-white shadow-sm border-b border-gray-200
          fixed top-0 left-0 right-0 z-40
          pt-[max(env(safe-area-inset-top),8px)]
          sm:pt-4 sm:sticky sm:top-0">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo e Back */}
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            {showBackButton && (
                                <Link
                                    href="/dashboard"
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
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

                        {/*  TOGGLE DESKTOP - Si colora intero */}
                        {user && (
                            <div className={`hidden md:flex items-center gap-2 ml-3 p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 shadow-sm group hover:shadow-md hover:shadow-orange-200/30 active:scale-[0.98] ${
                                myHasKeys
                                    ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-300/50 shadow-orange-200/30'
                                    : 'bg-white/70 hover:bg-gray-50 border-gray-200/50'
                            } ${keysLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>

                                {/* Icona dinamica */}
                                <div className={`p-1.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
                                    myHasKeys
                                        ? 'bg-gradient-to-br from-orange-500 to-yellow-600 shadow-lg shadow-orange-300/50'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}>
                                    <Key className={`w-4 h-4 transition-all ${
                                        myHasKeys ? 'text-white drop-shadow-sm rotate-12 scale-105' : 'text-gray-600'
                                    }`} />
                                </div>

                                {/* Label dinamica */}
                                <span className={`text-xs font-bold tracking-wider transition-colors pr-2 ${
                                    myHasKeys
                                        ? 'text-orange-700 font-black'
                                        : 'text-gray-600 group-hover:text-gray-800'
                                }`}>
                                  {myHasKeys ? 'Hai le Chiavi?' : 'Hai le Chiavi?'}
                                </span>

                                {/* Switch che si colora INTERO */}
                                <div className="relative flex-shrink-0">
                                    <button
                                        onClick={toggleKeys}
                                        disabled={keysLoading}
                                        className={`relative w-11 h-6 rounded-full shadow-inner border-2 transition-all duration-300 overflow-hidden group-hover:shadow-md active:shadow-inner active:scale-95 ${
                                            myHasKeys
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400 shadow-orange-400/50 shadow-lg'
                                                : 'bg-gradient-to-r from-gray-200 to-gray-300 border-gray-300 hover:from-orange-100 hover:to-orange-200'
                                        }`}
                                    >
                                        {/* Knob che si colora */}
                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-lg border transition-all duration-300 transform border-white/80 shadow-md ${
                                            myHasKeys
                                                ? 'bg-gradient-to-br from-orange-400 to-yellow-400 translate-x-5 shadow-orange-500/50 scale-110 rotate-180'
                                                : 'bg-white translate-x-0 hover:translate-x-0.5 shadow-gray-300/50'
                                        }`} />

                                        {/* Glow interno quando attivo */}
                                        {myHasKeys && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-transparent rounded-full animate-pulse" />
                                        )}

                                        {/* Status dot SUPERIORE */}
                                        {myHasKeys && (
                                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white shadow-lg animate-ping" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}


                        {/* Campanello - Solo Desktop con SSE */}
                        {user && (
                            <div className="relative hidden md:block">
                                <button
                                    ref={buttonRef}
                                    onClick={toggleDropdown}
                                    disabled={isDropdownOpen}
                                    className="relative p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors group"
                                    aria-label="Notifiche"
                                    title={unreadCount > 0 ? `${unreadCount} nuove notifiche` : 'Nessuna nuova notifica'}
                                >
                                    <div className="relative">
                                        <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-gray-800 transition-colors" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                                        )}
                                        {/* ← SSE STATUS */}
                                        <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full border-2 border-white shadow-md ${
                                            connected
                                                ? 'bg-emerald-500 animate-ping'
                                                : error
                                                    ? 'bg-red-500'
                                                    : 'bg-amber-500'
                                        }`} />
                                    </div>
                                </button>

                                {isDropdownOpen && notifications.length > 0 && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute right-0 top-full mt-2 w-96 bg-white/95 backdrop-blur-2xl shadow-2xl rounded-3xl border border-gray-200/50 z-50 max-h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-top-2 duration-200"
                                    >
                                        {/* Header */}
                                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex-shrink-0 rounded-t-3xl border-b border-white/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                                        <Bell className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-lg leading-tight">Notifiche</h3>
                                                        <p className={`text-xs font-mono uppercase tracking-wider ${
                                                            connected ? 'text-emerald-100' : 'text-amber-100'
                                                        }`}>
                                                            {connected ? '🟢 Live' : '🔄 Aggiornamento...'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm ${
                                                    unreadCount > 0
                                                        ? 'text-red-200'
                                                        : 'text-emerald-200'
                                                }`}>
                            {unreadCount > 0 ? `${unreadCount} nuove` : 'Tutte lette'}
                        </span>
                                            </div>
                                        </div>

                                        {/* Lista */}
                                        <div className="flex-1 overflow-y-auto max-h-[400px] p-1">
                                            {notifications.slice(0, 8).map((notification) => {
                                                const style = getNotificationStyle(notification.type);
                                                return (
                                                    <div
                                                        key={notification._id}
                                                        className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 backdrop-blur-sm transition-all group cursor-pointer rounded-2xl mx-1 mt-1 ${
                                                            !notification.read ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/50 shadow-sm ring-1 ring-blue-100/50' : ''
                                                        }`}
                                                        onClick={() => {
                                                            handleNotificationClick(notification);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-11 h-11 ${style.bg} ${style.border} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                                                                <Bell className={`w-4 h-4 ${style.color}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0 py-0.5">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <h4 className={`text-sm font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-700'} line-clamp-2 leading-tight`}>
                                                                        {notification.title}
                                                                    </h4>
                                                                    {!notification.read && (
                                                                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1 animate-pulse shadow-sm" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                                    {notification.body}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-2 font-mono tracking-wider">
                                                                    {formatNotificationTime(notification.createdAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Footer */}
                                        <div className="bg-gradient-to-r from-gray-50/80 to-white/80 px-4 py-3 border-t border-gray-200/50 backdrop-blur-sm flex-shrink-0 rounded-b-3xl">
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    router.push('/dashboard/notifications');
                                                }}
                                                className="w-full text-sm font-semibold text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100 px-4 py-2 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                            >
                                                <Bell className="w-4 h-4" />
                                                Vedi tutte le notifiche
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ← SSE STATUS MOBILE (opzionale) */}
                                {user && unreadCount > 0 && (
                                    <div className="md:hidden fixed bottom-6 right-6 z-50">
                                        <div className="w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg animate-bounce" />
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </header>

            {/* Banner Permessi
            {showPermissionBanner && permission !== 'granted' && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-6 py-3 animate-slideDown sm:hidden">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <Bell className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                            <p className="text-xs md:text-sm font-medium">
                                Abilita le notifiche per non perdere aggiornamenti importanti
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleActivateNotifications}
                                className="px-3 md:px-4 py-1.5 md:py-2 bg-white text-purple-600 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-100 active:scale-95 transition-all"
                            >
                                Attiva
                            </button>
                            <button
                                onClick={handleDismissBanner}
                                className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Chiudi"
                            >
                                <X className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}*/}

            {/* Bottom Navigation Mobile -  Padding fisso */}
            {user && (
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[999] shadow-lg pb-2">
                    <div className="p-2">
                        <div className="grid grid-cols-5 gap-1"> {/* 5 colonne */}
                            {/* Home */}
                            <Link
                                href="/dashboard"
                                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors ${
                                    pathname === '/dashboard' || pathname === '/dashboard/'
                                        ? 'text-purple-600'
                                        : 'text-gray-500 active:bg-gray-100'
                                }`}
                            >
                                <Home className="w-6 h-6" />
                                <span className="text-xs font-medium">Home</span>
                            </Link>

                            {/* Calendario */}
                            <Link
                                href="/dashboard/calendario"
                                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors ${
                                    pathname === '/dashboard/calendario' || pathname === '/dashboard/calendario'
                                        ? 'text-purple-600'
                                        : 'text-gray-500 active:bg-gray-100'
                                }`}
                            >
                                <CalendarDays className="w-6 h-6" />
                                <span className="text-xs font-medium">Calendario</span>
                            </Link>

                            {/* Richieste */}
                            <Link
                                href="/dashboard/miei-dati"
                                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors ${
                                    pathname.startsWith('/dashboard/miei-dati')
                                        ? 'text-purple-600'
                                        : 'text-gray-500 active:bg-gray-100'
                                }`}
                            >
                                <PencilLine className="w-6 h-6" />
                                <span className="text-xs font-medium">Richieste</span>
                            </Link>


                            {/* Notifiche */}
                            <button
                                onClick={toggleDropdown}
                                className={`relative flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors ${
                                    isDropdownOpen ? 'text-purple-600' : 'text-gray-500 active:bg-gray-100'
                                }`}
                            >
                                <div className="relative">
                                    <Bell className="w-6 h-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium">Notifiche</span>
                            </button>
                            {/* 🔑 TOGGLE MOBILE - Si colora tutto */}
                            <button
                                onClick={toggleKeys}
                                disabled={keysLoading}
                                className={`relative flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-300 shadow-sm flex-1 group active:scale-[0.97] ${
                                    myHasKeys
                                        ? 'bg-gradient-to-br from-orange-500/20 via-yellow-400/20 to-orange-500/20 border-2 border-orange-300/50 shadow-lg shadow-orange-200/40'
                                        : 'bg-white/70 hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 border border-gray-200/50 hover:border-orange-200/50 hover:shadow-md'
                                } ${keysLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {/* Switch piccolo che si colora */}
                                <div className={`relative w-9 h-5 rounded-full shadow-inner border overflow-hidden transition-all duration-300 ${
                                    myHasKeys
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400 shadow-orange-400/30'
                                        : 'bg-gradient-to-r from-gray-200 to-gray-300 border-gray-300 hover:from-orange-400/20 hover:to-orange-500/20'
                                }`}>
                                    {/* Knob colorato */}
                                    <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full shadow-lg border transition-all duration-300 border-white shadow-md transform ${
                                        myHasKeys
                                            ? 'bg-gradient-to-br from-yellow-400 to-orange-400 translate-x-4 scale-110 shadow-orange-500/50'
                                            : 'bg-white hover:translate-x-0.5 shadow-gray-400/30'
                                    }`} />
                                </div>

                                {/* Label dinamica + dot */}
                                <span className={`text-[10px] font-bold tracking-wider transition-all ${
                                    myHasKeys
                                        ? 'text-orange-700 scale-105 drop-shadow-sm'
                                        : 'text-gray-600 group-hover:text-orange-600'
                                }`}>
    {myHasKeys ? 'CHIAVI' : 'chiavi'}
  </span>

                                {/* Dot pulsante SUPREMO */}
                                {myHasKeys && (
                                    <div className="absolute -top-0.5 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white shadow-lg animate-ping z-10" />
                                )}
                            </button>

                            {/* Profilo
                            <button className="flex flex-col items-center justify-center gap-1 py-2 text-gray-600 rounded-xl active:bg-gray-100 transition-colors">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                    {user ? getInitials(user.name) : 'U'}
                                </div>
                                <span className="text-xs font-medium truncate max-w-[60px]">
            {user ? user.name.split(' ')[0] : 'Profilo'}
          </span>
                            </button>
                            */}
                        </div>
                    </div>

                    {/* Dropdown Notifiche Mobile - z-[1000] */}
                    {isDropdownOpen && unreadCount > 0 && (
                        <>
                            <div
                                className="fixed inset-0 bg-black/50 z-[1000] animate-fadeIn"
                                onClick={() => setIsDropdownOpen(false)}
                            />

                            <div
                                ref={dropdownRef}
                                className="fixed left-4 right-4 bottom-28 bg-white shadow-2xl rounded-2xl border border-gray-200 z-[1001] max-h-[60vh] flex flex-col overflow-hidden animate-scaleIn pb-[max(env(safe-area-inset-bottom),1rem)]"
                            >
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-4 flex-shrink-0 rounded-t-2xl">
                                    <h3 className="text-white font-semibold text-lg">Notifiche</h3>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {notifications.map((notification) => {
                                        const style = getNotificationStyle(notification.type);
                                        return (
                                            <div
                                                key={notification._id}
                                                className={`px-4 py-3.5 border-b border-gray-100 active:bg-gray-100 cursor-pointer transition-colors ${
                                                    !notification.read ? 'bg-blue-50/50' : ''
                                                }`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`${style.bg} ${style.border} border rounded-lg p-2 flex-shrink-0 h-fit`}>
                                                        <Bell className={`w-4 h-4 ${style.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h4 className={`text-sm ${!notification.read ? 'font-bold' : 'font-semibold'} text-gray-900 line-clamp-2`}>
                                                                {notification.title}
                                                            </h4>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                            {notification.body}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1.5">
                                                            {formatNotificationTime(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-200 flex-shrink-0 rounded-b-2xl">
                                    <Link
                                        href="/dashboard/notifications"
                                        className="text-sm text-purple-600 font-medium"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Vedi tutte
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </nav>
            )}

        </>
    );
}
