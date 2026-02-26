'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from "@/components/DashboardHeader";
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { CheckCircle, XCircle, Clock, Check, X, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const getTipoColor = (tipo: string) => {
    const t = (tipo || '').toLowerCase().trim();
    if (t === 'ferie')             return 'from-blue-500 to-indigo-600';
    if (t === 'malattia')          return 'from-red-500 to-rose-600';
    if (t === 'permesso')          return 'from-yellow-500 to-amber-600';
    if (t === 'smartworking')      return 'from-emerald-500 to-green-600';
    if (t === 'fuori-sede')        return 'from-cyan-500 to-teal-600';
    if (t === 'congedo-parentale') return 'from-pink-500 to-rose-600';
    return 'from-zinc-500 to-slate-600';
};

const getTipoEmoji = (tipo: string) => {
    const t = (tipo || '').toLowerCase().trim();
    if (t === 'ferie')             return '🌴';
    if (t === 'malattia')          return '🤒';
    if (t === 'permesso')          return '⏰';
    if (t === 'smartworking')      return '🏠';
    if (t === 'fuori-sede')        return '📍';
    if (t === 'congedo-parentale') return '👶';
    return '📋';
};

export default function Approvazioni() {
    const { user } = useAuth();
    const { richieste, loading, approva, rifiuta } = usePendingRequests();
    const [motivoAperto, setMotivoAperto] = useState<string | null>(null);

    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';
    const userTeam = user?.team;

    const getInitials = (name?: string) => name?.charAt(0).toUpperCase() || '';
    const getFullName = (richiesta: any) => richiesta.dipendente || 'Nome non disponibile';

    const richiesteVisibili = isManager
        ? richieste.filter(r => r.team === userTeam)
        : richieste;

    const pendingRequests = richiesteVisibili.filter(r => r.stato === 'pending');

    const handleApprova = async (richiesta: any) => {
        const success = await approva(richiesta.id);
        if (success) {
            toast.success(`Approvata la richiesta di ${getFullName(richiesta)}!`, { icon: '✅', duration: 5000 });
        } else {
            toast.error("Errore durante l'approvazione", { icon: '❌' });
        }
    };

    const handleRifiuta = async (richiesta: any) => {
        const success = await rifiuta(richiesta.id);
        if (success) {
            toast.error(`Rifiutata la richiesta di ${getFullName(richiesta)}`, { icon: '❌', duration: 5000 });
        } else {
            toast.error('Errore durante il rifiuto', { icon: '⚠️' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-blue-100/10 backdrop-blur-xl" />
                <div className="bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50 relative z-10 w-full">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl sm:rounded-3xl mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-4 border-white/20 border-t-white shadow-xl" />
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
            <Toaster position="bottom-center" reverseOrder={false} />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 sm:p-4 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 via-blue-500/2 to-indigo-500/1 backdrop-blur-xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 space-y-6 sm:space-y-8 md:space-y-12">

                    {/* Header */}
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
                                        {isManager ? `Team ${userTeam || 'Sviluppo'}` : 'Tutte le richieste'}
                                    </span>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                                    <span className="font-mono text-xs sm:text-sm tracking-wider text-zinc-500 uppercase px-3 sm:px-4 py-1 bg-white/50 backdrop-blur-xl rounded-full border border-zinc-200 shadow-sm whitespace-nowrap">
                                        {pendingRequests.length} nuove
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cards Container */}
                    <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">

                        {/* Mobile: Card Layout */}
                        <div className="block lg:hidden space-y-4 sm:space-y-6">
                            {pendingRequests.map((richiesta, index) => {
                                const tipoLower = (richiesta.tipo || '').toLowerCase().trim();
                                const isSmartWorking = tipoLower === 'smartworking';
                                const canApprove = isAdmin || (isManager && isSmartWorking);

                                return (
                                    <div
                                        key={richiesta.id || index}
                                        className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-zinc-200/50 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {/* Header Card */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="relative shrink-0">
                                                <div className="w-11 h-11 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-xl flex items-center justify-center text-lg font-black shadow-xl border-2 border-white/50">
                                                    {getInitials(richiesta.dipendente)}
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg animate-pulse">!</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-black text-zinc-900 truncate">{getFullName(richiesta)}</div>
                                                {richiesta.team && <div className="text-xs text-zinc-500 font-medium">{richiesta.team}</div>}
                                            </div>
                                            {/* Stato badge */}
                                            <span className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg inline-flex items-center gap-1.5 bg-gradient-to-r ${getTipoColor(richiesta.tipo)} text-white`}>
                        <span>{getTipoEmoji(richiesta.tipo)}</span>
                        <span>{richiesta.tipo}</span>
                    </span>
                                        </div>

                                        {/* Data + Durata inline */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex-1 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Data</div>
                                                <div className="text-sm font-bold text-zinc-800">
                                                    {richiesta.data
                                                        ? (() => {
                                                            if (richiesta.data.includes('/')) return richiesta.data;
                                                            const [a, m, g] = richiesta.data.split('-').map(Number);
                                                            return new Date(a, m - 1, g).toLocaleDateString('it-IT');
                                                        })()
                                                        : '—'}
                                                </div>
                                            </div>
                                            <div className="flex-1 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Durata</div>
                                                <div className="text-lg font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                                    {richiesta.durata}
                                                </div>
                                            </div>
                                            {/* Motivo pill */}
                                            {richiesta.motivo && (
                                                <button
                                                    onClick={() => setMotivoAperto(richiesta.id)}
                                                    className="flex-1 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-left hover:bg-amber-100 transition-all"
                                                >
                                                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">Motivo</div>
                                                    <div className="text-xs text-zinc-600 font-medium line-clamp-1">{richiesta.motivo}</div>
                                                </button>
                                            )}
                                        </div>

                                        {/* Azioni */}
                                        {canApprove ? (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApprova(richiesta)}
                                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm rounded-xl shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-4 h-4" /> Approva
                                                </button>
                                                <button
                                                    onClick={() => handleRifiuta(richiesta)}
                                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-sm rounded-xl shadow-lg hover:from-rose-600 hover:to-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <X className="w-4 h-4" /> Rifiuta
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 border-2 border-zinc-200/50">
                                                <Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                                                <span className="text-sm font-black text-zinc-600">In Attesa</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: Table Layout */}
                        <div className="hidden lg:block">
                            <table className="w-full table-fixed">
                                <thead>
                                <tr className="bg-gradient-to-r from-white/80 to-zinc-50/80 backdrop-blur-xl">
                                    <th className="text-left py-5 px-4 font-black text-zinc-800 text-base tracking-tight border-b-2 border-white/50 w-[22%]">Dipendente</th>
                                    <th className="text-left py-5 px-4 font-black text-zinc-800 text-base tracking-tight border-b-2 border-white/50 w-[14%]">Tipo</th>
                                    <th className="text-left py-5 px-4 font-black text-zinc-800 text-base tracking-tight border-b-2 border-white/50 w-[13%]">Data</th>
                                    <th className="text-left py-5 px-4 font-black text-zinc-800 text-base tracking-tight border-b-2 border-white/50 w-[10%]">Durata</th>
                                    <th className="text-left py-5 px-4 font-black text-zinc-800 text-base tracking-tight border-b-2 border-white/50 w-[16%]">Motivo</th>
                                    <th className="text-left py-5 px-4 font-black text-zinc-800 text-base tracking-tight border-b-2 border-white/50 w-[25%]">Azioni</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100/50">
                                {pendingRequests.map((richiesta, index) => {
                                    const tipoLower = (richiesta.tipo || '').toLowerCase().trim();
                                    const isSmartWorking = tipoLower === 'smartworking';
                                    const canApprove = isAdmin || (isManager && isSmartWorking);

                                    return (
                                        <tr
                                            key={richiesta.id || index}
                                            className="hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-blue-50/60 transition-all duration-200 group"
                                        >
                                            {/* Dipendente */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-xl flex items-center justify-center text-base font-black shadow-lg border-2 border-white/50">
                                                            {getInitials(richiesta.dipendente)}
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-md animate-pulse">!</div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-black text-zinc-900 truncate">{getFullName(richiesta)}</div>
                                                        {richiesta.team && <div className="text-xs text-zinc-500 font-medium truncate">{richiesta.team}</div>}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Tipo */}
                                            <td className="py-4 px-4">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-lg inline-flex items-center gap-1.5 bg-gradient-to-r ${getTipoColor(richiesta.tipo)} text-white`}>
                                <span>{getTipoEmoji(richiesta.tipo)}</span>
                                <span className="truncate">{richiesta.tipo}</span>
                            </span>
                                            </td>

                                            {/* Data */}
                                            <td className="py-4 px-4">
                                                <div className="text-sm font-semibold text-zinc-800">
                                                    {richiesta.data
                                                        ? (() => {
                                                            if (richiesta.data.includes('/')) return richiesta.data;
                                                            const [a, m, g] = richiesta.data.split('-').map(Number);
                                                            return new Date(a, m - 1, g).toLocaleDateString('it-IT');
                                                        })()
                                                        : '—'}
                                                </div>
                                            </td>

                                            {/* Durata */}
                                            <td className="py-4 px-4">
                                                <div className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                                    {richiesta.durata}
                                                </div>
                                            </td>

                                            {/* Motivo */}
                                            <td className="py-4 px-4">
                                                {richiesta.motivo ? (
                                                    <button
                                                        onClick={() => setMotivoAperto(richiesta.id)}
                                                        className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-zinc-700 font-medium line-clamp-1 hover:bg-amber-100 transition-all text-left w-full max-w-[160px] flex items-center gap-1.5"
                                                    >
                                                        <span className="line-clamp-1 flex-1">{richiesta.motivo}</span>
                                                        <span className="text-amber-500 shrink-0">↗</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-zinc-400 text-sm">—</span>
                                                )}
                                            </td>

                                            {/* Azioni */}
                                            <td className="py-4 px-4">
                                                {canApprove ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApprova(richiesta)}
                                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm rounded-xl shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                                                        >
                                                            <Check className="w-4 h-4" /> Approva
                                                        </button>
                                                        <button
                                                            onClick={() => handleRifiuta(richiesta)}
                                                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-sm rounded-xl shadow-lg hover:from-rose-600 hover:to-red-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                                                        >
                                                            <X className="w-4 h-4" /> Rifiuta
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border-2 border-zinc-200/50">
                                                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                                        <span className="text-sm font-black text-zinc-600">In Attesa</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Popup Motivo */}
                        {motivoAperto && (() => {
                            const richiesta = pendingRequests.find(r => r.id === motivoAperto);
                            if (!richiesta) return null;
                            return (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4  backdrop-blur-sm"
                                    onClick={() => setMotivoAperto(null)}
                                >
                                    <div
                                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/70"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-zinc-800">Motivo richiesta</h3>
                                            <button
                                                onClick={() => setMotivoAperto(null)}
                                                className="p-2 hover:bg-zinc-100 rounded-xl transition-all"
                                            >
                                                <X className="w-5 h-5 text-zinc-500" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                                            <div className="w-9 h-9 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-xl flex items-center justify-center text-base font-black shadow-md">
                                                {getInitials(richiesta.dipendente)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-zinc-900">{getFullName(richiesta)}</div>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black inline-flex items-center gap-1 bg-gradient-to-r ${getTipoColor(richiesta.tipo)} text-white`}>
                            {getTipoEmoji(richiesta.tipo)} {richiesta.tipo}
                        </span>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <p className="text-sm text-zinc-700 font-medium leading-relaxed">{richiesta.motivo}</p>
                                        </div>
                                        <button
                                            onClick={() => setMotivoAperto(null)}
                                            className="w-full mt-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm rounded-xl transition-all"
                                        >
                                            Chiudi
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}


                        {/* Empty State */}
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
                                    {isManager ? ' di smartworking' : ' in attesa della tua approvazione'}.
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
