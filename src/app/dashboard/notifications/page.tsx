// app/dashboard/notifications/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Trash2,
    CheckCheck,
    Filter,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);

    // Filtra notifiche
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread' && n.read) return false;
        if (filter === 'read' && !n.read) return false;
        if (typeFilter !== 'all' && !n.type.includes(typeFilter)) return false;
        return true;
    });

    // Gestisci click su notifica
    const handleNotificationClick = async (notification: any) => {
        // Marca come letta
        if (!notification.read) {
            await markAsRead(notification._id);
        }

        // Redirect basato sul tipo
        if (notification.relatedRequestId) {
            const isRequest = notification.type.includes('_request');
            const isResponse = notification.type.includes('_approved') || notification.type.includes('_rejected');

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
        if (type.includes('approved')) return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (type.includes('rejected')) return <XCircle className="w-5 h-5 text-red-500" />;
        if (type.includes('request')) return <Clock className="w-5 h-5 text-amber-500" />;
        return <Bell className="w-5 h-5 text-blue-500" />;
    };

    // Colore badge basato sul tipo
    const getNotificationColor = (type: string) => {
        if (type.includes('approved')) return 'from-green-500 to-emerald-600';
        if (type.includes('rejected')) return 'from-red-500 to-rose-600';
        if (type.includes('request')) return 'from-amber-500 to-yellow-600';
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-zinc-600">Caricamento notifiche...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/60">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                                <Bell className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-zinc-800 mb-2">
                                    Notifiche
                                </h1>
                                <p className="text-zinc-600">
                                    {unreadCount > 0 ? (
                                        <span className="font-semibold text-indigo-600">
                                            {unreadCount} non {unreadCount === 1 ? 'letta' : 'lette'}
                                        </span>
                                    ) : (
                                        'Tutte le notifiche sono state lette'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtri */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg p-4 border border-white/70">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Filtro Stato */}
                        <div className="flex gap-2 bg-white/50 p-1 rounded-xl flex-1">
                            <button
                                onClick={() => setFilter('all')}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    filter === 'all'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Tutte ({notifications.length})
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    filter === 'unread'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Non lette ({unreadCount})
                            </button>
                            <button
                                onClick={() => setFilter('read')}
                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    filter === 'read'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Lette ({notifications.length - unreadCount})
                            </button>
                        </div>

                        {/* Filtro Tipo */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-white/80 border-2 border-zinc-200 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">🔔 Tutti i tipi</option>
                            <option value="request">⏳ Richieste</option>
                            <option value="approved">✅ Approvazioni</option>
                            <option value="rejected">❌ Rifiuti</option>
                        </select>
                    </div>
                </div>

                {/* Lista Notifiche */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-16 text-center border border-dashed border-zinc-300">
                            <AlertCircle className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-zinc-600 mb-2">
                                Nessuna notifica
                            </h3>
                            <p className="text-zinc-500">
                                {filter === 'unread'
                                    ? 'Non hai notifiche non lette'
                                    : filter === 'read'
                                        ? 'Non hai notifiche lette'
                                        : 'Non hai ancora ricevuto notifiche'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                                    notification.read
                                        ? 'border-zinc-200'
                                        : 'border-indigo-300 shadow-lg shadow-indigo-100'
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                {/* Badge Non Letta */}
                                {!notification.read && (
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-indigo-600 rounded-full animate-pulse" />
                                )}

                                <div className="flex items-start gap-4">
                                    {/* Icona */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${getNotificationColor(notification.type)} shadow-lg`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Contenuto */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`font-bold text-lg ${
                                                notification.read ? 'text-zinc-700' : 'text-zinc-900'
                                            }`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-zinc-500 whitespace-nowrap">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>

                                        <p className={`text-sm ${
                                            notification.read ? 'text-zinc-500' : 'text-zinc-700'
                                        }`}>
                                            {notification.body}
                                        </p>

                                        {/* Badge Tipo */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getNotificationColor(notification.type)} text-white shadow-md`}>
                                                {notification.type.includes('leave') ? 'Ferie' : 'Permesso'}
                                                {notification.type.includes('request') && ' - Richiesta'}
                                                {notification.type.includes('approved') && ' - Approvata'}
                                                {notification.type.includes('rejected') && ' - Rifiutata'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Azioni */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification._id);
                                                }}
                                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                                title="Segna come letta"
                                            >
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Eliminare questa notifica?')) {
                                                    deleteNotification(notification._id);
                                                }
                                            }}
                                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
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
    );
}
