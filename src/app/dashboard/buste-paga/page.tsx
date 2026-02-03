'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    Download,
    Loader2,
    Folder,
    FolderOpen,
    Search,
    ChevronDown,
    ChevronUp,
    UploadCloud
} from 'lucide-react';
import { useEmployees } from "@/hooks/useEmployees";

export default function BustePaga() {
    const { user } = useAuth();
    const { employees, loading: loadingEmployees, error } = useEmployees();
    const isAdmin = user?.role === 'admin';

    // State per i dati
    const [payslips, setPayslips] = useState([]);
    const [loadingPayslips, setLoadingPayslips] = useState(false);

    // State per l'upload
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        employeeId: '',
        mese: '',
        anno: '2026',
        netto: '',
        file: null as File | null
    });

    // State per i filtri e UI
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    // Funzione per ricaricare le buste paga (estratta per riutilizzo)
    const refreshPayslips = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/api/payslips', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data.data) ? data.data : [];
                setPayslips(list);
                return list;
            }
        } catch (err) {
            console.error("Errore refresh:", err);
        }
        return [];
    };

    // Caricamento Iniziale
    useEffect(() => {
        const init = async () => {
            setLoadingPayslips(true);
            const list = await refreshPayslips();
            if (list.length > 0 && !selectedYear) {
                // Seleziona l'anno più recente all'avvio
                const years = [...new Set(list.map((p: any) => p.anno))].sort().reverse();
                setSelectedYear(years[0] as string);
            }
            setLoadingPayslips(false);
        };
        init();
    }, []);

    // Gestione Upload
    const handleUpload = async () => {
        const { employeeId, mese, anno, netto, file } = uploadForm;

        if (!employeeId || !mese || !anno || !file || !netto) {
            alert('Completa tutti i campi');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const employeeName = employees.find(e => e.id === parseInt(employeeId))?.name || '';
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = async () => {
            setLoadingUpload(true);
            try {
                const res = await fetch('/api/payslips', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        employeeId,
                        employeeName,
                        mese,
                        anno,
                        netto,
                        file: reader.result
                    })
                });

                if (res.ok) {
                    // 1. Reset parziale del form (manteniamo dipendente e anno per comodità)
                    setUploadForm(prev => ({ ...prev, netto: '', file: null, mese: '' }));

                    alert('Caricamento riuscito!');

                    // 2. Ricarica immediata dei dati
                    await refreshPayslips();

                    // 3. CRUCIALE: Sposta la vista sull'anno dove abbiamo appena caricato il file
                    // Così l'utente vede subito il nuovo file apparire
                    setSelectedYear(anno);

                } else {
                    const errData = await res.json();
                    alert(`Errore: ${errData.error || 'Errore durante il caricamento'}`);
                }
            } catch (e) {
                console.error(e);
                alert('Errore di rete');
            } finally {
                setLoadingUpload(false);
            }
        };
    };

    // Logica di Raggruppamento e Filtro
    const groupedData = useMemo(() => {
        let filtered = payslips;

        // 1. Filtra per ricerca (nome o mese)
        if (searchTerm) {
            filtered = filtered.filter((p: any) =>
                p.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.mese?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Filtra per mese specifico
        if (filterMonth) {
            filtered = filtered.filter((p: any) => p.mese === filterMonth);
        }

        // 3. Raggruppa per Anno
        const byYear: Record<string, any[]> = {};
        filtered.forEach((p: any) => {
            if (!byYear[p.anno]) byYear[p.anno] = [];
            byYear[p.anno].push(p);
        });

        // Ordina le buste paga all'interno dell'anno (opzionale, per mese o data creazione)
        // Qui assumiamo che arrivino già ordinate dal DB o le lasciamo così

        return byYear;
    }, [payslips, searchTerm, filterMonth]);

    const years = Object.keys(groupedData).sort().reverse();

    if (loadingEmployees) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-8 h-8"/></div>;
    if (error) return <div className="p-8 text-center text-red-500">Errore: {error}</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-800 tracking-tight">Archivio</h1>
                        <p className="text-zinc-500 mt-1">Gestisci e visualizza le tue buste paga</p>
                    </div>

                    {/* Filtri Rapidi */}
                    <div className="flex gap-3 bg-white p-2 rounded-xl shadow-sm border border-zinc-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Cerca..."
                                className="pl-9 pr-4 py-2 text-sm bg-transparent outline-none w-40 md:w-60"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-px bg-zinc-200" />
                        <select
                            className="bg-transparent text-sm outline-none px-2 cursor-pointer text-zinc-600"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">Tutti i mesi</option>
                            {['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'].map(m => (
                                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sezione Upload (Solo Admin) - Collapsible */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden transition-all">
                        <button
                            onClick={() => setIsUploadOpen(!isUploadOpen)}
                            className="w-full flex items-center justify-between p-6 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-indigo-900">Carica Documento</h3>
                                    <p className="text-xs text-indigo-600/80">Area riservata amministratori</p>
                                </div>
                            </div>
                            {isUploadOpen ? <ChevronUp className="text-indigo-400" /> : <ChevronDown className="text-indigo-400" />}
                        </button>

                        {isUploadOpen && (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-4 duration-300">
                                <select
                                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={uploadForm.employeeId}
                                    onChange={(e) => setUploadForm({...uploadForm, employeeId: e.target.value})}
                                >
                                    <option value="">Dipendente...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>

                                <select
                                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={uploadForm.mese}
                                    onChange={(e) => setUploadForm({...uploadForm, mese: e.target.value})}
                                >
                                    <option value="">Mese...</option>
                                    {['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'].map(m => (
                                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                    ))}
                                </select>

                                <select
                                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={uploadForm.anno}
                                    onChange={(e) => setUploadForm({...uploadForm, anno: e.target.value})}
                                >
                                    {Array.from({ length: 2 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    placeholder="Importo Netto (€)"
                                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={uploadForm.netto}
                                    onChange={(e) => setUploadForm({...uploadForm, netto: e.target.value})}
                                />

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                                    />
                                    <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed ${uploadForm.file ? 'border-green-500 bg-green-50 text-green-700' : 'border-zinc-300 bg-zinc-50 text-zinc-500'}`}>
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm truncate">{uploadForm.file ? uploadForm.file.name : 'Scegli PDF'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={loadingUpload}
                                    className="lg:col-span-5 mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {loadingUpload ? <Loader2 className="animate-spin w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                                    Carica Documento
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content: Cartelle Anni */}
                {loadingPayslips ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p>Recupero documenti in corso...</p>
                    </div>
                ) : years.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-300">
                        <FolderOpen className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-600">Nessun documento trovato</h3>
                        <p className="text-sm text-zinc-400">Non ci sono ancora buste paga nel tuo archivio.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Anni */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">Anni Fiscali</h3>
                            {years.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                                        selectedYear === year
                                            ? 'bg-white shadow-lg border-l-4 border-indigo-500 text-indigo-900 ring-1 ring-black/5'
                                            : 'bg-white/50 hover:bg-white text-zinc-600 border-l-4 border-transparent hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${selectedYear === year ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-400 group-hover:text-indigo-500'}`}>
                                            {selectedYear === year ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                                        </div>
                                        <span className="font-bold text-lg">{year}</span>
                                    </div>
                                    <span className="text-xs font-medium bg-zinc-100 px-2 py-1 rounded-full text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        {groupedData[year]?.length || 0}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Contenuto: Lista Buste Paga */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-2">
                                    <span className="text-indigo-600">Documenti</span>
                                    <span>{selectedYear}</span>
                                </h2>
                                <span className="text-sm text-zinc-500">{groupedData[selectedYear!]?.length} documenti trovati</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedData[selectedYear!]?.map((payslip: any) => (
                                    <div
                                        key={payslip.id}
                                        className="group bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                                            <FileText className="w-24 h-24 text-indigo-500 -mr-8 -mt-8 rotate-12" />
                                        </div>

                                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm border border-indigo-100">
                                                        {payslip.mese?.slice(0,3).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-zinc-800 capitalize">{payslip.mese} {payslip.anno}</h4>
                                                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            Disponibile
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1 pl-1">
                                                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Dipendente</p>
                                                <p className="text-sm font-medium text-zinc-700">{payslip.employeeName || user?.name || 'N/D'}</p>
                                            </div>

                                            <a
                                                href={`/api/payslips/${payslip.id}/download`}
                                                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-indigo-600 transition-colors shadow-lg hover:shadow-indigo-500/30"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>Scarica PDF</span>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
