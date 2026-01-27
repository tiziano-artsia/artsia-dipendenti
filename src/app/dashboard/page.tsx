'use client';

import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { Calendar, Clock, Home, FileText, CheckCircle, LogOut, Briefcase, Sun, Loader2, Plane, DollarSign, Eye, EyeOff, Euro, Download } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
    const { user, logout, token } = useAuth();
    const { stats, loading } = useStats();
    const [showPayslips, setShowPayslips] = useState(false); // Toggle visibilità importi

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    // 🔥 Simula payslips recenti (sostituisci con usePayslips hook)
    const payslipsRecent = [
        { id: 1, meseAnno: 'Dicembre 2025', netto: '€2.450', nettoHidden: '****' },
        { id: 2, meseAnno: 'Novembre 2025', netto: '€2.380', nettoHidden: '****' },
        { id: 3, meseAnno: 'Ottobre 2025', netto: '€2.410', nettoHidden: '****' }
    ];

    // 🔥 LOADING STATE
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-8">
                <div className="bg-white/40 backdrop-blur-3xl rounded-3xl p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50">
                    <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                    <h2 className="text-3xl font-light tracking-tight text-zinc-800 mb-4">
                        Caricamento statistiche...
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/2 via-blue-500/1 to-purple-500/1 backdrop-blur-xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                {/* Header */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/60 hover:shadow-3xl transition-all duration-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl border border-white/40 shrink-0">
                                <Briefcase className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-zinc-800 to-slate-800 bg-clip-text text-transparent mb-3 leading-tight">
                                    Dashboard
                                </h1>
                                <p className="text-xl text-zinc-600 font-light flex flex-wrap items-center gap-2">
                                    <span>Benvenuto</span>
                                    <span className="font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                        {user?.name}
                                    </span>
                                    <span className="px-3 py-1 bg-white/50 backdrop-blur-xl rounded-full text-xs font-mono text-zinc-700 border border-zinc-200 uppercase tracking-wider">
                                        {user?.role}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-8 py-4 h-14 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-3xl hover:from-rose-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-rose-500/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl border border-rose-400/50 whitespace-nowrap"
                        >
                            <LogOut className="w-5 h-5" />
                            Esci
                        </button>
                    </div>
                </div>

                {/* 🔥 Stats Grid (4 card, responsive) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            value: stats.ferie,
                            label: 'Ferie',
                            icon: Plane,
                            color: 'from-orange-500 to-orange-600',
                            unit: 'giorni',
                            bgColor: 'from-orange-100/80 to-orange-50/60'
                        },
                        {
                            value: stats.permessi,
                            label: 'Permessi',
                            icon: Clock,
                            color: 'from-yellow-500 to-amber-600',
                            unit: 'ore',
                            bgColor: 'from-yellow-100/80 to-amber-50/60'
                        },
                        {
                            value: stats.smartworking,
                            label: 'Smartworking',
                            icon: Home,
                            color: 'from-blue-500 to-indigo-600',
                            unit: 'giorni',
                            bgColor: 'from-blue-100/80 to-blue-50/60'
                        },
                        {
                            value: stats.malattia,
                            label: 'Malattia',
                            icon: FileText,
                            color: 'from-rose-500 to-red-600',
                            unit: 'giorni',
                            bgColor: 'from-rose-100/80 to-red-50/60'
                        }
                    ].map(({ value, label, icon: Icon, color, unit, bgColor }) => (
                        <div
                            key={label}
                            className="group bg-white/70 backdrop-blur-3xl rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 border border-white/50 hover:border-white/70 transition-all duration-500 cursor-pointer relative overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10">
                                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                                    <Icon className="w-7 h-7 text-white drop-shadow-lg" />
                                </div>

                                <h3 className="text-sm font-black text-zinc-600 uppercase tracking-wider mb-3 opacity-90">
                                    {label}
                                </h3>

                                <div className="flex items-baseline gap-2">
                                    <p className={`text-5xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                                        {value}
                                    </p>
                                </div>

                                <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase opacity-70 mt-2">
                                    {unit} {value === 0 || value === 1}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SEZIONE Buste Paga con Toggle Occhio */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <FileText className="w-12 h-12 text-indigo-600 shrink-0" />
                            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent">
                                Ultime Buste Paga
                            </h2>
                        </div>
                        {/* Toggle Visibilità Importi */}
                        <button
                            onClick={() => setShowPayslips(!showPayslips)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300 text-sm font-mono uppercase tracking-wider"
                            title={showPayslips ? "Nascondi importi" : "Mostra importi"}
                        >
                            {showPayslips ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span>{showPayslips ? 'Nascondi' : 'Mostra'}</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {payslipsRecent.map(({ id, meseAnno, netto, nettoHidden }) => (
                            <a
                                key={id}
                                href={`/api/payslips/${id}/download?token=${token}`}
                                download={`busta-paga-${meseAnno.toLowerCase().replace(' ', '-')}.pdf`}
                                className="group relative p-6 bg-white/90 backdrop-blur-xl border border-zinc-200/50 rounded-2xl hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-400 overflow-hidden flex flex-col"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="relative z-10 flex items-start justify-between mb-3">
                                    <h3 className="font-black text-xl text-zinc-800 group-hover:text-indigo-700">
                                        {meseAnno}
                                    </h3>
                                    <Euro className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                </div>
                                
                                <p className="text-2xl font-black text-indigo-600 mb-2">
                                    {showPayslips ? netto : nettoHidden}
                                </p>
                                
                                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                                    <span>Scarica PDF</span>
                                     <Download className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                </div>
                            </a>
                        ))}
                        <a
                            href="/dashboard/buste-paga"
                            className="group p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-400 flex flex-col items-center justify-center text-center"
                        >
                            <FileText className="w-12 h-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="font-black text-xl text-zinc-700 mb-2">Vedi Tutte</h3>
                            <p className="text-sm text-zinc-500">Archivio completo buste paga</p>
                        </a>
                    </div>
                </div>

                {/* Quick Actions (3 card) */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">
                    <h2 className="text-4xl font-black tracking-tight mb-10 bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent">
                        Azioni Rapide
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                href: '/dashboard/miei-dati',
                                label: 'I Miei Dati',
                                icon: FileText,
                                color: 'from-blue-500 to-indigo-600',
                                description: 'Gestisci le tue assenze'
                            },
                            {
                                href: '/dashboard/calendario',
                                label: 'Calendario',
                                icon: Calendar,
                                color: 'from-purple-500 to-violet-600',
                                description: 'Visualizza le date'
                            },
                            {
                                href: '/dashboard/approvazioni',
                                label: 'Approvazioni',
                                icon: CheckCircle,
                                color: 'from-emerald-500 to-green-600',
                                description: 'Approva richieste'
                            }
                        ].map(({ href, label, icon: Icon, color, description }) => (
                            <a
                                key={label}
                                href={href}
                                className="group relative p-8 bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl hover:shadow-2xl hover:border-white/90 hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col items-center text-center"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                <div className="relative z-10 w-full">
                                    <div className={`w-20 h-20 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 mx-auto border border-white/50`}>
                                        <Icon className="w-9 h-9 text-white drop-shadow-lg" />
                                    </div>

                                    <h3 className="text-xl font-black text-zinc-800 mb-3 group-hover:text-zinc-900 transition-colors">
                                        {label}
                                    </h3>

                                    <p className="text-sm text-zinc-600 font-light mb-4">
                                        {description}
                                    </p>

                                    <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase opacity-75 group-hover:opacity-100 transition-opacity">
                                        <span>Apri</span>
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
