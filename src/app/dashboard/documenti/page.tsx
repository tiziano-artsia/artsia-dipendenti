'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import {
    Download,
    Loader2,
    Folder,
    FolderOpen,
    Search,
    ChevronDown,
    ChevronUp,
    UploadCloud,
    File
} from 'lucide-react';
import { useEmployees } from "@/hooks/useEmployees";

export default function BustePaga() {
    const { user } = useAuth();
    const { employees, loading: loadingEmployees, error } = useEmployees();
    const isAdmin = user?.role === 'admin';

    // State per i dati
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);

    // State per l'upload
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        employeeId: '',
        anno: new Date().getFullYear().toString(),
        documentName: '',
        file: null as File | null
    });

    // State per i filtri e UI
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Funzione per ricaricare i dati
    const refreshDocuments = async () => {
        const token = localStorage.getItem('token');
        if (!token) return [];

        try {
            const res = await fetch('/api/payslips', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data.data) ? data.data : [];
                // Filtra solo documenti (escludi buste paga)
                const onlyDocuments = list.filter((item: any) => item.type === 'document');
                setDocuments(onlyDocuments);
                return onlyDocuments;
            } else {
                console.error('Errore nel caricamento:', res.status);
                return [];
            }
        } catch (err) {
            console.error("Errore refresh:", err);
            return [];
        }
    };

    // Caricamento Iniziale
    useEffect(() => {
        const init = async () => {
            setLoadingDocuments(true);
            const list = await refreshDocuments();

            // Seleziona automaticamente l'anno più recente
            if (list.length > 0 && !selectedYear) {
                const years = [...new Set(list.map((p: any) => p.anno?.toString()))].filter(Boolean).sort().reverse();
                if (years.length > 0) {
                    setSelectedYear(years[0]);
                }
            }

            setLoadingDocuments(false);
        };

        init();
    }, []);

    // Gestione Upload
    const handleUpload = async () => {
        const { employeeId, documentName, anno, file } = uploadForm;

        if (!employeeId || !documentName || !anno || !file) {
            alert('Completa tutti i campi obbligatori: dipendente, nome documento, anno e file');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Token non trovato. Effettua nuovamente il login.');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            setLoadingUpload(true);
            try {
                // Recupera il nome del dipendente
                const employeeName = employees.find(e => e.id === parseInt(employeeId))?.name || '';

                const payload = {
                    type: 'document',
                    employeeId: employeeId,
                    employeeName: employeeName,
                    anno: anno,
                    documentName: documentName,
                    file: reader.result
                };

                const res = await fetch('/api/payslips', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const result = await res.json();

                    // Reset form
                    setUploadForm({
                        employeeId: uploadForm.employeeId, // Mantieni dipendente selezionato
                        anno: new Date().getFullYear().toString(),
                        documentName: '',
                        file: null
                    });

                    alert(result.message || '✅ Documento caricato con successo!');

                    // Ricarica i dati
                    await refreshDocuments();

                    // Imposta la vista sull'anno caricato
                    setSelectedYear(anno);

                } else {
                    const errData = await res.json();
                    alert(`❌ Errore: ${errData.error || 'Errore durante il caricamento'}`);
                }
            } catch (e) {
                console.error(e);
                alert('❌ Errore di rete. Riprova.');
            } finally {
                setLoadingUpload(false);
            }
        };

        reader.onerror = () => {
            alert('Errore nella lettura del file');
            setLoadingUpload(false);
        };
    };

    // Logica di Raggruppamento e Filtro
    const groupedData = useMemo(() => {
        let filtered = [...documents];

        // Filtra per ricerca
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((p: any) =>
                p.employeeName?.toLowerCase().includes(term) ||
                p.documentName?.toLowerCase().includes(term)
            );
        }

        // Raggruppa per Anno
        const byYear: Record<string, any[]> = {};
        filtered.forEach((p: any) => {
            const year = p.anno?.toString() || 'Sconosciuto';
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push(p);
        });

        return byYear;
    }, [documents, searchTerm]);

    const years = Object.keys(groupedData).sort().reverse();

    // Loading states
    if (loadingEmployees) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8"/>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Errore: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-800 tracking-tight">Archivio Documenti</h1>
                        <p className="text-zinc-500 mt-1">Gestisci documenti aziendali</p>
                    </div>

                    {/* Barra Ricerca */}
                    <div className="flex gap-3 bg-white p-2 rounded-xl shadow-sm border border-zinc-200 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Cerca documento o dipendente..."
                                className="pl-9 pr-4 py-2 text-sm bg-transparent outline-none w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Sezione Upload (Solo Admin) */}
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
                                    <h3 className="font-bold text-indigo-900">Carica Nuovo Documento</h3>
                                    <p className="text-xs text-indigo-600/80">Area riservata amministratori</p>
                                </div>
                            </div>
                            {isUploadOpen ? <ChevronUp className="text-indigo-400" /> : <ChevronDown className="text-indigo-400" />}
                        </button>

                        {isUploadOpen && (
                            <div className="p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                {/* Form Upload Documento */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <select
                                        className="p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={uploadForm.employeeId}
                                        onChange={(e) => setUploadForm({...uploadForm, employeeId: e.target.value})}
                                    >
                                        <option value="">Seleziona Dipendente *</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="Nome Documento *"
                                        className="p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={uploadForm.documentName}
                                        onChange={(e) => setUploadForm({...uploadForm, documentName: e.target.value})}
                                    />

                                    <select
                                        className="p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={uploadForm.anno}
                                        onChange={(e) => setUploadForm({...uploadForm, anno: e.target.value})}
                                    >
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                                        />
                                        <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all ${
                                            uploadForm.file
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-indigo-300'
                                        }`}>
                                            <File className="w-4 h-4 shrink-0" />
                                            <span className="text-sm truncate">{uploadForm.file ? uploadForm.file.name : 'Scegli PDF *'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={loadingUpload}
                                    className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {loadingUpload ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span>Caricamento in corso...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-5 h-5" />
                                            <span>Carica Documento</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content: Cartelle Anni */}
                {loadingDocuments ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className="text-sm">Caricamento documenti in corso...</p>
                    </div>
                ) : years.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-300">
                        <FolderOpen className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-600 mb-2">
                            Nessun documento trovato
                        </h3>
                        <p className="text-sm text-zinc-400">
                            Non ci sono ancora documenti nel tuo archivio.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Anni */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">
                                Anni Disponibili
                            </h3>
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
                                        <div className={`p-2 rounded-lg transition-all ${
                                            selectedYear === year
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : 'bg-zinc-100 text-zinc-400 group-hover:text-indigo-500'
                                        }`}>
                                            {selectedYear === year ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                                        </div>
                                        <span className="font-bold text-lg">{year}</span>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all ${
                                        selectedYear === year
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'bg-zinc-100 text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                    }`}>
                                        {groupedData[year]?.length || 0}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Contenuto: Lista Documenti */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-2">
                                    <span className="text-indigo-600">Documenti</span>
                                    <span>{selectedYear}</span>
                                </h2>
                                <span className="text-sm text-zinc-500">
                                    {groupedData[selectedYear!]?.length || 0} documenti
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedData[selectedYear!]?.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="group bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                            <File className="w-24 h-24 text-emerald-500 -mr-8 -mt-8 rotate-12" />
                                        </div>

                                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100 shadow-sm transition-all">
                                                        <File className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-zinc-800">
                                                            {item.documentName}
                                                        </h4>
                                                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                            Disponibile
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 pl-1">
                                                <div>
                                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Dipendente</p>
                                                    <p className="text-sm font-medium text-zinc-700">
                                                        {item.employeeName || 'N/D'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Anno</p>
                                                    <p className="text-sm font-medium text-zinc-700">{item.anno}</p>
                                                </div>
                                            </div>

                                            <a
                                                href={`/api/payslips/${item.id}/download`}
                                                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-100"
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
