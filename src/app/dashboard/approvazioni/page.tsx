'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from "@/components/DashboardHeader";
import { usePendingRequests } from '@/hooks/usePendingRequests';

export default function Approvazioni() {
    const { user } = useAuth();
    const { richieste, loading, approva, rifiuta } = usePendingRequests();

    const getInitials = (name?: string) => name?.charAt(0).toUpperCase() || '👤';
    const getFullName = (richiesta: any) => richiesta.dipendente || 'Nome non disponibile';
    const pendingRequests = richieste.filter(r => r.stato === 'pending');

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-blue-100/10 backdrop-blur-xl" />
                <div className="bg-white/40 backdrop-blur-3xl rounded-3xl p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white shadow-xl"></div>
                    </div>
                    <h2 className="text-3xl font-light tracking-tight text-zinc-800 mb-4 backdrop-blur-xl">
                        Caricamento richieste
                    </h2>
                    <p className="text-xl text-zinc-600 font-light backdrop-blur-xl">
                        Aggiornamento dati in tempo reale
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8 relative overflow-hidden">
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 via-blue-500/2 to-indigo-500/1 backdrop-blur-xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-12">
                {/* Header Glass */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-3xl shadow-2xl p-10 border border-white/60 hover:shadow-3xl transition-all duration-700 hover:-translate-y-1 group">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl border border-white/40 backdrop-blur-xl shrink-0 mt-1 group-hover:scale-110 transition-transform duration-500">
                            <span className="text-3xl drop-shadow-lg">✅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-zinc-800 to-slate-800 bg-clip-text text-transparent mb-4 leading-tight">
                                Richieste Approvazione
                            </h1>
                            <div className="flex items-center gap-6 text-xl text-zinc-600 font-light">
                                <span>
                                    {user?.role === 'manager'
                                        ? `Team ${user.team || 'Sviluppo'}`
                                        : 'Tutte le richieste'}
                                </span>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="font-mono text-sm tracking-wider text-zinc-500 uppercase px-4 py-1 bg-white/50 backdrop-blur-xl rounded-full border border-zinc-200 shadow-sm">
                                    {pendingRequests.length} nuove
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-10 border border-white/70 hover:shadow-3xl transition-all duration-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gradient-to-r from-white/80 to-zinc-50/80 backdrop-blur-xl">
                                    <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">👤 Dipendente</th>
                                    <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Tipo</th>
                                    <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Date</th>
                                    <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Durata</th>
                                    <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Azioni</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100/50">
                                {pendingRequests.map((richiesta, index) => (
                                    <tr
                                        key={richiesta.id || index}
                                        className="hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-blue-50/80 backdrop-blur-xl transition-all duration-300 group"
                                    >
                                        <td className="py-8 px-10">
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-3xl flex items-center justify-center text-2xl font-black shadow-2xl border-4 border-white/50 backdrop-blur-xl group-hover:shadow-emerald-200 group-hover:border-emerald-300/50 transition-all duration-500 hover:scale-110 hover:rotate-3">
                                                        {getInitials(richiesta.dipendente)}
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">!</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-black text-zinc-900 mb-1 leading-tight">{getFullName(richiesta)}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-8 px-10">
                                                <span className={`px-6 py-3 rounded-2xl text-sm font-black shadow-xl backdrop-blur-xl border border-white/50 inline-block ${
                                                    richiesta.tipo === 'Smartworking'
                                                        ? 'bg-gradient-to-r from-blue-400/90 to-blue-500/90 text-white shadow-blue-500/25'
                                                        : richiesta.tipo === 'Ferie'
                                                            ? 'bg-gradient-to-r from-orange-400/90 to-orange-500/90 text-white shadow-orange-500/25'
                                                            : 'bg-gradient-to-r from-emerald-400/90 to-teal-500/90 text-white shadow-emerald-500/25'
                                                } hover:shadow-2xl hover:scale-105 transition-all duration-300`}>
                                                    {richiesta.tipo}
                                                </span>
                                        </td>

                                        <td className="py-8 px-10">
                                            <div className="text-xl font-semibold text-zinc-800">{richiesta.data}</div>
                                        </td>

                                        <td className="py-8 px-10">
                                            <div className="text-4xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">
                                                {richiesta.durata}
                                            </div>
                                            <div className="text-sm text-zinc-500 font-mono uppercase tracking-wider mt-1">
                                                ore/giorni
                                            </div>
                                        </td>

                                        <td className="py-8 px-10">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={async () => {
                                                        const success = await approva(richiesta.id);
                                                        if (success) {
                                                            alert(`✅ Approvata richiesta di ${getFullName(richiesta)}!`);
                                                        }
                                                    }}
                                                    className="px-8 py-4 h-16 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-3xl hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex items-center justify-center backdrop-blur-xl border border-emerald-400/50 group/button"
                                                >
                                                    Approva
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const success = await rifiuta(richiesta.id);
                                                        if (success) {
                                                            alert(`❌ Rifiutata richiesta di ${getFullName(richiesta)}`);
                                                        }
                                                    }}
                                                    className="px-8 py-4 h-16 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-3xl hover:from-rose-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-rose-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex items-center justify-center backdrop-blur-xl border border-rose-400/50"
                                                >
                                                    Rifiuta
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Empty State */}
                    {pendingRequests.length === 0 && (
                        <div className="text-center py-32">
                            <div className="w-48 h-48 mx-auto mb-12 bg-gradient-to-br from-emerald-100/70 via-blue-100/50 to-indigo-100/30 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-dashed border-emerald-200/50 backdrop-blur-xl">
                                <div className="text-8xl opacity-20 drop-shadow-2xl">📭</div>
                            </div>
                            <h3 className="text-5xl font-black bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent mb-6 tracking-tight">
                                Nessuna richiesta
                            </h3>
                            <p className="text-2xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                                Non ci sono nuove richieste di ferie, permessi o smartworking
                                in attesa della tua approvazione.
                            </p>
                            <div className="inline-flex items-center gap-3 px-10 py-6 bg-gradient-to-r from-emerald-500/90 to-green-600/90 text-white rounded-3xl shadow-2xl backdrop-blur-xl font-black text-xl border border-emerald-400/50 hover:shadow-3xl hover:scale-105 hover:from-emerald-600 hover:to-green-700 transition-all duration-500">
                                <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold animate-pulse">✨</div>
                                Tutto aggiornato
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
