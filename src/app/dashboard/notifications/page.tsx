'use client';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useSSE } from '@/hooks/useSSE';
import {
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Trash2,
    AlertCircle, CheckCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Hook esistente (polling)
    const {
        notifications: apiNotifications,
        unreadCount: apiUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    // ← SSE Hook (real-time)
    const { data: sseNotifications, connected, error } = useSSE(
        `/api/notifications/sse?userId=${user?.id || 0}`
    );

    // ← Stato unificato SSE + API
    const [notifications, setNotifications] = useState<any[]>([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    // ← Sync SSE → stato locale
    useEffect(() => {
        if (sseNotifications?.length > 0) {
            setNotifications(sseNotifications);
        } else {
            setNotifications(apiNotifications);
        }
    }, [sseNotifications, apiNotifications]);

    // ← Toast quando arrivano nuove notifiche SSE
    useEffect(() => {
        if (sseNotifications?.length > notifications.length) {
            toast.success('🔔 Nuove notifiche arrivate!', {
                duration: 3000,
                position: 'top-right'
            });
        }
    }, [sseNotifications?.length, notifications.length]);

    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Filtra notifiche
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread' && n.read) return false;
        if (filter === 'read' && !n.read) return false;
        if (typeFilter !== 'all' && !n.type?.includes(typeFilter)) return false;
        return true;
    });

    // Gestisci click su notifica
    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification._id);
        }

        if (notification.relatedRequestId) {
            const isRequest = notification.type?.includes('_request');
            const isResponse = notification.type?.includes('_approved') || notification.type?.includes('_rejected');

            if (isRequest && (user?.role === 'admin' || user?.role === 'manager')) {
                router.push('/dashboard/approvazioni');
            } else if (isResponse) {
                router.push('/dashboard/miei-dati');
            } else {
                router.push('/dashboard');
            }
        }
    };

    // Icona basata sul tipo
    const getNotificationIcon = (type: string) => {
        if (type?.includes('approved')) return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (type?.includes('rejected')) return <XCircle className="w-5 h-5 text-red-500" />;
        if (type?.includes('request')) return <Clock className="w-5 h-5 text-amber-500" />;
        return <Bell className="w-5 h-5 text-blue-500" />;
    };

    // Colore badge basato sul tipo
    const getNotificationColor = (type: string) => {
        if (type?.includes('approved')) return 'from-green-500 to-emerald-600';
        if (type?.includes('rejected')) return 'from-red-500 to-rose-600';
        if (type?.includes('request')) return 'from-amber-500 to-yellow-600';
        return 'from-blue-500 to-indigo-600';
    };

    // Formatta data
    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ora';
        if (diffMins < 60) return `${diffMins} min fa`;
        if (diffHours < 24) return `${diffHours}h fa`;
        if (diffDays < 7) return `${diffDays}g fa`;
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    };

    // Status SSE

    const getSSEStatus = () => {
        if (error) return { icon: '❌', color: 'text-red-500', text: 'Errore SSE' };
        if (connected) return { icon: '🟢', color: 'text-emerald-500', text: 'Live (SSE)' };
        return { icon: '🟡', color: 'text-amber-500', text: 'Polling' };
    };

    return (
        <>
            <Toaster
                position="bottom-center"
                reverseOrder={false}
            />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* ← STATUS SSE DEBUG
                    <div className="flex justify-end mb-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border shadow-md backdrop-blur-sm ${
                            error
                                ? 'bg-red-100/80 text-red-800 border-red-200'
                                : connected
                                    ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200 animate-pulse'
                                    : 'bg-amber-100/80 text-amber-800 border-amber-200'
                        }`}>
                            <span className={`text-lg ${getSSEStatus().color}`}>
                                {getSSEStatus().icon}
                            </span>
                            <span>{getSSEStatus().text}</span>
                            <span className="text-xs ml-1">({notifications.length})</span>
                        </div>
                    </div>
                    */}
                    {/* Header */}
                    <div className="bg-white/70 backdrop-blur-3xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/60 hover:shadow-3xl transition-all">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                                    <Bell className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-zinc-800 mb-2 leading-tight">
                                        Notifiche
                                    </h1>
                                    <p className="text-zinc-600 text-lg">
                                        {unreadCount > 0 ? (
                                            <span className="font-semibold text-indigo-600">
                                                {unreadCount} non {unreadCount === 1 ? 'letta' : 'lette'}
                                            </span>
                                        ) : (
                                            'Tutte lette ✓'
                                        )}
                                    </p>
                                </div>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <CheckCheck className="w-5 h-5" />
                                    Segna tutto letto
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtri */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg p-4 md:p-6 border border-white/70">
                        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                            {/* Filtro Stato */}
                            <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl flex-1">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                                        filter === 'all'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                    }`}
                                >
                                    Tutte ({notifications.length})
                                </button>
                                <button
                                    onClick={() => setFilter('unread')}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                                        filter === 'unread'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                    }`}
                                >
                                    Non lette ({unreadCount})
                                </button>
                                <button
                                    onClick={() => setFilter('read')}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                                        filter === 'read'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                    }`}
                                >
                                    Lette ({notifications.length - unreadCount})
                                </button>
                            </div>

                            {/* Filtro Tipo */}
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-5 py-3 bg-white/80 border-2 border-zinc-200 rounded-2xl font-semibold text-sm focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-lg hover:shadow-md transition-all"
                            >
                                <option value="all">🔔 Tutti i tipi</option>
                                <option value="request">⏳ Richieste</option>
                                <option value="approved">✅ Approvazioni</option>
                                <option value="rejected">❌ Rifiuti</option>
                            </select>
                        </div>
                    </div>

                    {/* Lista Notifiche */}
                    <div className="space-y-4">
                        {filteredNotifications.length === 0 ? (
                            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-16 md:p-24 text-center border-4 border-dashed border-zinc-200 shadow-xl">
                                <AlertCircle className="w-20 h-20 text-zinc-300 mx-auto mb-6 opacity-50" />
                                <h3 className="text-2xl md:text-3xl font-black text-zinc-500 mb-3">
                                    Nessuna notifica
                                </h3>
                                <p className="text-lg text-zinc-400 max-w-md mx-auto leading-relaxed">
                                    {filter === 'unread'
                                        ? 'Non hai notifiche non lette al momento'
                                        : filter === 'read'
                                            ? 'Non hai ancora letto nessuna notifica'
                                            : 'Non hai ancora ricevuto notifiche'}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 border-2 shadow-lg transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] ${
                                        notification.read
                                            ? 'border-zinc-200 hover:border-zinc-300'
                                            : 'border-indigo-300 shadow-indigo-100/50 hover:shadow-indigo-200/50'
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {/* Badge Non Letta */}
                                    {!notification.read && (
                                        <div className="absolute top-4 right-4 w-4 h-4 bg-indigo-600 rounded-full shadow-lg ring-2 ring-white animate-pulse" />
                                    )}

                                    <div className="flex items-start gap-4 md:gap-6">
                                        {/* Icona */}
                                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${getNotificationColor(notification.type)} shadow-xl border-4 border-white/30`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Contenuto */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className={`font-black text-xl md:text-2xl leading-tight ${
                                                    notification.read ? 'text-zinc-700' : 'text-zinc-900'
                                                }`}>
                                                    {notification.title}
                                                </h3>
                                                <span className="text-xs md:text-sm text-zinc-400 font-mono whitespace-nowrap px-2 py-1 bg-zinc-100 rounded-full">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>

                                            <p className={`text-base md:text-lg leading-relaxed mb-4 ${
                                                notification.read ? 'text-zinc-500' : 'text-zinc-700 font-medium'
                                            }`}>
                                                {notification.body}
                                            </p>

                                            {/* Badge Tipo */}
                                            <div className="flex items-center gap-2">
                                                <span className={`px-4 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-lg inline-flex items-center gap-2 bg-gradient-to-r ${getNotificationColor(notification.type)} text-white`}>
                                                    {getNotificationIcon(notification.type)}
                                                    <span>
                                                        {notification.type?.includes('leave') ? 'Ferie' :
                                                            notification.type?.includes('request') ? 'Richiesta' :
                                                                notification.type?.includes('approved') ? 'Approvata' :
                                                                    notification.type?.includes('rejected') ? 'Rifiutata' : 'Notifica'}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Azioni */}
                                        <div className="flex flex-col gap-2 opacity-0 md:opacity-100 md:group-hover:opacity-100 transition-all ml-auto pl-4 border-l border-zinc-200">
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification._id);
                                                    }}
                                                    className="p-3 hover:bg-emerald-100 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
                                                    title="Segna come letta"
                                                >
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Eliminare questa notifica?')) {
                                                        deleteNotification(notification._id);
                                                    }
                                                }}
                                                className="p-3 hover:bg-red-100 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
                                                title="Elimina"
                                            >
                                                <Trash2 className="w-5 h-5 text-red-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
