'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyAbsences } from '@/hooks/useMyAbsences';
import { FileText, Calendar, Clock, Sun, Home, Bed, CheckCircle, XCircle, Loader2, Send, RotateCcw, AlertCircle, Filter, X } from 'lucide-react';

export default function MieiDati() {
    const { user } = useAuth();
    const { assenze, loading, submitRequest } = useMyAbsences();

    const [form, setForm] = useState({
        tipo: '',
        dataInizio: '',
        durata: '',
        motivo: ''
    });

    // 🔥 STATI FILTRI
    const [filtri, setFiltri] = useState({
        tipo: 'tutti',      // tutti, ferie, malattia, permesso, smartworking
        stato: 'tutti',     // tutti, pending, approved, rejected
        periodo: 'tutti'    // tutti, ultimo-mese, ultimi-3-mesi, anno-corrente
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            tipo: form.tipo,
            data: form.dataInizio,
            durata: Number(form.durata),
            motivo: form.motivo || ''
        };

        console.log('📤 Inviando:', payload);

        const success = await submitRequest(payload);
        if (success) {
            alert('✅ Richiesta inviata! In attesa di approvazione.');
            setForm({ tipo: '', dataInizio: '', durata: '', motivo: '' });
        } else {
            alert('❌ Errore invio. Riprova.');
        }
    };

    const getDurataLabel = (tipo: string) => {
        const tipoLower = tipo?.toLowerCase() || '';
        return tipoLower === 'permesso' ? 'ore' : 'giorni';
    };

    const getTipoIcon = (tipo: string) => {
        const tipoLower = tipo?.toLowerCase() || '';
        if (tipoLower === 'ferie') return Sun;
        if (tipoLower === 'permesso') return Clock;
        if (tipoLower === 'smartworking') return Home;
        if (tipoLower === 'malattia') return Bed;
        return Calendar;
    };

    const formattaData = (dataIso: string): string => {
        if (!dataIso) return 'N/D';
        try {
            // Se già formato italiano, ritorna così
            if (dataIso.includes('/')) return dataIso;
            return new Date(dataIso).toLocaleDateString('it-IT');
        } catch {
            return dataIso;
        }
    };

    const getTipoLabel = (tipo: string) => {
        const tipoLower = tipo?.toLowerCase() || '';
        return tipoLower === 'ferie' ? 'Ferie' :
            tipoLower === 'malattia' ? 'Malattia' :
                tipoLower === 'smartworking' ? 'Smartworking' : 'Permesso';
    };

    // 🔥 RESET FILTRI
    const resetFiltri = () => {
        setFiltri({ tipo: 'tutti', stato: 'tutti', periodo: 'tutti' });
    };

    const contaFiltriAttivi = () => {
        let count = 0;
        if (filtri.tipo !== 'tutti') count++;
        if (filtri.stato !== 'tutti') count++;
        if (filtri.periodo !== 'tutti') count++;
        return count;
    };

    // 🔥 ORDINAMENTO + FILTRAGGIO
    const assenzeFiltrate = useMemo(() => {
        console.log('📊 Assenze grezze:', assenze);

        // 1. ORDINA per data creazione (più recenti prima)
        let risultato = [...assenze].sort((a, b) => {
            const timeA = a.createdAt
                ? new Date(a.createdAt).getTime()
                : a._id && typeof a._id === 'string'
                    ? parseInt(a._id.substring(0, 8), 16) * 1000
                    : 0;

            const timeB = b.createdAt
                ? new Date(b.createdAt).getTime()
                : b._id && typeof b._id === 'string'
                    ? parseInt(b._id.substring(0, 8), 16) * 1000
                    : 0;

            return timeB - timeA; // PIÙ RECENTI PRIMA
        });

        // 2. FILTRA per tipo
        if (filtri.tipo !== 'tutti') {
            risultato = risultato.filter(a =>
                a.tipo?.toLowerCase() === filtri.tipo.toLowerCase()
            );
        }

        // 3. FILTRA per stato
        if (filtri.stato !== 'tutti') {
            risultato = risultato.filter(a => a.stato === filtri.stato);
        }

        // 4. FILTRA per periodo
        if (filtri.periodo !== 'tutti') {
            const oggi = new Date();
            risultato = risultato.filter(a => {
                const dataAssenza = new Date(a.dataInizio || a.data);
                const diffMesi = (oggi.getTime() - dataAssenza.getTime()) / (1000 * 60 * 60 * 24 * 30);

                switch (filtri.periodo) {
                    case 'ultimo-mese':
                        return diffMesi <= 1;
                    case 'ultimi-3-mesi':
                        return diffMesi <= 3;
                    case 'anno-corrente':
                        return dataAssenza.getFullYear() === oggi.getFullYear();
                    default:
                        return true;
                }
            });
        }

        console.log('✅ Assenze filtrate:', risultato.length);
        return risultato;
    }, [assenze, filtri]);

    const nomeUtente = user?.name || `Utente ${user?.id || ''}`;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-blue-100/10 backdrop-blur-xl" />
                <div className="bg-white/40 backdrop-blur-3xl rounded-3xl p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                    <h2 className="text-3xl font-light tracking-tight text-zinc-800 mb-4">
                        Caricamento dati
                    </h2>
                    <p className="text-xl text-zinc-600 font-light">
                        Aggiornamento assenze personali
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/2 via-blue-500/1 to-purple-500/2 backdrop-blur-xl pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10 space-y-12">

                {/* Header */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-3xl shadow-2xl p-10 border border-white/60 hover:shadow-3xl transition-all duration-700 hover:-translate-y-1 group">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl border border-white/40 backdrop-blur-xl shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <FileText className="w-10 h-10 text-white drop-shadow-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-zinc-800 to-slate-800 bg-clip-text text-transparent mb-4 leading-tight">
                                I Miei Dati
                            </h1>
                            <p className="text-2xl text-zinc-600 font-light">
                                Ciao <span className="font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{nomeUtente}</span>
                                <span className="mx-3 text-zinc-300">•</span>
                                <span className="text-lg">Gestisci le tue assenze</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* 🔥 PANNELLO FILTRI */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-xl p-8 border border-white/70">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Filter className="w-6 h-6 text-zinc-700" />
                            <h3 className="text-2xl font-black text-zinc-800">Filtri</h3>
                            {contaFiltriAttivi() > 0 && (
                                <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full shadow-lg">
                                    {contaFiltriAttivi()}
                                </span>
                            )}
                        </div>
                        {contaFiltriAttivi() > 0 && (
                            <button
                                onClick={resetFiltri}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
                            >
                                <X className="w-4 h-4" />
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Filtro Tipo */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-3">Tipo Assenza</label>
                            <select
                                value={filtri.tipo}
                                onChange={(e) => setFiltri({ ...filtri, tipo: e.target.value })}
                                className="w-full px-4 py-3 bg-white/80 border-2 border-zinc-200 rounded-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-md hover:shadow-lg transition-all"
                            >
                                <option value="tutti"> Tutti i tipi</option>
                                <option value="ferie">Ferie</option>
                                <option value="malattia"> Malattia</option>
                                <option value="permesso"> Permesso</option>
                                <option value="smartworking"> Smartworking</option>
                            </select>
                        </div>

                        {/* Filtro Stato */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-3">Stato Richiesta</label>
                            <select
                                value={filtri.stato}
                                onChange={(e) => setFiltri({ ...filtri, stato: e.target.value })}
                                className="w-full px-4 py-3 bg-white/80 border-2 border-zinc-200 rounded-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-md hover:shadow-lg transition-all"
                            >
                                <option value="tutti"> Tutti gli stati</option>
                                <option value="pending"> In attesa</option>
                                <option value="approved"> Approvate</option>
                                <option value="rejected"> Rifiutate</option>
                            </select>
                        </div>

                        {/* Filtro Periodo */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-3">Periodo</label>
                            <select
                                value={filtri.periodo}
                                onChange={(e) => setFiltri({ ...filtri, periodo: e.target.value })}
                                className="w-full px-4 py-3 bg-white/80 border-2 border-zinc-200 rounded-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-md hover:shadow-lg transition-all"
                            >
                                <option value="tutti">Tutti i periodi</option>
                                <option value="ultimo-mese"> Ultimo mese</option>
                                <option value="ultimi-3-mesi"> Ultimi 3 mesi</option>
                                <option value="anno-corrente"> Anno corrente</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabella Assenze */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent flex items-center gap-4">
                            <Calendar className="w-10 h-10 text-zinc-700" />
                            Le mie richieste
                        </h2>
                        <div className="px-6 py-3 bg-white/50 backdrop-blur-xl rounded-full border border-zinc-200 shadow-lg flex items-center gap-3">
                            <span className="text-2xl font-black text-emerald-600">{assenzeFiltrate.length}</span>
                            <span className="text-sm text-zinc-500 font-mono tracking-wider uppercase">
                                {assenzeFiltrate.length === assenze.length ? 'totali' : `su ${assenze.length}`}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="bg-gradient-to-r from-white/80 to-zinc-50/80 backdrop-blur-xl">
                                <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Data</th>
                                <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Tipo</th>
                                <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Durata</th>
                                <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Stato</th>
                                <th className="text-left py-8 px-10 font-black text-zinc-800 text-xl tracking-tight border-b-2 border-white/50">Motivo</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100/50">
                            {assenzeFiltrate.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-zinc-100/70 to-slate-100/50 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-dashed border-zinc-200/50 backdrop-blur-xl">
                                            <AlertCircle className="w-16 h-16 text-zinc-300" />
                                        </div>
                                        <h3 className="text-3xl font-black bg-gradient-to-r from-zinc-700 to-slate-600 bg-clip-text text-transparent mb-3">
                                            {contaFiltriAttivi() > 0 ? 'Nessun risultato' : 'Nessuna richiesta'}
                                        </h3>
                                        <p className="text-xl text-zinc-400 font-light">
                                            {contaFiltriAttivi() > 0
                                                ? 'Prova a modificare i filtri per vedere più risultati'
                                                : 'Le tue richieste appariranno qui in ordine cronologico'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                assenzeFiltrate.map((assenza, index) => {
                                    const tipoLower = (assenza.tipo || '').toLowerCase();
                                    const isPermesso = tipoLower === 'permesso';
                                    const TipoIcon = getTipoIcon(assenza.tipo);

                                    return (
                                        <tr key={assenza.id || assenza._id || index} className="hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 backdrop-blur-xl transition-all duration-300 group">
                                            <td className="py-8 px-10 text-xl font-semibold text-zinc-800">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-5 h-5 text-zinc-500" />
                                                    {formattaData(assenza.dataInizio || assenza.data || 'N/D')}
                                                </div>
                                            </td>

                                            <td className="py-8 px-10">
                                                    <span className={`px-6 py-3 rounded-2xl text-sm font-black shadow-xl backdrop-blur-xl border border-white/50 inline-flex items-center gap-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 ${
                                                        tipoLower === 'ferie'
                                                            ? 'bg-gradient-to-r from-orange-400/90 to-orange-500/90 text-white shadow-orange-500/25'
                                                            : tipoLower === 'malattia'
                                                                ? 'bg-gradient-to-r from-rose-400/90 to-red-500/90 text-white shadow-rose-500/25'
                                                                : tipoLower === 'smartworking'
                                                                    ? 'bg-gradient-to-r from-blue-400/90 to-blue-500/90 text-white shadow-blue-500/25'
                                                                    : 'bg-gradient-to-r from-yellow-400/90 to-amber-500/90 text-white shadow-yellow-500/25'
                                                    }`}>
                                                        <TipoIcon className="w-4 h-4" />
                                                        {getTipoLabel(assenza.tipo)}
                                                    </span>
                                            </td>

                                            <td className="py-8 px-10">
                                                <div className="flex items-baseline gap-3">
                                                    <div className="text-4xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">
                                                        {assenza.durata || 0}
                                                    </div>
                                                    <div className={`text-xl font-black uppercase tracking-wider ${
                                                        isPermesso ? 'text-yellow-600' : 'text-blue-600'
                                                    }`}>
                                                        {isPermesso ? 'ore' : 'gg'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-8 px-10">
                                                    <span className={`px-6 py-3 rounded-2xl text-sm font-black shadow-xl backdrop-blur-xl border border-white/50 inline-flex items-center gap-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 ${
                                                        assenza.stato === 'approved'
                                                            ? 'bg-gradient-to-r from-emerald-400/90 to-green-500/90 text-white shadow-emerald-500/25'
                                                            : assenza.stato === 'pending'
                                                                ? 'bg-gradient-to-r from-amber-400/90 to-yellow-500/90 text-white shadow-amber-500/25'
                                                                : 'bg-gradient-to-r from-rose-400/90 to-red-500/90 text-white shadow-rose-500/25'
                                                    }`}>
                                                        {assenza.stato === 'pending' ? (
                                                            <>
                                                                <Clock className="w-4 h-4" />
                                                                In attesa
                                                            </>
                                                        ) : assenza.stato === 'approved' ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                Approvata
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4" />
                                                                Rifiutata
                                                            </>
                                                        )}
                                                    </span>
                                            </td>

                                            <td className="py-8 px-10 text-lg max-w-xs" title={assenza.motivo || 'Nessun motivo indicato'}>
                                                {assenza.motivo ? (
                                                    <span className="font-medium text-zinc-800 line-clamp-2">{assenza.motivo}</span>
                                                ) : (
                                                    <span className="text-zinc-400 italic font-light flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Nessun motivo
                                                        </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Nuova Richiesta */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">
                    <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent mb-10 flex items-center gap-4">
                        <Send className="w-9 h-9 text-zinc-700" />
                        Nuova Richiesta
                    </h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div>
                            <label className="block text-xl font-black tracking-tight text-zinc-800 mb-5 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Tipo assenza
                            </label>
                            <select
                                value={form.tipo}
                                onChange={(e) => setForm({ ...form, tipo: e.target.value, durata: '' })}
                                className="w-full h-16 px-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-2xl text-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all appearance-none"
                                required
                            >
                                <option value="">Seleziona tipo...</option>
                                <option value="ferie">🌴 Ferie (giorni)</option>
                                <option value="malattia">🤒 Malattia (giorni)</option>
                                <option value="permesso">⏰ Permesso (ore)</option>
                                <option value="smartworking">🏠 Smartworking (giorni)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xl font-black tracking-tight text-zinc-800 mb-5 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Data inizio
                            </label>
                            <input
                                type="date"
                                value={form.dataInizio}
                                onChange={(e) => setForm({ ...form, dataInizio: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full h-16 px-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-2xl text-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all"
                                required
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-xl font-black tracking-tight text-zinc-800 mb-5 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Durata
                                <span className={`ml-3 text-lg font-normal px-3 py-1 rounded-full ${
                                    form.tipo === 'permesso' ? 'text-yellow-600 bg-yellow-100' :
                                        form.tipo === 'malattia' ? 'text-red-600 bg-red-100' :
                                            'text-blue-600 bg-blue-100'
                                }`}>
                                    ({getDurataLabel(form.tipo)})
                                </span>
                            </label>
                            <div className="flex gap-6 items-center">
                                <input
                                    type="number"
                                    min="1"
                                    max={form.tipo === 'permesso' ? '8' : '30'}
                                    value={form.durata}
                                    onChange={(e) => setForm({ ...form, durata: e.target.value })}
                                    className="flex-1 h-20 px-8 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-2xl text-4xl font-black focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-emerald-300 transition-all text-center"
                                    placeholder="1"
                                    required
                                />
                                <div className={`px-8 py-6 backdrop-blur-xl rounded-2xl border shadow-lg flex items-center gap-3 min-w-[140px] ${
                                    form.tipo === 'permesso' ? 'bg-yellow-50/80 border-yellow-200 text-yellow-800' :
                                        form.tipo === 'malattia' ? 'bg-red-50/80 border-red-200 text-red-800' :
                                            'bg-blue-50/80 border-blue-200 text-blue-800'
                                }`}>
                                    {form.tipo === 'permesso' ? <Clock className="w-6 h-6" /> :
                                        form.tipo === 'malattia' ? <Bed className="w-6 h-6" /> :
                                            <Calendar className="w-6 h-6" />}
                                    <span className="text-3xl font-black">
                                        {getDurataLabel(form.tipo)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-500 mt-4 font-mono tracking-wider flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {form.tipo === 'permesso' ? 'Max: 8 ore per giorno' :
                                    form.tipo === 'malattia' ? 'Certificato medico richiesto oltre 3 giorni' :
                                        'Max: 30 giorni consecutivi'}
                            </p>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-xl font-black tracking-tight text-zinc-800 mb-5 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Motivo (opzionale)
                            </label>
                            <textarea
                                value={form.motivo}
                                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                                rows={5}
                                className="w-full p-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-2xl text-xl font-medium text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all resize-vertical placeholder-zinc-400"
                                placeholder="Es. Influenza, visita specialistica, vacanza estiva..."
                                maxLength={500}
                            />
                            <p className="text-sm text-zinc-500 mt-3 text-right font-mono tracking-wider">
                                {form.motivo.length}/500 caratteri
                            </p>
                        </div>

                        <div className="lg:col-span-2 flex flex-col sm:flex-row gap-6 pt-6">
                            <button
                                type="submit"
                                className="flex-1 h-20 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-2xl rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-500 flex items-center justify-center gap-4 backdrop-blur-xl border border-emerald-400/50 group"
                            >
                                <Send className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                                Invia Richiesta
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ tipo: '', dataInizio: '', durata: '', motivo: '' })}
                                className="flex-1 h-20 bg-gradient-to-r from-zinc-200 to-zinc-300 hover:from-zinc-300 hover:to-zinc-400 text-zinc-800 font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex items-center justify-center gap-3 backdrop-blur-xl border border-zinc-300/50 group"
                            >
                                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
