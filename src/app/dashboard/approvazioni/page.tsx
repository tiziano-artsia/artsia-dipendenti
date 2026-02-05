'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from "@/components/DashboardHeader";
import { usePendingRequests } from '@/hooks/usePendingRequests';
import {CheckCircle, XCircle, Clock, Check, X, User} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Approvazioni() {
    const { user } = useAuth();
    const { richieste, loading, approva, rifiuta } = usePendingRequests();

    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';
    const userTeam = user?.team;

    const getInitials = (name?: string) => name?.charAt(0).toUpperCase() || '';
    const getFullName = (richiesta: any) => richiesta.dipendente || 'Nome non disponibile';

    const richiesteVisibili = isManager
        ? richieste.filter(r => r.team === userTeam)
        : richieste;

    const pendingRequests = richiesteVisibili.filter(r => r.stato === 'pending');

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-blue-100/10 backdrop-blur-xl" />
                <div className="bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50 relative z-10 w-full">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl sm:rounded-3xl mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-4 border-white/20 border-t-white shadow-xl"></div>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-zinc-800 mb-3 sm:mb-4">
                        Caricamento richieste
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-zinc-600 font-light">
                        Aggiornamento dati in tempo reale
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 sm:p-4 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 via-blue-500/2 to-indigo-500/1 backdrop-blur-xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 space-y-6 sm:space-y-8 md:space-y-12">
                    {/* Header - Responsive */}
                    <div className="bg-white/70 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/60 hover:shadow-3xl transition-all duration-700">
                        <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl border border-white/40 shrink-0 hover:scale-110 transition-transform duration-500">
                                <span className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">✅</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-zinc-800 to-slate-800 bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4 leading-tight">
                                    Richieste Approvazione
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 text-sm sm:text-base md:text-xl text-zinc-600 font-light">
                                    <span className="truncate">
                                        {isManager
                                            ? `Team ${userTeam || 'Sviluppo'}`
                                            : 'Tutte le richieste'}
                                    </span>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                                    <span className="font-mono text-xs sm:text-sm tracking-wider text-zinc-500 uppercase px-3 sm:px-4 py-1 bg-white/50 backdrop-blur-xl rounded-full border border-zinc-200 shadow-sm whitespace-nowrap">
                                        {pendingRequests.length} nuove
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cards Container - Mobile: Cards, Desktop: Table */}
                    <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">

                        {/* Mobile: Card Layout */}
                        <div className="block lg:hidden space-y-4 sm:space-y-6">
                            {pendingRequests.map((richiesta, index) => {
                                const tipoLower = (richiesta.tipo || '').toLowerCase();
                                const isSmartWorking = tipoLower === 'smartworking';
                                const canApprove = isAdmin || (isManager && isSmartWorking);

                                return (
                                    <div
                                        key={richiesta.id || index}
                                        className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-zinc-200/50 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {/* Header Card */}
                                        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                                            <div className="relative shrink-0">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-black shadow-xl border-2 sm:border-4 border-white/50">
                                                    {getInitials(richiesta.dipendente)}
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">!</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-lg sm:text-xl md:text-2xl font-black text-zinc-900 mb-1 truncate">
                                                    {getFullName(richiesta)}
                                                </div>
                                                {richiesta.team && (
                                                    <div className="text-xs sm:text-sm text-zinc-500 font-medium">
                                                        {richiesta.team}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                            {/* Tipo */}
                                            <div>
                                                <div className="text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-wider mb-2">Tipo</div>
                                                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black shadow-lg inline-flex items-center gap-1.5 ${
                                                    tipoLower === 'smartworking'
                                                        ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                                                        : tipoLower === 'ferie'
                                                            ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                                                            : tipoLower === 'permesso'
                                                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
                                                                : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
                                                }`}>
                                                    {tipoLower === 'smartworking' ? '🏠' :
                                                        tipoLower === 'ferie' ? '🌴' :
                                                            tipoLower === 'permesso' ? '⏰' : '🤒'}
                                                    <span className="hidden sm:inline">{richiesta.tipo}</span>
                                                </span>
                                            </div>

                                            {/* Durata */}
                                            <div>
                                                <div className="text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-wider mb-2">Durata</div>
                                                <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                                    {richiesta.durata}
                                                </div>

                                            </div>
                                        </div>

                                        {/* Data */}
                                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-zinc-50 rounded-lg sm:rounded-xl border border-zinc-200">
                                            <div className="text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Data</div>
                                            <div className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800">{richiesta.data}</div>
                                        </div>

                                        {/* Azioni */}
                                        {canApprove ? (
                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                <button
                                                    onClick={async () => {
                                                        const success = await approva(richiesta.id);
                                                        if (success) {
                                                            toast.success(`Approvata la richiesta di ${getFullName(richiesta)}!`, {
                                                                icon: '✅',
                                                                duration: 5000,
                                                            });
                                                        } else {
                                                            toast.error('Errore durante l\'approvazione', {
                                                                icon: '❌',
                                                            });
                                                        }
                                                    }}
                                                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl hover:from-emerald-600 hover:to-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    Approva
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const success = await rifiuta(richiesta.id);
                                                        if (success) {
                                                            toast.error(`Rifiutata la richiesta di ${getFullName(richiesta)}`, {
                                                                icon: '❌',
                                                                duration: 5000,
                                                            });
                                                        } else {
                                                            toast.error('Errore durante il rifiuto', {
                                                                icon: '⚠️',
                                                            });
                                                        }
                                                    }}
                                                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl hover:from-rose-600 hover:to-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    Rifiuta
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-zinc-50 border-2 border-zinc-200/50 shadow-inner">
                                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 animate-pulse shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-wide">Stato</div>
                                                    <div className="text-sm sm:text-base md:text-lg font-black text-zinc-700 truncate">In Attesa</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: Table Layout */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gradient-to-r from-white/80 to-zinc-50/80 backdrop-blur-xl">
                                    <th className="text-left py-6 md:py-8 px-6 md:px-10 font-black text-zinc-800 text-lg md:text-xl tracking-tight border-b-2 border-white/50">Dipendente</th>
                                    <th className="text-left py-6 md:py-8 px-6 md:px-10 font-black text-zinc-800 text-lg md:text-xl tracking-tight border-b-2 border-white/50">Tipo</th>
                                    <th className="text-left py-6 md:py-8 px-6 md:px-10 font-black text-zinc-800 text-lg md:text-xl tracking-tight border-b-2 border-white/50">Date</th>
                                    <th className="text-left py-6 md:py-8 px-6 md:px-10 font-black text-zinc-800 text-lg md:text-xl tracking-tight border-b-2 border-white/50">Durata</th>
                                    <th className="text-left py-6 md:py-8 px-6 md:px-10 font-black text-zinc-800 text-lg md:text-xl tracking-tight border-b-2 border-white/50">Azioni / Stato</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100/50">
                                {pendingRequests.map((richiesta, index) => {
                                    const tipoLower = (richiesta.tipo || '').toLowerCase();
                                    const isSmartWorking = tipoLower === 'smartworking';
                                    const canApprove = isAdmin || (isManager && isSmartWorking);

                                    return (
                                        <tr
                                            key={richiesta.id || index}
                                            className="hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-blue-50/80 backdrop-blur-xl transition-all duration-300 group"
                                        >
                                            <td className="py-6 md:py-8 px-6 md:px-10">
                                                <div className="flex items-center gap-4 md:gap-5">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-2xl md:rounded-3xl flex items-center justify-center text-xl md:text-2xl font-black shadow-2xl border-4 border-white/50 group-hover:shadow-emerald-200 transition-all hover:scale-110">
                                                            {getInitials(richiesta.dipendente)}
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">!</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xl md:text-2xl font-black text-zinc-900 mb-1">{getFullName(richiesta)}</div>
                                                        {richiesta.team && <div className="text-sm text-zinc-500 font-medium">{richiesta.team}</div>}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-6 md:py-8 px-6 md:px-10">
                                                <span className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-sm font-black shadow-xl inline-block ${
                                                    tipoLower === 'smartworking'
                                                        ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                                                        : tipoLower === 'ferie'
                                                            ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                                                            : tipoLower === 'permesso'
                                                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
                                                                : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
                                                } hover:shadow-2xl hover:scale-105 transition-all`}>
                                                    {richiesta.tipo}
                                                </span>
                                            </td>

                                            <td className="py-6 md:py-8 px-6 md:px-10">
                                                <div className="text-lg md:text-xl font-semibold text-zinc-800">{richiesta.data}</div>
                                            </td>

                                            <td className="py-6 md:py-8 px-6 md:px-10">
                                                <div className="text-2xl md:text-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                                    {richiesta.durata}
                                                </div>
                                            </td>

                                            <td className="py-6 md:py-8 px-6 md:px-10">
                                                {canApprove ? (
                                                    <div className="flex gap-3 md:gap-4">
                                                        <button
                                                            onClick={async () => {
                                                                const success = await approva(richiesta.id);
                                                                if (success) {
                                                                    toast.success(`Approvata la richiesta di ${getFullName(richiesta)}!`, {
                                                                        icon: '✅',
                                                                        duration: 5000,
                                                                    });
                                                                } else {
                                                                    toast.error('Errore durante l\'approvazione', {
                                                                        icon: '❌',
                                                                    });
                                                                }
                                                            }}
                                                            className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-base md:text-lg rounded-xl md:rounded-2xl shadow-2xl hover:shadow-3xl hover:from-emerald-600 hover:to-green-700 transition-all hover:scale-105"
                                                        >
                                                            Approva
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const success = await rifiuta(richiesta.id);
                                                                if (success) {
                                                                    toast.error(`Rifiutata la richiesta di ${getFullName(richiesta)}`, {
                                                                        icon: '❌',
                                                                        duration: 5000,
                                                                    });
                                                                } else {
                                                                    toast.error('Errore durante il rifiuto', {
                                                                        icon: '⚠️',
                                                                    });
                                                                }
                                                            }}
                                                            className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-base md:text-lg rounded-xl md:rounded-2xl shadow-2xl hover:shadow-3xl hover:from-rose-600 hover:to-red-700 transition-all hover:scale-105"
                                                        >
                                                            Rifiuta
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-zinc-50 border-2 border-zinc-200/50 shadow-inner">
                                                        <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-500 animate-pulse" />
                                                        <div>
                                                            <div className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-wide">Stato</div>
                                                            <div className="text-base md:text-lg font-black text-zinc-700">In Attesa</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State - Responsive */}
                        {pendingRequests.length === 0 && (
                            <div className="text-center py-16 sm:py-24 md:py-32 px-4">
                                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-8 sm:mb-10 md:mb-12 bg-gradient-to-br from-emerald-100/70 via-blue-100/50 to-indigo-100/30 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl border-4 border-dashed border-emerald-200/50">
                                    <div className="text-5xl sm:text-6xl md:text-8xl opacity-20">📭</div>
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-5xl font-black bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent mb-4 sm:mb-5 md:mb-6 tracking-tight">
                                    Nessuna richiesta
                                </h3>
                                <p className="text-base sm:text-lg md:text-2xl text-zinc-500 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-light px-4">
                                    Non ci sono nuove richieste
                                    {isManager ? " di smartworking" : " di ferie, malattia, permessi o smartworking"}
                                    {" "}in attesa della tua approvazione.
                                </p>
                                <div className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl sm:rounded-3xl shadow-2xl font-bold text-base sm:text-lg md:text-xl border border-emerald-400/50">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/30 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold animate-pulse">✨</div>
                                    Tutto aggiornato
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
