'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    Download,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Users,
    X,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Plane, Stethoscope, Home
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import {string} from "zod";

interface AbsenceBackend {
    _id: string;
    id: number;
    employeeId: number;
    date: string;
    duration: number;
    type: string;
    status: string;
    reason?: string;
}

interface Absence {
    id: number;
    employeeId: number;
    dataInizio: string;
    durata: number;
    tipo: 'ferie' | 'permesso' | 'smartworking' | 'malattia';
    stato: 'pending' | 'approved' | 'rejected';
    motivo?: string;
}

interface Employee {
    id: number;
    name: string;
    team: string;
}

const nomiMesi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export default function Calendario() {
    const { user, token } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';
    const userTeam = user?.team;


    const [dipendenteSelezionato, setDipendenteSelezionato] = useState<Employee | null>(null);
    const [visualizzaTutti, setVisualizzaTutti] = useState(true);
    const [mese, setMese] = useState(new Date().getMonth());
    const [anno, setAnno] = useState(new Date().getFullYear());
    const [assenze, setAssenze] = useState<Absence[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const [popupNuovaRichiesta, setPopupNuovaRichiesta] = useState(false);
    const [tipoRichiesta, setTipoRichiesta] = useState();
    const [durata, setDurata] = useState();
    const [motivo, setMotivo] = useState('');




    const [modalAperto, setModalAperto] = useState(false);
    const [giornoSelezionato, setGiornoSelezionato] = useState<string>('');
    const [assenzeModale, setAssenzeModale] = useState<Absence[]>([]);

    const mapBackendToFrontend = (backendData: any[]): Absence[] => {
        return backendData.map(item => ({
            id: item.id,
            employeeId: item.employeeId,
            dataInizio: item.date || item.dataInizio,
            durata: item.duration || item.durata,
            tipo: (item.type || item.tipo) as 'ferie' | 'permesso' | 'smartworking' | 'malattia',
            stato: (item.status || item.stato) as 'pending' | 'approved' | 'rejected',
            motivo: item.reason || item.motivo
        }));
    };

    // CARICA EMPLOYEES SEMPRE (anche per non-admin per visualizzare i nomi)
    const fetchEmployees = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                let emps = data.data || [];

                console.log('👥 Employees caricati:', emps.length, emps);

                if (user && !emps.find((e: Employee) => Number(e.id) === Number(user.id))) {
                    emps.push({
                        id: user.id,
                        name: user.name,
                        team: user.team || 'N/D'
                    });
                    console.log('➕ Aggiunto user corrente agli employees:', user);
                }

                setEmployees(emps);

                // Solo admin può selezionare dipendenti
                if (isAdmin && emps.length > 0 && !visualizzaTutti && !dipendenteSelezionato) {
                    setDipendenteSelezionato(emps[0]);
                }
            }
        } catch (error) {
            console.error('❌ Employees fetch:', error);
        }
    };
    const apriPopupNuova = (dataStr) => {
        setGiornoSelezionato(dataStr);
        setTipoRichiesta('ferie');
        setDurata(1);
        setMotivo('');
        setPopupNuovaRichiesta(true);
    };

    const inviaRichiesta = async () => {
        if (!token || !user || !tipoRichiesta || !durata) return;

        try {
            const payload = {
                employeeId: user.id,
                dataInizio: formattaDataItaliana(giornoSelezionato),
                durata: durata,
                type: tipoRichiesta,
                motivo: motivo || "",
                status: "pending",
                requestedBy: user.name || user.email,
                approvedBy: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('🚀 INVIO:', JSON.stringify(payload, null, 2));

            const res = await fetch('/api/absences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setPopupNuovaRichiesta(false);
                setTipoRichiesta('');
                setDurata('');
                setMotivo('');
                fetchAssenze();  // Ricarica calendario
            } else {
                const error = await res.json();
                console.error('❌ Backend:', error);
            }
        } catch (error) {
            console.error('❌ Fetch error:', error);
        }
    };




    const fetchAssenze = async (specificEmployeeId?: number) => {
        if (!token || !user) return;
        setLoading(true);

        try {
            let url = '/api/absences';

            // COSTRUISCI URL CORRETTA
            if (isAdmin) {
                // Admin: se specificEmployeeId è fornito, filtra per quello
                if (specificEmployeeId) {
                    url = `/api/absences?employeeId=${specificEmployeeId}`;
                }
                // Altrimenti: fetch tutti (nessun parametro)
            } else {
                // Non-admin: SEMPRE filtra per user.id
                url = `/api/absences?employeeId=${user.id}`;
            }

            console.log('🔄 Frontend Fetch:', {
                url,
                isAdmin,
                userRole: user.role,
                userId: user.id,
                specificEmployeeId
            });

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Errore API');
            }

            const backendData = data.data || [];

            console.log('📦 Dati ricevuti:', {
                count: backendData.length,
                sample: backendData.slice(0, 2)
            });

            const mapped = mapBackendToFrontend(backendData);

            console.log('✅ Assenze mappate:', {
                total: mapped.length,
                approved: mapped.filter(a => a.stato === 'approved').length,
                pending: mapped.filter(a => a.stato === 'pending').length,
                rejected: mapped.filter(a => a.stato === 'rejected').length
            });

            setAssenze(mapped);

        } catch (error) {
            console.error('❌ Fetch assenze error:', error);
            setAssenze([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 CARICA EMPLOYEES per tutti
    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

// CARICA EMPLOYEES per tutti (anche non-admin)
    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

    useEffect(() => {
        if (!token || !user || employees.length === 0) {
            console.log('⏸️ Aspetto employees...', { token: !!token, user: !!user, employeesCount: employees.length });
            return;
        }

        console.log('🔄 useEffect Assenze triggered:', {
            isAdmin,
            visualizzaTutti,
            dipendenteSelezionato: dipendenteSelezionato?.id,
            employeesCount: employees.length
        });

        if (isAdmin) {
            if (visualizzaTutti) {
                fetchAssenze();
            } else if (dipendenteSelezionato) {
                fetchAssenze(dipendenteSelezionato.id);
            }
        } else {
            fetchAssenze();
        }

    }, [token, user?.id, isAdmin, visualizzaTutti, dipendenteSelezionato?.id, employees.length]);



    const getGiorniMese = (m: number, a: number) => new Date(a, m + 1, 0).getDate();
    const getPrimoGiornoSettimana = (m: number, a: number) => {
        const day = new Date(a, m, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };


    const isWeekend = (date: Date): boolean => {
        const day = date.getDay();
        return day === 0 || day === 6; // domenica o sabato
    };

    const getFestiviFissi = (anno: number): Date[] => [
        new Date(anno, 0, 1),  // Capodanno
        new Date(anno, 0, 6),  // Epifania
        new Date(anno, 3, 25), // Liberazione
        new Date(anno, 4, 1),  // Festa del lavoro
        new Date(anno, 5, 2),  // Repubblica
        new Date(anno, 7, 15), // Ferragosto
        new Date(anno, 10, 1), // Ognissanti
        new Date(anno, 11, 8), // Immacolata
        new Date(anno, 11, 25),// Natale
        new Date(anno, 11, 26) // Santo Stefano
    ];
    const getPasqua = (anno: number): Date => {
        const a = anno % 19;
        const b = Math.floor(anno / 100);
        const c = anno % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
        const day = ((h + l - 7 * m + 114) % 31) + 1;

        return new Date(anno, month, day);
    };
    const isFestivo = (date: Date): boolean => {
        const anno = date.getFullYear();
        const festivi = [
            ...getFestiviFissi(anno),
            getPasqua(anno),
            new Date(getPasqua(anno).getTime() + 86400000) // Pasquetta
        ];

        return festivi.some(f =>
            f.getDate() === date.getDate() &&
            f.getMonth() === date.getMonth()
        );
    };

    const getInfoGiorno = (giorno: number, mese: number, anno: number) => {
        const date = new Date(anno, mese, giorno);

        return {
            isWeekend: isWeekend(date),
            isFestivo: isFestivo(date),
            isLavorativo: !isWeekend(date) && !isFestivo(date)
        };
    };

    const getAssenzePerData = (dataStr: string): Absence[] => {
        const assenzeGiorno = assenze.filter(a => {
            const dataAssenza = a.dataInizio || '';

            // Match esatto data inizio
            if (dataAssenza === dataStr) return true;

            // Supporto formato italiano gg/mm/aaaa -> ISO
            if (dataAssenza.includes('/')) {
                const [giorno, mese, anno] = dataAssenza.split('/');
                const dataItalianaISO = `${anno}-${mese.padStart(2, '0')}-${giorno.padStart(2, '0')}`;
                if (dataItalianaISO === dataStr) return true;
            }

            // RANGE FERIE: se tipo 'ferie', calcola tutti i giorni coperti dalla durata
            if (a.tipo === 'ferie' && a.durata > 1) {
                try {
                    const [annoI, meseI, giornoI] = dataAssenza.split(/[-/]/).map(Number);
                    const dataInizio = new Date(annoI, meseI - 1, giornoI);

                    // Calcola data fine: dataInizio + (durata - 1) giorni
                    const dataFine = new Date(dataInizio.getTime() + (a.durata - 1) * 86400000);
                    const dataCheck = new Date(dataStr);

                    // Se dataCheck è tra inizio e fine (incluso), match
                    if (dataCheck >= dataInizio && dataCheck <= dataFine) {
                        return true;
                    }
                } catch (error) {
                    console.warn('Errore calcolo range ferie:', dataAssenza, error);
                }
            }

            return false;
        });

        // Filtro visibilità + stato (approved/pending)
        return assenzeGiorno.filter(a => {
            // Solo approved e pending
            if (a.stato !== 'approved' && a.stato !== 'pending') return false;

            const employee = getEmployeeById(a.employeeId);
            const isOwnAbsence = a.employeeId === user?.id; // Propria assenza visibile sempre
            const isTeamMember = employee?.team === userTeam; // Stesso team per manager

            if (isAdmin) return true; // Admin vede tutto

            if (a.tipo === 'smartworking') return true; // Smart working visibile a tutti

            // Ferie e malattia: solo proprie o del team se manager
            if (['ferie', 'malattia'].includes(a.tipo)) {
                return isOwnAbsence || (isManager && isTeamMember);
            }

            return true; // Altri tipi (permesso, etc.) visibili
        });
    };


    const getEmployeeById = (employeeId: number): Employee | null => {
        const empId = Number(employeeId);
        return employees.find(e => Number(e.id) === empId) || null;
    };

    const apriModale = (dataStr: string) => {
        const assenze = getAssenzePerData(dataStr);
        if (assenze.length === 0) return;

        setGiornoSelezionato(dataStr);
        setAssenzeModale(assenze);
        setModalAperto(true);
    };

    const formattaDataItaliana = (dataISO: string) => {
        const [anno, mese, giorno] = dataISO.split('-');
        return `${giorno}/${mese}/${anno}`;
    };

    const exportCSV = () => {
        const nome = visualizzaTutti ? 'tutti_dipendenti' :
            dipendenteSelezionato?.name || user?.name || 'export';
        const csv = `Data,Dipendente,Tipo,Durata,Stato,Motivo\n` +
            assenze
                .filter(a => a.stato !== 'rejected')
                .map(a => {
                    const empName = getEmployeeById(a.employeeId)?.name || 'N/D';
                    const durata = a.tipo === 'permesso' ? `${a.durata} ore` : `${a.durata} giorni`;
                    return `"${a.dataInizio}","${empName}","${a.tipo}","${durata}","${a.stato}","${a.motivo || '-'}"`;
                })
                .join('\n');
        downloadFile(csv, `calendario_${nome}_${nomiMesi[mese]}_${anno}.csv`);
    };

    const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex items-center justify-center p-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-blue-100/10 backdrop-blur-xl" />
                <div className="bg-white/40 backdrop-blur-3xl rounded-3xl p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white shadow-xl"></div>
                    </div>
                    <h2 className="text-3xl font-light tracking-tight text-zinc-800 mb-4">
                        Caricamento calendario...
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/2 via-blue-500/1 to-purple-500/1 backdrop-blur-xl pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10 space-y-8">

                    {/* Header */}
                    <div className="bg-white/70 backdrop-blur-3xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/60 hover:shadow-3xl transition-all duration-700">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl border border-white/40 shrink-0">
                                    <Calendar className="w-8 h-8 text-white drop-shadow-lg" />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-slate-800 bg-clip-text text-transparent">
                                        Calendario Assenze
                                    </h1>
                                    <p className="text-lg lg:text-xl text-zinc-600 font-light mt-2 flex flex-wrap items-center gap-3">
                                        {isAdmin ? (
                                            visualizzaTutti ? (
                                                <>
                                                    <Users className="w-5 h-5 text-emerald-500" />
                                                    <span className="font-bold">Visualizzazione TUTTI i dipendenti</span>
                                                </>
                                            ) : (
                                                <>
                                                    👤 <span className="font-bold">{dipendenteSelezionato?.name}</span> - {dipendenteSelezionato?.team}
                                                </>
                                            )
                                        ) : (
                                            <>
                                                👤 <span className="font-bold">{user?.name}</span> - {user?.team}
                                            </>
                                        )}
                                        <span className="px-3 py-1 bg-emerald-100/80 text-emerald-700 text-sm font-mono rounded-full border border-emerald-200">
                                            {assenze.filter(a => a.stato === 'approved').length} approvate
                                        </span>
                                        <span className="px-3 py-1 bg-amber-100/80 text-amber-700 text-sm font-mono rounded-full border border-amber-200">
                                            {assenze.filter(a => a.stato === 'pending').length} pending
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setVisualizzaTutti(!visualizzaTutti);
                                                if (!visualizzaTutti) {
                                                    setDipendenteSelezionato(null);
                                                }
                                            }}
                                            className={`flex items-center gap-3 px-6 py-4 h-16 rounded-2xl font-bold text-lg shadow-xl transition-all backdrop-blur-xl border-2 ${
                                                visualizzaTutti
                                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400/50 shadow-emerald-500/25 hover:from-emerald-600 hover:to-green-700'
                                                    : 'bg-white/80 text-zinc-800 border-zinc-200/50 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-emerald-200'
                                            }`}
                                        >
                                            <Users className={`w-5 h-5 ${visualizzaTutti ? 'text-white' : 'text-emerald-500'}`} />
                                            {visualizzaTutti ? '👥 Tutti' : '👤 Singolo'}
                                        </button>

                                        {!visualizzaTutti && employees.length > 0 && (
                                            <select
                                                value={dipendenteSelezionato?.id || ''}
                                                onChange={(e) => {
                                                    const empId = Number(e.target.value);
                                                    const emp = employees.find(e => e.id === empId);
                                                    if (emp) {
                                                        setDipendenteSelezionato(emp);
                                                        fetchAssenze(emp.id);
                                                    }
                                                }}
                                                className="flex-1 lg:flex-none px-6 py-4 h-16 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-2xl font-bold text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl hover:shadow-2xl transition-all min-w-[280px] text-lg"
                                            >
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>
                                                        👤 {emp.name} ({emp.team})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </>
                                )}

                                <button
                                    onClick={exportCSV}
                                    className="flex items-center gap-3 px-8 py-4 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-3xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl border border-blue-400/50"
                                >
                                    <Download className="w-5 h-5" />
                                    Export CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigazione mese */}
                    <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-xl p-6 border border-white/70 flex justify-between items-center">
                        <button
                            onClick={() => {
                                if (mese === 0) {
                                    setMese(11); setAnno(anno - 1);
                                } else {
                                    setMese(mese - 1);
                                }
                            }}
                            className="p-4 hover:bg-white/50 rounded-2xl backdrop-blur-xl border border-zinc-200/50 hover:border-zinc-300 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <ChevronLeft className="w-7 h-7 text-zinc-700" />
                        </button>
                        <div className="text-center min-w-[250px]">
                            <div className="text-4xl font-black bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent tracking-tight">
                                {nomiMesi[mese]} {anno}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (mese === 11) {
                                    setMese(0); setAnno(anno + 1);
                                } else {
                                    setMese(mese + 1);
                                }
                            }}
                            className="p-4 hover:bg-white/50 rounded-2xl backdrop-blur-xl border border-zinc-200/50 hover:border-zinc-300 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <ChevronRight className="w-7 h-7 text-zinc-700" />
                        </button>
                    </div>

                    {/* Calendario */}
                    <div className="bg-white/50 backdrop-blur-3xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/60">
                        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-6">
                            {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(day => (
                                <div key={day} className="text-center py-3">
                                    <div className="text-sm md:text-base font-black text-zinc-700 uppercase tracking-widest bg-zinc-100/50 px-2 py-2 rounded-xl backdrop-blur-xl border border-zinc-200/50 shadow-sm">
                                        {day}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2 md:gap-4">
                            {Array.from({ length: getPrimoGiornoSettimana(mese, anno) }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-20 md:h-32 bg-zinc-50/50 rounded-2xl border-2 border-dashed border-zinc-200/40 backdrop-blur-xl" />
                            ))}

                            {Array.from({ length: getGiorniMese(mese, anno) }).map((_, i) => {
                                const giorno = i + 1;
                                const dataStr = `${anno}-${String(mese + 1).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
                                const assenzeGiorno = getAssenzePerData(dataStr);
                                const info = getInfoGiorno(giorno, mese, anno);
                                const {isFestivo , isWeekend, isLavorativo} = info;
                                const today = new Date().toISOString().split('T')[0] === dataStr;
                                return (
                                    <div
                                        key={giorno}
                                        onClick={() => {
                                            apriModale(dataStr); // Modale esistente dettagli
                                            // Apri popup nuova solo se NON hai già assenza propria quel giorno
                                            const mieAssenze = getAssenzePerData(dataStr).filter(a => a.employeeId === user?.id);
                                            if (mieAssenze.length === 0) {
                                                apriPopupNuova(dataStr);
                                            }
                                        }}
                                        className={`
            relative h-20 md:h-32 p-2 md:p-3 rounded-2xl border-2 shadow-lg 
            transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
            backdrop-blur-xl flex flex-col justify-between group cursor-pointer overflow-hidden
            ${assenzeGiorno.length > 0
                                            ? 'bg-gradient-to-br from-emerald-50/80 to-blue-50/60 border-emerald-300/70 shadow-emerald-200/50 hover:border-emerald-400'
                                            : isFestivo
                                                ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/80 border-red-400 shadow-purple-200/50 hover:border-red-500'
                                                : isWeekend
                                                    ? 'bg-gray-200 border-zinc-200/60'
                                                    : 'bg-white/90 border-zinc-200/50 hover:border-emerald-300/70'
                                        }
            ${today ? 'ring-4 ring-emerald-400/40 shadow-emerald-300' : ''}
        `}
                                    >
        <span className={`font-black text-lg md:text-2xl z-10 ${
            today ? 'text-emerald-700 drop-shadow-lg' : 'text-zinc-800'
        }`}>
            {giorno}
        </span>

                                        <div className="flex flex-col gap-1 mt-auto z-10 w-full">
                                            {assenzeGiorno.slice(0, 3).map((assenza, idx) => {
                                                const employee = getEmployeeById(assenza.employeeId);
                                                const nomeCompleto = employee?.name || `Dip.${assenza.employeeId}`;
                                                const nomeCorto = nomeCompleto.length > 12
                                                    ? `${nomeCompleto.substring(0, 12)}...`
                                                    : nomeCompleto;

                                                return (
                                                    <div
                                                        key={`${assenza.id}-${idx}`}
                                                        className={`px-1.5 py-1 rounded-lg shadow-md backdrop-blur-xl border 
                        text-xs font-bold uppercase tracking-wide group-hover:scale-105 transition-all 
                        flex flex-col gap-0.5 ${
                                                            assenza.tipo === 'ferie'
                                                                ? 'bg-gradient-to-r from-orange-500/95 to-orange-600/95 text-white border-orange-400/60 shadow-orange-400/40'
                                                                : assenza.tipo === 'malattia'
                                                                    ? 'bg-gradient-to-r from-rose-500/95 to-red-600/95 text-white border-red-400/60 shadow-red-400/40'
                                                                    : assenza.tipo === 'permesso'
                                                                        ? 'bg-gradient-to-r from-yellow-500/95 to-amber-600/95 text-white border-yellow-400/60 shadow-yellow-400/40'
                                                                        : 'bg-gradient-to-r from-blue-500/95 to-blue-600/95 text-white border-blue-400/60 shadow-blue-400/40'
                                                        }`}
                                                    >
                        <span className="truncate text-[10px] md:text-[11px] font-bold">
                            {nomeCorto}
                        </span>
                                                        <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] md:text-[10px] opacity-90">
                                {assenza.tipo === 'ferie' ? '🌴' :
                                    assenza.tipo === 'malattia' ? '🤒' :
                                        assenza.tipo === 'permesso' ? '⏰' : '🏠'}
                            </span>
                                                            <span className="text-[9px] md:text-[10px] font-bold bg-white/30 px-1.5 py-0.5 rounded-sm">
                                {assenza.tipo === 'permesso' ? `${assenza.durata}h` : `${assenza.durata}g`}
                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {assenzeGiorno.length > 3 && (
                                            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-20 border-2 border-white">
                                                +{assenzeGiorno.length - 3}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legenda */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm md:text-base font-bold text-zinc-600 pb-8 md:pb-16">
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 shadow-lg">
                            <div className="w-6 h-2.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded shadow-md"></div>
                            <span className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-orange-500" />
            Ferie (giorni)
        </span>
                        </div>
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 shadow-lg">
                            <div className="w-6 h-2.5 bg-gradient-to-r from-rose-500 to-red-600 rounded shadow-md"></div>
                            <span className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-rose-600" />
            Malattia (giorni)
        </span>
                        </div>
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 shadow-lg">
                            <div className="w-6 h-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded shadow-md"></div>
                            <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Permesso (ore)
        </span>
                        </div>
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 shadow-lg">
                            <div className="w-6 h-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow-md"></div>
                            <span className="flex items-center gap-2">
            <Home className="w-4 h-4 text-blue-600" />
            Smartworking (giorni)
        </span>
                        </div>

                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 shadow-lg">
                            <div className="w-5 h-5 bg-gray-200 rounded-xl border-2 border-zinc-300"></div>
                            <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-600" />
            Weekend
        </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔥 MODALE DETTAGLIO GIORNO - CON RANGE "DAL AL" */}
            {modalAperto && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 h-full"
                     onClick={() => setModalAperto(false)}>
                    <div className="bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/70 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-300"
                         onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 flex justify-between items-center border-b-4 border-emerald-400/50">
                            <div>
                                <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                                    <Calendar className="w-10 h-10" />
                                    Assenze del {formattaDataItaliana(giornoSelezionato)}
                                </h2>
                                <p className="text-emerald-100 text-lg mt-2 font-medium">
                                    {assenzeModale.length} {assenzeModale.length === 1 ? 'richiesta' : 'richieste'} totali
                                </p>
                            </div>
                            <button onClick={() => setModalAperto(false)}
                                    className="p-3 hover:bg-white/20 rounded-2xl transition-all hover:rotate-90 duration-300 backdrop-blur-xl border border-white/30">
                                <X className="w-8 h-8 text-white" />
                            </button>
                        </div>

                        {/* Corpo */}
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
                            <div className="space-y-6">
                                {assenzeModale.map((assenza, idx) => {
                                    const employee = getEmployeeById(assenza.employeeId);
                                    const nomeCompleto = employee?.name || `Dipendente ${assenza.employeeId}`;
                                    const team = employee?.team || 'N/D';

                                    // 🔥 CALCOLA RANGE "DAL - AL"
                                    let rangeData = '';
                                    if (assenza.stato === 'approved' && assenza.tipo === 'ferie' && Number(assenza.durata) > 1) {
                                        try {
                                            const [giornoI, meseI, annoI] = assenza.dataInizio.split(/[-/]/);
                                            const dataInizio = new Date(Number(annoI), Number(meseI) - 1, Number(giornoI));
                                            const dataFine = new Date(dataInizio.getTime() + (Number(assenza.durata) - 1) * 86400000);
                                            rangeData = `${formattaDataItaliana(dataInizio.toISOString().split('T')[0])} - ${formattaDataItaliana(dataFine.toISOString().split('T')[0])}`;
                                        } catch {
                                            rangeData = `${assenza.durata} giorni`;
                                        }
                                    } else {
                                        rangeData = `${assenza.durata} ${assenza.tipo === 'permesso' ? 'ore' : 'giorni'}`;
                                    }

                                    return (
                                        <div key={`modal-${assenza.id}-${idx}`}
                                             className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-zinc-200/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300">

                                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                                {/* Dipendente */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl border border-white/40 shrink-0">
                                                            <Users className="w-7 h-7 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-2xl font-black text-zinc-800 tracking-tight">{nomeCompleto}</h3>
                                                            <p className="text-zinc-600 font-medium text-lg mt-1">Team: {team}</p>
                                                        </div>
                                                    </div>

                                                    {/* Tipo */}

                                                    <div className={`px-6 mr-2 py-3 rounded-2xl font-black text-lg shadow-lg border-2 inline-flex items-center gap-3 ${
                                                        assenza.tipo === 'ferie' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400/50' :
                                                            assenza.tipo === 'malattia' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-red-400/50' :
                                                                assenza.tipo === 'permesso' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-yellow-400/50' :
                                                                    'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/50'
                                                    }`}>

                                            <span className="text-2xl">
                                                {assenza.tipo === 'ferie' ? '🌴' : assenza.tipo === 'malattia' ? '🤒' : assenza.tipo === 'permesso' ? '⏰' : '🏠'}
                                            </span>
                                                        {assenza.tipo.toUpperCase()}
                                                    </div>

                                                    {/* 🔥 RANGE DAL-AL o Durata */}
                                                    <div className="px-3 py-3 bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-300 rounded-2xl font-black text-emerald-800 text-lg shadow-lg inline-flex items-center gap-3">
                                                        <Clock className="w-5 h-5" />
                                                        <span>{rangeData}</span>
                                                    </div>

                                                    {/* Motivo */}
                                                    {assenza.motivo && (
                                                        <div className="bg-zinc-100/80 border-2 border-zinc-200 rounded-2xl p-4 backdrop-blur-xl">
                                                            <div className="flex items-start gap-3">
                                                                <AlertCircle className="w-5 h-5 text-zinc-600 mt-0.5 shrink-0" />
                                                                <div>
                                                                    <p className="text-sm font-bold text-zinc-600 uppercase tracking-wider mb-1">Motivo</p>
                                                                    <p className="text-zinc-800 font-medium text-lg">{assenza.motivo}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Stato + ID */}
                                                <div className="flex md:flex-col gap-3 items-start md:items-end">
                                                    <div className={`px-6 py-4 rounded-2xl font-black text-lg shadow-xl border-2 inline-flex items-center gap-3 ${
                                                        assenza.stato === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400/50' :
                                                            assenza.stato === 'pending' ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-400/50' :
                                                                'bg-gradient-to-r from-rose-500 to-red-600 text-white border-red-400/50'
                                                    }`}>
                                                        {assenza.stato === 'pending' ? <><Clock className="w-5 h-5" />IN ATTESA</> :
                                                            assenza.stato === 'approved' ? <><CheckCircle className="w-5 h-5" />APPROVATA</> :
                                                                <><XCircle className="w-5 h-5" />RIFIUTATA</>}
                                                    </div>
                                                    <span className="text-xs text-zinc-500 font-mono px-3 py-1 bg-zinc-100 rounded-lg border border-zinc-200">
                                            ID: {assenza.id}
                                        </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-zinc-100/80 backdrop-blur-xl p-6 border-t-2 border-zinc-200/50 flex justify-end"></div>
                    </div>
                </div>
            )}


            {popupNuovaRichiesta && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/70 max-w-md w-full animate-in zoom-in duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-t-3xl">
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                Nuova Richiesta - {formattaDataItaliana(giornoSelezionato)}
                            </h2>
                        </div>
                        {/* Form */}
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Tipo</label>
                                <select
                                    value={tipoRichiesta}
                                    onChange={(e) => setTipoRichiesta(e.target.value)}
                                className="w-full p-4 border-2 border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg"
                                >
                                    <option value="">Seleziona tipo</option>
                                    <option value="ferie">🌴 Ferie</option>
                                    <option value="malattia">🤒 Malattia</option>
                                    <option value="permesso">⏰ Permesso</option>
                                    <option value="smartworking">🏠 Smartworking</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">
                                    Durata ({tipoRichiesta === 'permesso' ? 'ore' : 'giorni'})
                                </label>
                                <input
                                    type="text"
                                    value={durata}
                                    onChange={(e) => setDurata(e.target.value)}
                                    placeholder="es. 1"
                                    className="w-full p-4 border-2 border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg text-lg tracking-wide font-mono text-left bg-gradient-to-r from-slate-50 to-zinc-50 hover:from-emerald-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Motivo (opzionale)</label>
                                <textarea
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    rows={3}
                                    className="w-full p-4 border-2 border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setPopupNuovaRichiesta(false)}
                                    className="flex-1 px-6 py-4 bg-zinc-100 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-200 transition-all shadow-lg"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={inviaRichiesta}
                                    disabled={!durata}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl hover:from-emerald-600 hover:to-green-700 shadow-2xl transition-all disabled:opacity-50"
                                >
                                    Invia Richiesta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
