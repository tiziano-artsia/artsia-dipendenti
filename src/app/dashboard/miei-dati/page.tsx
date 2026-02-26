'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyAbsences } from '@/hooks/useMyAbsences';
import {
    FileText,
    Calendar,
    Clock,
    Sun,
    Home,
    Bed,
    CheckCircle,
    XCircle,
    Loader2,
    Send,
    RotateCcw,
    AlertCircle,
    Filter,
    X,
    Trash2,
    MapPin,
    Baby,
    List,
    Plus, ChevronRight, ChevronLeft, CalendarDays, FolderArchive
} from 'lucide-react';
import type {AbsenceDoc} from "@/lib/db";
import toast, {Toaster} from "react-hot-toast";



// Componente Modal di Conferma
function ConfirmModal({
                          isOpen,
                          onClose,
                          onConfirm,
                          title,
                          message,
                          isLoading
                      }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full border border-white/70 animate-scaleIn max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shrink-0">
                        <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-zinc-800">{title}</h3>
                </div>

                <p className="text-base sm:text-lg text-zinc-600 mb-6 sm:mb-8 leading-relaxed">{message}</p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:flex-1 h-12 sm:h-14 bg-zinc-200 hover:bg-zinc-300 disabled:bg-zinc-100 text-zinc-800 font-bold text-sm sm:text-base rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full sm:flex-1 h-12 sm:h-14 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                <span className="text-sm sm:text-base">Eliminazione...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">Conferma</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MieiDati() {
    const { user } = useAuth();
    const { assenze, loading, submitRequest, cancelRequest } = useMyAbsences();

    const [activeTab, setActiveTab] = useState<'richieste' | 'nuova'>('richieste');
    const [paginaCorrente, setPaginaCorrente] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [tabRichieste, setTabRichieste] = useState<'future' | 'passate'>('future');

    const [form, setForm] = useState({
        tipo: '',
        dataInizio: '',
        durata: '',
        motivo: '',
        dataFine: ''
    });

    const [filtri, setFiltri] = useState({
        tipo: 'tutti',
        stato: 'tutti',
        periodo: 'tutti'
    });

    const [modalState, setModalState] = useState({
        isOpen: false,
        absenceId: '',
        absenceType: '',
        absenceDate: '',
        isDeleting: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            tipo: form.tipo,
            data: form.dataInizio,
            durata: Number(form.durata),
            motivo: form.motivo || ''
        };

        const success = await submitRequest(payload);
        if (success) {
            toast.success('Richiesta inviata! In attesa di approvazione.',{duration:3000});
            setForm({dataFine: "", tipo: '', dataInizio: '', durata: '', motivo: '' });
            setActiveTab('richieste');
        } else {
            toast.error('Errore invio. Riprova.',{duration:3000});
        }


    };

    const handleCancelClick = (assenza: AbsenceDoc) => {
        setModalState({
            isOpen: true,
            absenceId: assenza.id || assenza._id?.toString() || '',
            absenceType: getTipoLabel(assenza.tipo),
            absenceDate: formattaData(assenza.dataInizio || assenza.data || ''),
            isDeleting: false
        });
    };

    const handleConfirmCancel = async () => {
        setModalState(prev => ({ ...prev, isDeleting: true }));

        const success = await cancelRequest(modalState.absenceId);

        if (success) {
            toast.success("Richiesta annullata con successo",{duration:3000});
            setModalState({ isOpen: false, absenceId: '', absenceType: '', absenceDate: '', isDeleting: false });
        } else {
            toast.error('Errore durante l\'annullamento',{duration:3000});
            setModalState(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleCloseModal = () => {
        if (!modalState.isDeleting) {
            setModalState({ isOpen: false, absenceId: '', absenceType: '', absenceDate: '', isDeleting: false });
        }
    };

    const getDurataLabel = (tipo: string) => {
        const tipoLower = tipo?.toLowerCase() || '';
        return tipoLower === 'permesso' ? 'ore' : 'giorni';
    };

    const getTipoIcon = (tipo: string) => {
        const tipoLower = tipo?.toLowerCase().replace(/\s+/g, '-') || '';
        if (tipoLower === 'ferie') return Sun;
        if (tipoLower === 'permesso') return Clock;
        if (tipoLower === 'smartworking') return Home;
        if (tipoLower === 'malattia') return Bed;
        if (tipoLower === 'festivita' || tipoLower === 'festività') return Calendar;
        if (tipoLower === 'fuori-sede') return MapPin;
        if (tipoLower === 'congedo-parentale') return Baby;
        return Calendar;
    };

    const getTipoLabel = (tipo: string) => {
        const tipoLower = tipo?.toLowerCase().replace(/\s+/g, '-') || '';
        return tipoLower === 'ferie' ? 'Ferie' :
            tipoLower === 'malattia' ? 'Malattia' :
                tipoLower === 'smartworking' ? 'Smartworking' :
                    tipoLower === 'permesso' ? 'Permesso' :
                        tipoLower === 'festivita' || tipoLower === 'festività' ? 'Festività' :
                            tipoLower === 'fuori-sede' ? 'Fuori Sede' :
                                tipoLower === 'congedo-parentale' ? 'Congedo Parentale' :
                                    'Altro';
    };

    const getTipoColor = (tipo: string): string => {
        const t = tipo.toLowerCase().trim();
        if (t === 'ferie') return 'from-orange-500 to-orange-600 border-orange-400';
        if (t === 'malattia') return 'from-rose-500 to-red-600 border-red-400';
        if (t === 'permesso') return 'from-yellow-500 to-amber-600 border-yellow-400';
        if (t === 'smartworking') return 'from-blue-500 to-blue-600 border-blue-400';
        if (t === 'fuori-sede') return 'from-cyan-500 to-cyan-600 border-cyan-400';
        if (t === 'congedo-parentale') return 'from-pink-500 to-pink-600 border-pink-400';
        return 'from-gray-500 to-gray-600 border-gray-400';
    };
    const formattaData = (dataIso: string): string => {
        if (!dataIso) return 'N/D';
        try {
            if (dataIso.includes('/')) return dataIso;
            return new Date(dataIso).toLocaleDateString('it-IT');
        } catch {
            return dataIso;
        }
    };

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

    const assenzeFiltrate = useMemo(() => {
        let risultato = assenze as unknown as AbsenceDoc[];

        if (filtri.tipo !== 'tutti') {
            risultato = risultato.filter(a => a.tipo?.toLowerCase() === filtri.tipo.toLowerCase());
        }

        if (filtri.stato !== 'tutti') {
            risultato = risultato.filter(a => a.stato === filtri.stato);
        }

        if (filtri.periodo !== 'tutti') {
            const oggi = new Date();
            risultato = risultato.filter(a => {
                const dataAssenza = new Date(a.dataInizio || a.data || '');
                const diffMs = oggi.getTime() - dataAssenza.getTime();
                const diffGiorni = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (filtri.periodo === 'ultimo-mese') return diffGiorni <= 30;
                if (filtri.periodo === 'ultimi-3-mesi') return diffGiorni <= 90;
                if (filtri.periodo === 'anno-corrente') {
                    return dataAssenza.getFullYear() === oggi.getFullYear();
                }
                return true;
            });
        }

        return risultato.sort((a, b) => {
            const timeA = a.createdAt?.getTime() ||
                (typeof a._id === 'string' ?
                    parseInt(a._id.substring(0, 8), 16) * 1000 : 0);

            const timeB = b.createdAt?.getTime() ||
                (typeof b._id === 'string' ?
                    parseInt(b._id.substring(0, 8), 16) * 1000 : 0);

            return timeB - timeA;
        });
    }, [assenze, filtri]);

    const nomeUtente = user?.name || `Utente ${user?.id || ''}`;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-blue-100/10 backdrop-blur-xl" />
                <div className="bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50 relative z-10 w-full">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl sm:rounded-3xl mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white animate-spin" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-zinc-800 mb-3 sm:mb-4">
                        Caricamento dati
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-zinc-600 font-light">
                        Aggiornamento assenze personali
                    </p>
                </div>
            </div>
        );
    }




    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 sm:p-4 md:p-8 relative overflow-hidden">
            <Toaster
                position="bottom-center"
                reverseOrder={false}
            />

            <ConfirmModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmCancel}
                title="Annulla Richiesta"
                message={`Sei sicuro di voler annullare la richiesta di ${modalState.absenceType} del ${modalState.absenceDate}? Questa azione non può essere annullata.`}
                isLoading={modalState.isDeleting}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/2 via-blue-500/1 to-purple-500/2 backdrop-blur-xl pointer-events-none" />
            <div className="max-w-7xl mx-auto relative z-10 space-y-6 sm:space-y-8">

                {/* Header */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-10 border border-white/60 hover:shadow-3xl transition-all duration-700 hover:-translate-y-1 group">
                    <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl border border-white/40 backdrop-blur-xl shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <FileText className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-zinc-800 to-slate-800 bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4 leading-tight">
                                Le mie Richieste
                            </h1>
                            <p className="text-base sm:text-lg md:text-2xl text-zinc-600 font-light">
                                Ciao <span className="font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{nomeUtente}</span>
                                <span className="mx-2 sm:mx-3 text-zinc-300 hidden sm:inline">•</span>
                                <span className="text-sm sm:text-base md:text-lg block sm:inline mt-1 sm:mt-0">Gestisci le tue assenze</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-xl p-2 border border-white/70 flex gap-2">
                    <button
                        onClick={() => setActiveTab('richieste')}
                        className={`flex-1 h-14 sm:h-16 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                            activeTab === 'richieste'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                                : 'bg-transparent text-zinc-600 hover:bg-zinc-100'
                        }`}
                    >
                        <List className="w-5 h-5" />
                        Le mie Richieste
                    </button>
                    <button
                        onClick={() => setActiveTab('nuova')}
                        className={`flex-1 h-14 sm:h-16 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                            activeTab === 'nuova'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                                : 'bg-transparent text-zinc-600 hover:bg-zinc-100'
                        }`}
                    >
                        <Plus className="w-5 h-5" />
                        Nuova Richiesta
                    </button>
                </div>

                {/* Tab Content - Le mie Richieste */}
                {activeTab === 'richieste' && (() => {
                    const parsaTs = (d: string) => {
                        if (!d || d === 'N/D') return 0;
                        if (d.includes('/')) {
                            const [g, m, a] = d.split('/').map(Number);
                            return new Date(a, m - 1, g).getTime();
                        }
                        const [a, m, g] = d.split('-').map(Number);
                        return new Date(a, m - 1, g).getTime();
                    };

                    const assenzeSorted = [...assenzeFiltrate].sort((a, b) =>
                        parsaTs(b.dataInizio || b.data || '') - parsaTs(a.dataInizio || a.data || '')
                    );

                    const totalePagine = Math.ceil(assenzeSorted.length / itemsPerPage);
                    const assenzePagina = assenzeSorted.slice(
                        (paginaCorrente - 1) * itemsPerPage,
                        paginaCorrente * itemsPerPage
                    );

                    return (
                        <>
                            {/* Filtri */}
                            <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-white/70">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-700" />
                                        <h3 className="text-xl sm:text-2xl font-black text-zinc-800">Filtri</h3>
                                        {contaFiltriAttivi() > 0 && (
                                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg">
                                {contaFiltriAttivi()}
                            </span>
                                        )}
                                    </div>
                                    {contaFiltriAttivi() > 0 && (
                                        <button
                                            onClick={() => { resetFiltri(); setPaginaCorrente(1); }}
                                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto justify-center"
                                        >
                                            <X className="w-4 h-4" />
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-2 sm:mb-3">Tipo Assenza</label>
                                        <select
                                            value={filtri.tipo}
                                            onChange={(e) => { setFiltri({ ...filtri, tipo: e.target.value }); setPaginaCorrente(1); }}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/80 border-2 border-zinc-200 rounded-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-md hover:shadow-lg transition-all"
                                        >
                                            <option value="tutti">🔍 Tutti i tipi</option>
                                            <option value="ferie">🌴 Ferie</option>
                                            <option value="malattia">🤒 Malattia</option>
                                            <option value="permesso">⏰ Permesso</option>
                                            <option value="smartworking">🏠 Smartworking</option>
                                            <option value="fuori-sede">📍 Fuori Sede</option>
                                            <option value="congedo-parentale">👶 Congedo Parentale</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-2 sm:mb-3">Stato Richiesta</label>
                                        <select
                                            value={filtri.stato}
                                            onChange={(e) => { setFiltri({ ...filtri, stato: e.target.value }); setPaginaCorrente(1); }}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/80 border-2 border-zinc-200 rounded-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-md hover:shadow-lg transition-all"
                                        >
                                            <option value="tutti">🔍 Tutti gli stati</option>
                                            <option value="pending">⏳ In attesa</option>
                                            <option value="approved">✅ Approvate</option>
                                            <option value="rejected">❌ Rifiutate</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-2 sm:mb-3">Periodo</label>
                                        <select
                                            value={filtri.periodo}
                                            onChange={(e) => { setFiltri({ ...filtri, periodo: e.target.value }); setPaginaCorrente(1); }}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/80 border-2 border-zinc-200 rounded-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-md hover:shadow-lg transition-all"
                                        >
                                            <option value="tutti">📅 Tutti i periodi</option>
                                            <option value="ultimo-mese">📆 Ultimo mese</option>
                                            <option value="ultimi-3-mesi">📊 Ultimi 3 mesi</option>
                                            <option value="anno-corrente">🗓️ Anno corrente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">

                                {/* Header */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent flex items-center gap-3 sm:gap-4">
                                        <Calendar className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-zinc-700" />
                                        Le mie richieste
                                    </h2>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Contatore */}
                                        <div className="px-4 sm:px-6 py-2 sm:py-3 bg-white/50 backdrop-blur-xl rounded-full border border-zinc-200 shadow-lg flex items-center gap-2 sm:gap-3">
                                            <span className="text-xl sm:text-2xl font-black text-emerald-600">{assenzeFiltrate.length}</span>
                                            <span className="text-[10px] sm:text-xs md:text-sm text-zinc-500 font-mono tracking-wider uppercase">
                    {assenzeFiltrate.length === assenze.length ? 'totali' : `su ${assenze.length}`}
                </span>
                                        </div>
                                        {/* Selettore righe per pagina */}
                                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 border-2 border-zinc-200 rounded-xl shadow-md">
                                            <span className="text-xs sm:text-sm font-bold text-zinc-500 whitespace-nowrap">Mostra</span>
                                            {[10, 20, 50].map((n) => (
                                                <button
                                                    key={n}
                                                    onClick={() => { setItemsPerPage(n); setPaginaCorrente(1); }}
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-black transition-all ${
                                                        itemsPerPage === n
                                                            ? 'bg-emerald-500 text-white shadow-lg'
                                                            : 'text-zinc-600 hover:bg-zinc-100'
                                                    }`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Tab Future / Passate */}
                                {(() => {
                                    const oggi = new Date();
                                    oggi.setHours(0, 0, 0, 0);

                                    const parsaTs = (d: string) => {
                                        if (!d || d === 'N/D') return 0;
                                        if (d.includes('/')) {
                                            const [g, m, a] = d.split('/').map(Number);
                                            return new Date(a, m - 1, g).getTime();
                                        }
                                        const [a, m, g] = d.split('-').map(Number);
                                        return new Date(a, m - 1, g).getTime();
                                    };

                                    const isDataFutura = (assenza: typeof assenzeFiltrate[0]) => {
                                        const d = new Date(parsaTs(assenza.dataInizio || assenza.data || ''));
                                        d.setHours(0, 0, 0, 0);
                                        return d >= oggi;
                                    };

                                    const future = [...assenzeFiltrate]
                                        .filter(isDataFutura)
                                        .sort((a, b) => parsaTs(a.dataInizio || a.data || '') - parsaTs(b.dataInizio || b.data || '')); // prima → dopo

                                    const passate = [...assenzeFiltrate]
                                        .filter(a => !isDataFutura(a))
                                        .sort((a, b) => parsaTs(b.dataInizio || b.data || '') - parsaTs(a.dataInizio || a.data || '')); // più recente prima

                                    const listaAttiva = tabRichieste === 'future' ? future : passate;
                                    const totalePagine = Math.ceil(listaAttiva.length / itemsPerPage);
                                    const assenzePagina = listaAttiva.slice(
                                        (paginaCorrente - 1) * itemsPerPage,
                                        paginaCorrente * itemsPerPage
                                    );

                                    const renderRiga = (assenza: typeof assenzeFiltrate[0], index: number) => {
                                        const tipoLower = (assenza.tipo || '').toLowerCase().trim();
                                        const isPermesso = tipoLower === 'permesso';
                                        const TipoIcon = getTipoIcon(assenza.tipo);
                                        const canCancel = (() => {
                                            const dataString = assenza.dataInizio || assenza.data;
                                            if (!dataString || dataString === 'N/D') return false;
                                            try {
                                                let dataRichiesta: Date;
                                                if (dataString.includes('/')) {
                                                    const [g, m, a] = dataString.split('/').map(Number);
                                                    dataRichiesta = new Date(a, m - 1, g);
                                                } else {
                                                    const [a, m, g] = dataString.split('-').map(Number);
                                                    dataRichiesta = new Date(a, m - 1, g);
                                                }
                                                const oggi2 = new Date();
                                                oggi2.setHours(0, 0, 0, 0);
                                                dataRichiesta.setHours(0, 0, 0, 0);
                                                if (oggi2 > dataRichiesta) return false;
                                                if (tipoLower === 'smartworking') return true;
                                                return assenza.stato === 'pending';
                                            } catch { return false; }
                                        })();

                                        return { tipoLower, isPermesso, TipoIcon, canCancel };
                                    };

                                    return (
                                        <>
                                            {/* Tab switcher */}
                                            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 p-1.5 bg-zinc-100/80 rounded-2xl w-full sm:w-fit">
                                                <button
                                                    onClick={() => { setTabRichieste('future'); setPaginaCorrente(1); }}
                                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all ${
                                                        tabRichieste === 'future'
                                                            ? 'bg-white shadow-lg text-emerald-600 border-2 border-emerald-200'
                                                            : 'text-zinc-500 hover:text-zinc-700'
                                                    }`}
                                                >
                                                    <span><CalendarDays /></span>
                                                    <span>Attive</span>
                                                    {future.length > 0 && (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                                            tabRichieste === 'future' ? 'bg-emerald-500 text-white' : 'bg-zinc-300 text-zinc-600'
                                                        }`}>
                                {future.length}
                            </span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => { setTabRichieste('passate'); setPaginaCorrente(1); }}
                                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all ${
                                                        tabRichieste === 'passate'
                                                            ? 'bg-white shadow-lg text-zinc-700 border-2 border-zinc-200'
                                                            : 'text-zinc-500 hover:text-zinc-700'
                                                    }`}
                                                >
                                                    <span><FolderArchive /></span>
                                                    <span>Passate</span>
                                                    {passate.length > 0 && (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                                            tabRichieste === 'passate' ? 'bg-zinc-600 text-white' : 'bg-zinc-300 text-zinc-600'
                                                        }`}>
                                {passate.length}
                            </span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Layout Cards per mobile */}
                                            <div className="block lg:hidden space-y-4">
                                                {assenzePagina.length === 0 ? (
                                                    <div className="py-16 text-center">
                                                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-zinc-100/70 to-slate-100/50 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-dashed border-zinc-200/50 backdrop-blur-xl">
                                                            <AlertCircle className="w-12 h-12 text-zinc-300" />
                                                        </div>
                                                        <h3 className="text-2xl font-black bg-gradient-to-r from-zinc-700 to-slate-600 bg-clip-text text-transparent mb-2">
                                                            {tabRichieste === 'future' ? 'Nessuna richiesta futura' : 'Nessuna richiesta passata'}
                                                        </h3>
                                                        <p className="text-base text-zinc-400 font-light px-4">
                                                            {contaFiltriAttivi() > 0 ? 'Prova a modificare i filtri' : tabRichieste === 'future' ? 'Le prossime richieste appariranno qui' : 'Lo storico apparirà qui'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    assenzePagina.map((assenza, index) => {
                                                        const { tipoLower, isPermesso, TipoIcon, canCancel } = renderRiga(assenza, index);
                                                        return (
                                                            <div
                                                                key={assenza.id || assenza._id || index}
                                                                className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-zinc-200/50 hover:shadow-xl transition-all space-y-4"
                                                            >
                                                                <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-100">
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                                                                        <span className="text-base font-bold text-zinc-800 truncate">
                                                {formattaData(assenza.dataInizio || assenza.data || 'N/D')}
                                            </span>
                                                                    </div>
                                                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-lg inline-flex items-center gap-1.5 shrink-0 ${
                                                                        assenza.stato === 'approved' ? 'bg-gradient-to-r from-emerald-400/90 to-green-500/90 text-white'
                                                                            : assenza.stato === 'pending' ? 'bg-gradient-to-r from-amber-400/90 to-yellow-500/90 text-white'
                                                                                : 'bg-gradient-to-r from-rose-400/90 to-red-500/90 text-white'
                                                                    }`}>
                                            {assenza.stato === 'pending' ? <><Clock className="w-3 h-3" />In attesa</>
                                                : assenza.stato === 'approved' ? <><CheckCircle className="w-3 h-3" />Approvata</>
                                                    : <><XCircle className="w-3 h-3" />Rifiutata</>}
                                        </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Tipo</span>
                                                                        <span className={`px-4 py-2 rounded-xl text-sm font-black shadow-lg inline-flex items-center gap-2 bg-gradient-to-r ${getTipoColor(assenza.tipo)} text-white`}>
                                                <TipoIcon className="w-4 h-4" />
                                                                            {getTipoLabel(assenza.tipo)}
                                            </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Durata</span>
                                                                        <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                                    {assenza.durata || 0}
                                                </span>
                                                                            <span className={`text-base font-black uppercase ${isPermesso ? 'text-yellow-600' : 'text-blue-600'}`}>
                                                    {isPermesso ? 'ore' : 'gg'}
                                                </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {assenza.motivo && (
                                                                    <div>
                                                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Motivo</span>
                                                                        <p className="text-sm text-zinc-700 line-clamp-2">{assenza.motivo}</p>
                                                                    </div>
                                                                )}
                                                                {canCancel && (
                                                                    <button
                                                                        onClick={() => handleCancelClick(assenza)}
                                                                        className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Annulla Richiesta
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Layout Tabella per desktop */}
                                            <div className="hidden lg:block overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                    <tr className="bg-gradient-to-r from-white/80 to-zinc-50/80 backdrop-blur-xl">
                                                        <th className="text-left py-6 px-6 font-black text-zinc-800 text-lg tracking-tight border-b-2 border-white/50">Data</th>
                                                        <th className="text-left py-6 px-6 font-black text-zinc-800 text-lg tracking-tight border-b-2 border-white/50">Tipo</th>
                                                        <th className="text-left py-6 px-6 font-black text-zinc-800 text-lg tracking-tight border-b-2 border-white/50">Durata</th>
                                                        <th className="text-left py-6 px-6 font-black text-zinc-800 text-lg tracking-tight border-b-2 border-white/50">Stato</th>
                                                        <th className="text-left py-6 px-6 font-black text-zinc-800 text-lg tracking-tight border-b-2 border-white/50">Motivo</th>
                                                        <th className="text-left py-6 px-6 font-black text-zinc-800 text-lg tracking-tight border-b-2 border-white/50">Azioni</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100/50">
                                                    {assenzePagina.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="py-32 text-center">
                                                                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-zinc-100/70 to-slate-100/50 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-dashed border-zinc-200/50 backdrop-blur-xl">
                                                                    <AlertCircle className="w-16 h-16 text-zinc-300" />
                                                                </div>
                                                                <h3 className="text-3xl font-black bg-gradient-to-r from-zinc-700 to-slate-600 bg-clip-text text-transparent mb-3">
                                                                    {tabRichieste === 'future' ? 'Nessuna richiesta futura' : 'Nessuna richiesta passata'}
                                                                </h3>
                                                                <p className="text-xl text-zinc-400 font-light">
                                                                    {contaFiltriAttivi() > 0
                                                                        ? 'Prova a modificare i filtri per vedere più risultati'
                                                                        : tabRichieste === 'future' ? 'Le prossime richieste appariranno qui' : 'Lo storico apparirà qui'}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        assenzePagina.map((assenza, index) => {
                                                            const { tipoLower, isPermesso, TipoIcon, canCancel } = renderRiga(assenza, index);
                                                            return (
                                                                <tr
                                                                    key={assenza.id || assenza._id || index}
                                                                    className="hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 backdrop-blur-xl transition-all duration-300 group"
                                                                >
                                                                    <td className="py-6 px-6 text-base font-semibold text-zinc-800">
                                                                        <div className="flex items-center gap-3">
                                                                            <Calendar className="w-5 h-5 text-zinc-500" />
                                                                            {formattaData(assenza.dataInizio || assenza.data || 'N/D')}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-6 px-6">
                                                <span className={`px-4 py-2 rounded-xl text-sm font-black shadow-lg inline-flex items-center gap-2 bg-gradient-to-r ${getTipoColor(assenza.tipo)} text-white`}>
                                                    <TipoIcon className="w-4 h-4" />
                                                    {getTipoLabel(assenza.tipo)}
                                                </span>
                                                                    </td>
                                                                    <td className="py-6 px-6">
                                                                        <div className="flex items-baseline gap-2">
                                                                            <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                                                                {assenza.durata || 0}
                                                                            </div>
                                                                            <div className={`text-lg font-black uppercase ${isPermesso ? 'text-yellow-600' : 'text-blue-600'}`}>
                                                                                {isPermesso ? 'ore' : 'gg'}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-6 px-6">
                                                <span className={`px-4 py-2 rounded-xl text-sm font-black shadow-xl inline-flex items-center gap-2 ${
                                                    assenza.stato === 'approved' ? 'bg-gradient-to-r from-emerald-400/90 to-green-500/90 text-white'
                                                        : assenza.stato === 'pending' ? 'bg-gradient-to-r from-amber-400/90 to-yellow-500/90 text-white'
                                                            : 'bg-gradient-to-r from-rose-400/90 to-red-500/90 text-white'
                                                }`}>
                                                    {assenza.stato === 'pending' ? <><Clock className="w-4 h-4" />In attesa</>
                                                        : assenza.stato === 'approved' ? <><CheckCircle className="w-4 h-4" />Approvata</>
                                                            : <><XCircle className="w-4 h-4" />Rifiutata</>}
                                                </span>
                                                                    </td>
                                                                    <td className="py-6 px-6 text-base text-zinc-700 max-w-xs truncate">
                                                                        {assenza.motivo || '-'}
                                                                    </td>
                                                                    <td className="py-6 px-6">
                                                                        {canCancel ? (
                                                                            <button
                                                                                onClick={() => handleCancelClick(assenza)}
                                                                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                                Annulla
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-zinc-400 text-sm font-medium">-</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Paginazione */}
                                            {totalePagine > 1 && (
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t-2 border-zinc-100">
                                                    <p className="text-sm font-semibold text-zinc-500">
                                                        Pagina <span className="text-zinc-800 font-black">{paginaCorrente}</span> di{' '}
                                                        <span className="text-zinc-800 font-black">{totalePagine}</span>
                                                        <span className="ml-2 text-zinc-400">
                                ({(paginaCorrente - 1) * itemsPerPage + 1}–{Math.min(paginaCorrente * itemsPerPage, listaAttiva.length)} di {listaAttiva.length})
                            </span>
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setPaginaCorrente(1)}
                                                            disabled={paginaCorrente === 1}
                                                            className="p-2 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-sm active:scale-95"
                                                        >«</button>
                                                        <button
                                                            onClick={() => setPaginaCorrente(p => Math.max(1, p - 1))}
                                                            disabled={paginaCorrente === 1}
                                                            className="px-4 py-2 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm active:scale-95 flex items-center gap-1"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" /> Prec
                                                        </button>
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: totalePagine }, (_, i) => i + 1)
                                                                .filter(n => n === 1 || n === totalePagine || Math.abs(n - paginaCorrente) <= 1)
                                                                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                                                                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                                                                    acc.push(n);
                                                                    return acc;
                                                                }, [])
                                                                .map((item, i) =>
                                                                    item === '...' ? (
                                                                        <span key={`ellipsis-${i}`} className="px-2 text-zinc-400 font-bold">…</span>
                                                                    ) : (
                                                                        <button
                                                                            key={item}
                                                                            onClick={() => setPaginaCorrente(item as number)}
                                                                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all active:scale-95 ${
                                                                                paginaCorrente === item
                                                                                    ? 'bg-emerald-500 text-white shadow-lg border-2 border-emerald-400'
                                                                                    : 'border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                                                            }`}
                                                                        >{item}</button>
                                                                    )
                                                                )}
                                                        </div>
                                                        <button
                                                            onClick={() => setPaginaCorrente(p => Math.min(totalePagine, p + 1))}
                                                            disabled={paginaCorrente === totalePagine}
                                                            className="px-4 py-2 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm active:scale-95 flex items-center gap-1"
                                                        >
                                                            Succ <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setPaginaCorrente(totalePagine)}
                                                            disabled={paginaCorrente === totalePagine}
                                                            className="p-2 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-sm active:scale-95"
                                                        >»</button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                        </>
                    );
                })()}



                {/* Tab Content - Nuova Richiesta */}
                {activeTab === 'nuova' && (
                    <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-10 border border-white/70">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent mb-6 sm:mb-8 md:mb-10 flex items-center gap-3 sm:gap-4">
                            <Send className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-zinc-700" />
                            Nuova Richiesta
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 md:space-y-10">

                            {/* Tipo assenza */}
                            <div>
                                <label className="block text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-800 mb-3 sm:mb-4 md:mb-5 flex items-center gap-2">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Tipo assenza
                                </label>
                                <select
                                    value={form.tipo}
                                    onChange={(e) => {
                                        const nuovoTipo = e.target.value;
                                        // Reset date se si passa a/da permesso
                                        setForm({ ...form, tipo: nuovoTipo, durata: '', dataInizio: '', dataFine: '' });
                                    }}
                                    className="w-full h-14 sm:h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all appearance-none"
                                    required
                                >
                                    <option value="">Seleziona tipo...</option>
                                    <option value="ferie">🌴 Ferie</option>
                                    <option value="malattia">🤒 Malattia</option>
                                    <option value="permesso">⏰ Permesso</option>
                                    <option value="smartworking">🏠 Smartworking</option>
                                    <option value="fuori-sede">✈️ Fuori Sede</option>
                                    <option value="congedo-parentale">👶 Congedo Parentale</option>
                                </select>
                            </div>

                            {/* Date: Dal - Al (tutti tranne permesso) */}
                            {form.tipo !== 'permesso' && form.tipo !== '' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    <div>
                                        <label className="block text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-800 mb-3 sm:mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Dal
                                        </label>
                                        <input
                                            type="date"
                                            value={form.dataInizio}
                                            onChange={(e) => {
                                                const nuovaInizio = e.target.value;
                                                // Se dataFine è precedente alla nuova dataInizio, reset
                                                const nuovaFine = form.dataFine && form.dataFine < nuovaInizio ? '' : form.dataFine;
                                                const giorni = nuovaInizio && nuovaFine
                                                    ? Math.round((new Date(nuovaFine).getTime() - new Date(nuovaInizio).getTime()) / (1000 * 60 * 60 * 24)) + 1
                                                    : '';
                                                setForm({ ...form, dataInizio: nuovaInizio, dataFine: nuovaFine, durata: String(giorni) });
                                            }}
                                            min={new Date().toISOString().split('T')[0]}
                                            max={form.tipo === 'smartworking' ? (() => {
                                                const max = new Date();
                                                max.setDate(max.getDate() + 30);
                                                return max.toISOString().split('T')[0];
                                            })() : undefined}
                                            className="w-full h-14 sm:h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-800 mb-3 sm:mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Al
                                        </label>
                                        <input
                                            type="date"
                                            value={form.dataFine}
                                            onChange={(e) => {
                                                const nuovaFine = e.target.value;
                                                const giorni = form.dataInizio && nuovaFine
                                                    ? Math.round((new Date(nuovaFine).getTime() - new Date(form.dataInizio).getTime()) / (1000 * 60 * 60 * 24)) + 1
                                                    : '';
                                                setForm({ ...form, dataFine: nuovaFine, durata: String(giorni) });
                                            }}
                                            min={form.dataInizio || new Date().toISOString().split('T')[0]}
                                            max={form.tipo === 'smartworking' ? (() => {
                                                const max = new Date();
                                                max.setDate(max.getDate() + 30);
                                                return max.toISOString().split('T')[0];
                                            })() : undefined}
                                            disabled={!form.dataInizio}
                                            className="w-full h-14 sm:h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Durata calcolata automaticamente (solo lettura, tutti tranne permesso) */}
                            {form.tipo !== 'permesso' && form.tipo !== '' && form.durata && (
                                <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl sm:rounded-2xl flex items-center gap-3 shadow-md">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span className="text-base sm:text-lg font-black text-emerald-800">
                        Durata : <span className="text-2xl">{form.durata}</span> {Number(form.durata) === 1 ? 'giorno' : 'giorni'}
                    </span>
                                </div>
                            )}

                            {/* Permesso: data singola + ore manuali */}
                            {form.tipo === 'permesso' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    <div>
                                        <label className="block text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-800 mb-3 sm:mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Data
                                        </label>
                                        <input
                                            type="date"
                                            value={form.dataInizio}
                                            onChange={(e) => setForm({ ...form, dataInizio: e.target.value, dataFine: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full h-14 sm:h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-semibold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-800 mb-3 sm:mb-4 flex items-center gap-2">
                                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Ore
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="7"
                                            value={form.durata}
                                            onChange={(e) => setForm({ ...form, durata: e.target.value })}
                                            className="w-full h-14 sm:h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-xl sm:rounded-2xl text-3xl font-black text-center focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all"
                                            placeholder="1"
                                            required
                                        />
                                        <p className="text-xs sm:text-sm text-zinc-500 mt-2 font-mono tracking-wider flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Max: 7 ore per giorno
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Motivo */}
                            <div>
                                <label className="block text-base sm:text-lg md:text-xl font-black tracking-tight text-zinc-800 mb-3 sm:mb-4 md:mb-5 flex items-center gap-2">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Motivo (opzionale)
                                </label>
                                <textarea
                                    value={form.motivo}
                                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                                    rows={4}
                                    className="w-full p-4 sm:p-5 md:p-6 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-medium text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl hover:border-zinc-300 transition-all resize-vertical placeholder-zinc-400"
                                    placeholder="Es. Influenza, visita specialistica, vacanza estiva..."
                                    maxLength={500}
                                />
                                <p className="text-xs sm:text-sm text-zinc-500 mt-2 sm:mt-3 text-right font-mono tracking-wider">
                                    {form.motivo.length}/500 caratteri
                                </p>
                            </div>

                            {/* Bottoni */}
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                                <button
                                    type="submit"
                                    disabled={!form.tipo || !form.dataInizio || !form.durata || Number(form.durata) <= 0}
                                    className="flex-1 min-h-[64px] sm:min-h-[80px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-zinc-300 disabled:to-zinc-400 disabled:cursor-not-allowed text-white font-black text-lg sm:text-xl md:text-2xl rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 disabled:translate-y-0 transition-all duration-500 flex items-center justify-center gap-3 sm:gap-4 backdrop-blur-xl border border-emerald-400/50 group active:scale-95"
                                >
                                    <Send className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" />
                                    Invia Richiesta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ tipo: '', dataInizio: '', dataFine: '', durata: '', motivo: '' })}
                                    className="flex-1 min-h-[64px] sm:min-h-[80px] bg-gradient-to-r from-zinc-200 to-zinc-300 hover:from-zinc-300 hover:to-zinc-400 text-zinc-800 font-black text-base sm:text-lg md:text-xl rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 backdrop-blur-xl border border-zinc-300/50 group active:scale-95"
                                >
                                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
}
