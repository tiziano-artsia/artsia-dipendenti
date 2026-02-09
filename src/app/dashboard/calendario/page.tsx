'use client';

import * as XLSX from 'xlsx';
import { useState, useEffect, type SetStateAction } from 'react';
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
    User,
    Filter,
} from 'lucide-react';

import toast, { Toaster } from 'react-hot-toast';

interface AbsenceBackend {
    id: string;
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
    tipo: 'ferie' | 'permesso' | 'smartworking' | 'malattia' | 'fuori-sede' | 'congedo-parentale';
    stato: 'pending' | 'approved' | 'rejected';
    motivo?: string;
}

interface Employee {
    id: number;
    name: string;
    team: string;
}

const nomiMesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const nomiGiorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

type VistaCalendario = 'mensile' | 'settimanale' | 'giornaliera';

const getTipoLabel = (tipo: string): string => {
    const map: Record<string, string> = {
        'ferie': 'Ferie',
        'malattia': 'Malattia',
        'permesso': 'Permesso',
        'smartworking': 'Smartworking',
        'fuori-sede': 'Fuori Sede',
        'congedo-parentale': 'Congedo Parentale',
    };
    return map[tipo.toLowerCase()] || tipo;
};

const getTipoEmoji = (tipo: string): string => {
    const map: Record<string, string> = {
        'ferie': '🌴',
        'malattia': '🤒',
        'permesso': '⏰',
        'smartworking': '🏠',
        'fuori-sede': '🏢️',
        'congedo-parentale': '👶',
    };
    return map[tipo.toLowerCase()] || '📋';
};

const getTipoColor = (tipo: string): string => {
    if (tipo === 'ferie') return 'from-orange-500 to-orange-600 border-orange-400';
    if (tipo === 'malattia') return 'from-rose-500 to-red-600 border-red-400';
    if (tipo === 'permesso') return 'from-yellow-500 to-amber-600 border-yellow-400';
    if (tipo === 'smartworking') return 'from-blue-500 to-blue-600 border-blue-400';
    if (tipo === 'fuori-sede') return 'from-cyan-500 to-cyan-600 border-cyan-400';
    if (tipo === 'congedo-parentale') return 'from-pink-500 to-pink-600 border-pink-400';
    return 'from-gray-500 to-gray-600 border-gray-400';
};

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
    const [tipoRichiesta, setTipoRichiesta] = useState('');
    const [durata, setDurata] = useState('');
    const [motivo, setMotivo] = useState('');
    const [modalAperto, setModalAperto] = useState(false);
    const [giornoSelezionato, setGiornoSelezionato] = useState<string>('');
    const [assenzeModale, setAssenzeModale] = useState<Absence[]>([]);

    // NUOVI STATE PER FILTRI E VISTA
    const [filtriAttivi, setFiltriAttivi] = useState<string[]>([]);
    const [vistaCalendario, setVistaCalendario] = useState<VistaCalendario>('mensile');
    const [giornoCorrente, setGiornoCorrente] = useState(new Date());
    const [settimanaCorrente, setSettimanaCorrente] = useState(new Date());

    const mapBackendToFrontend = (backendData: any[]): Absence[] => {
        return backendData.map((item) => ({
            id: item.id,
            employeeId: item.employeeId,
            dataInizio: item.date || item.dataInizio,
            durata: item.duration || item.durata,
            tipo: (item.type || item.tipo) as 'ferie' | 'permesso' | 'smartworking' | 'malattia' | 'fuori-sede' | 'congedo-parentale',
            stato: (item.status || item.stato) as 'pending' | 'approved' | 'rejected',
            motivo: item.reason || item.motivo,
        }));
    };

    // CARICA EMPLOYEES SEMPRE (anche per non-admin per visualizzare i nomi)
    const fetchEmployees = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/employees', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                let emps: Employee[] = data.data;
                console.log('Employees caricati:', emps.length, emps);

                if (user && !emps.find((e: Employee) => Number(e.id) === Number(user.id))) {
                    emps.push({ id: user.id, name: user.name, team: user.team || 'N/D' });
                    console.log('Aggiunto user corrente agli employees:', user);
                }

                setEmployees(emps);

                // Solo admin può selezionare dipendenti
                if (isAdmin && emps.length > 0 && !visualizzaTutti && !dipendenteSelezionato) {
                    setDipendenteSelezionato(emps[0]);
                }
            }
        } catch (error) {
            console.error('Employees fetch:', error);
        }
    };

    const apriPopupNuova = (dataStr: SetStateAction<string>) => {
        setGiornoSelezionato(dataStr);
        // @ts-ignore
        setTipoRichiesta('');
        // @ts-ignore
        setDurata('1');
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
                motivo: motivo || '',
                status: 'pending',
                requestedBy: user.name || user.email,
                approvedBy: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            console.log('INVIO:', JSON.stringify(payload, null, 2));

            const res = await fetch('/api/absences', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setPopupNuovaRichiesta(false);
                // @ts-ignore
                setTipoRichiesta('');
                // @ts-ignore
                setDurata('');
                setMotivo('');
                fetchAssenze();
                toast.success('Richiesta inviata con successo!');
            } else {
                const error = await res.json();
                toast.error('Errore');
                console.error('Backend:', error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const fetchAssenze = async (specificEmployeeId?: number) => {
        if (!token || !user) return;
        setLoading(true);
        try {
            let url = '/api/absences';
            if (isAdmin) {
                if (specificEmployeeId) {
                    url = `/api/absences?employeeId=${specificEmployeeId}`;
                }
            } else {
                url = `/api/absences?employeeId=${user.id}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Errore API');

            const backendData = data.data;
            const mapped = mapBackendToFrontend(backendData);

            console.log(
                'Assenze mappate:',
                'total',
                mapped.length,
                'approved',
                mapped.filter((a) => a.stato === 'approved').length,
                'pending',
                mapped.filter((a) => a.stato === 'pending').length,
                'rejected',
                mapped.filter((a) => a.stato === 'rejected').length,
                'smartworking',
                mapped.filter((a) => a.tipo === 'smartworking').length
            );

            setAssenze(mapped);
        } catch (error) {
            console.error('Fetch assenze error:', error);
            setAssenze([]);
        } finally {
            setLoading(false);
        }
    };

    // CARICA EMPLOYEES per tutti
    useEffect(() => {
        if (token) fetchEmployees();
    }, [token]);

    useEffect(() => {
        if (!token || !user || employees.length === 0) {
            console.log('Aspetto employees...', 'token', !!token, 'user', !!user, 'employeesCount', employees.length);
            return;
        }
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
        new Date(anno, 0, 1), // Capodanno
        new Date(anno, 0, 6), // Epifania
        new Date(anno, 3, 25), // Liberazione
        new Date(anno, 4, 1), // Festa del lavoro
        new Date(anno, 5, 2), // Repubblica
        new Date(anno, 7, 15), // Ferragosto
        new Date(anno, 10, 1), // Ognissanti
        new Date(anno, 11, 8), // Immacolata
        new Date(anno, 11, 25), // Natale
        new Date(anno, 11, 26), // Santo Stefano
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
            new Date(getPasqua(anno).getTime() + 86400000), // Pasquetta
        ];
        return festivi.some((f) => f.getDate() === date.getDate() && f.getMonth() === date.getMonth());
    };

    const getInfoGiorno = (giorno: number, mese: number, anno: number) => {
        const date = new Date(anno, mese, giorno);
        return {
            isWeekend: isWeekend(date),
            isFestivo: isFestivo(date),
            isLavorativo: !isWeekend(date) && !isFestivo(date),
        };
    };

    const getAssenzePerData = (dataStr: string): Absence[] => {
        const assenzeGiorno = assenze.filter((assenza) => {
            const dataAssenza = assenza.dataInizio;

            // Match esatto data inizio
            if (dataAssenza === dataStr) return true;

            // Supporto formato italiano gg/mm/aaaa -> ISO
            if (dataAssenza.includes('/')) {
                const [giorno, mese, anno] = dataAssenza.split('/');
                const dataItalianaISO = `${anno}-${mese.padStart(2, '0')}-${giorno.padStart(2, '0')}`;
                if (dataItalianaISO === dataStr) return true;
            }

            // Verifica se dataStr cade nel range dell'assenza
            try {
                let dataInizio: Date;

                // Parse dataInizio
                if (dataAssenza.includes('/')) {
                    const [g, m, a] = dataAssenza.split('/').map(Number);
                    dataInizio = new Date(a, m - 1, g);
                } else {
                    const [anno, mese, giorno] = dataAssenza.split('-').map(Number);
                    dataInizio = new Date(anno, mese - 1, giorno);
                }

                // Calcola dataFine saltando weekend e festivi
                let giorniLavorativiContati = 0;
                let dataCorrente = new Date(dataInizio);
                dataCorrente.setDate(dataCorrente.getDate() - 1);

                while (giorniLavorativiContati < assenza.durata) {
                    dataCorrente.setDate(dataCorrente.getDate() + 1);
                    const info = getInfoGiorno(dataCorrente.getDate(), dataCorrente.getMonth(), dataCorrente.getFullYear());
                    if (info.isLavorativo) giorniLavorativiContati++;
                }

                const dataFine = dataCorrente;

                // Parse dataStr da verificare
                const [anno, mese, giorno] = dataStr.split('-').map(Number);
                const dataCheck = new Date(anno, mese - 1, giorno);

                // Verifica se dataCheck è nel range [dataInizio, dataFine] ED è lavorativo
                if (dataCheck >= dataInizio && dataCheck <= dataFine) {
                    const infoCheck = getInfoGiorno(dataCheck.getDate(), dataCheck.getMonth(), dataCheck.getFullYear());
                    if (infoCheck.isLavorativo) return true;
                }
            } catch (error) {
                console.warn('Errore calcolo range assenza', dataAssenza, error);
            }

            return false;
        });

        const assenzeFiltrate = assenzeGiorno.filter((a) => {
            // Filtra per tipo se filtri attivi
            if (filtriAttivi.length > 0 && !filtriAttivi.includes(a.tipo)) return false;

            // Non mostrare mai le rifiutate
            if (a.stato === 'rejected') return false;

            // Admin vede tutto
            if (isAdmin) return true;

            // ASSENZE APPROVATE: TUTTI LE VEDONO (ferie, malattia, permessi, smartworking)
            if (a.stato === 'approved') return true;

            // Assenze PENDING: regole di visibilità specifiche
            if (a.stato === 'pending') {
                const employee = getEmployeeById(a.employeeId);
                const isOwnAbsence = a.employeeId === user?.id;
                const isTeamMember = employee?.team === userTeam;

                // Smartworking pending: sempre visibile a tutti
                if (a.tipo === 'smartworking') return true;

                // Ferie e malattia pending: solo proprie o del team se manager
                if (['ferie', 'malattia'].includes(a.tipo)) {
                    return isOwnAbsence || (isManager && isTeamMember);
                }

                // Permesso pending: solo propri o del team se manager
                if (a.tipo === 'permesso') {
                    return isOwnAbsence || (isManager && isTeamMember);
                }

                // Fuori-sede e congedo-parentale: solo proprie o del team se manager
                if (['fuori-sede', 'congedo-parentale'].includes(a.tipo)) {
                    return isOwnAbsence || (isManager && isTeamMember);
                }
            }

            return false;
        });

        return assenzeFiltrate;
    };

    const getEmployeeById = (employeeId: number): Employee | null => {
        const empId = Number(employeeId);
        return employees.find((e) => Number(e.id) === empId) || null;
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

    const exportExcelMensile = () => {
        // ✅ INIZIALIZZA tutti i dipendenti con valori a 0
        const totaliPerDipendente: Record<
            string,
            {
                ferie: number;
                permesso: number;
                malattia: number;
                smartworking: number;
                festivita: number;
                'fuori-sede': number;
                'congedo-parentale': number;
                motivi: string[];
            }
        > = {};

        // 🎉 CALCOLA i giorni festivi del mese corrente
        const giorniFestiviDelMese: number[] = [];
        const giorniTotaliMese = getGiorniMese(mese, anno);

        for (let giorno = 1; giorno <= giorniTotaliMese; giorno++) {
            const info = getInfoGiorno(giorno, mese, anno);
            if (info.isFestivo) {
                giorniFestiviDelMese.push(giorno);
            }
        }

        // ✅ Prima loop: crea entry per TUTTI i dipendenti
        employees.forEach((emp) => {
            totaliPerDipendente[emp.name] = {
                ferie: 0,
                permesso: 0,
                malattia: 0,
                smartworking: 0,
                festivita: giorniFestiviDelMese.length, // ✅ Assegna automaticamente i giorni festivi
                'fuori-sede': 0,
                'congedo-parentale': 0,
                motivi: [],
            };
        });

        // ✅ Secondo loop: aggiungi le assenze dove presenti
        const assenzeDelMese = assenze
            .filter((a) => a.stato !== 'rejected')
            .filter((a) => {
                const raw = a.dataInizio;
                let date: Date | null = null;

                if (raw.includes('/')) {
                    const [g, m, y] = raw.split('/');
                    date = new Date(Number(y), Number(m) - 1, Number(g));
                } else if (raw.includes('-')) {
                    const [y, m, g] = raw.split('-');
                    date = new Date(Number(y), Number(m) - 1, Number(g));
                }

                if (!date || isNaN(date.getTime())) return false;
                return date.getMonth() === mese && date.getFullYear() === anno;
            });

        assenzeDelMese.forEach((a) => {
            const empName = getEmployeeById(a.employeeId)?.name || 'N/D';

            // Se il dipendente non esiste ancora, crealo
            if (!totaliPerDipendente[empName]) {
                totaliPerDipendente[empName] = {
                    ferie: 0,
                    permesso: 0,
                    malattia: 0,
                    smartworking: 0,
                    festivita: giorniFestiviDelMese.length,
                    'fuori-sede': 0,
                    'congedo-parentale': 0,
                    motivi: [],
                };
            }

            // Aggiungi motivo
            if (a.motivo && a.motivo.trim() !== '') {
                totaliPerDipendente[empName].motivi.push(a.motivo);
            }

            // Normalizza il tipo
            const tipoNorm = a.tipo
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-');

            // Incrementa contatore
            if (tipoNorm === 'ferie') {
                totaliPerDipendente[empName].ferie += a.durata;
            } else if (tipoNorm === 'permesso') {
                totaliPerDipendente[empName].permesso += a.durata;
            } else if (tipoNorm === 'malattia') {
                totaliPerDipendente[empName].malattia += a.durata;
            } else if (tipoNorm === 'smartworking') {
                totaliPerDipendente[empName].smartworking += a.durata;
            } else if (tipoNorm === 'fuori-sede') {
                totaliPerDipendente[empName]['fuori-sede'] += a.durata;
            } else if (tipoNorm === 'congedo-parentale') {
                totaliPerDipendente[empName]['congedo-parentale'] += a.durata;
            }
        });

        const dipendentiOrdinati = Object.keys(totaliPerDipendente).sort();

        // Verifica quali colonne hanno valori > 0
        const haFestivita = giorniFestiviDelMese.length > 0;
        const haFuoriSede = dipendentiOrdinati.some((nome) => totaliPerDipendente[nome]['fuori-sede'] > 0);
        const haCongedoParentale = dipendentiOrdinati.some((nome) => totaliPerDipendente[nome]['congedo-parentale'] > 0);

        const datiSheet: (string | number)[][] = [];
        datiSheet.push([`TOTALE MENSILE DI ${nomiMesi[mese]} ${anno}`]);
        datiSheet.push([]);

        // Header dinamico
        const headerRow = ['', 'Dipendente', 'Ferie (giorni)', 'Permesso (ore)', 'Malattia (giorni)', 'Smartworking (giorni)'];

        if (haFestivita) headerRow.push('Festività (giorni)');
        if (haFuoriSede) headerRow.push('Fuori Sede (giorni)');
        if (haCongedoParentale) headerRow.push('Congedo Parentale (giorni)');

        headerRow.push('Motivi');

        datiSheet.push(headerRow);

        // Righe dipendenti
        dipendentiOrdinati.forEach((nome, index) => {
            const totali = totaliPerDipendente[nome];
            const motiviStringa = totali.motivi.length > 0 ? totali.motivi.join(' - ') : '';

            const row: (string | number)[] = [index + 1, nome, totali.ferie, totali.permesso, totali.malattia, totali.smartworking];

            if (haFestivita) row.push(totali.festivita);
            if (haFuoriSede) row.push(totali['fuori-sede']);
            if (haCongedoParentale) row.push(totali['congedo-parentale']);

            row.push(motiviStringa);

            datiSheet.push(row);
        });

        // Crea workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(datiSheet);

        // Larghezza colonne
        const colWidths = [{ wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];

        if (haFestivita) colWidths.push({ wch: 20 });
        if (haFuoriSede) colWidths.push({ wch: 20 });
        if (haCongedoParentale) colWidths.push({ wch: 25 });

        colWidths.push({ wch: 40 });

        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Totali Mensili');

        // Genera buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Crea Blob e download
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `totali_assenze_${nomiMesi[mese]}_${anno}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success('📊 Excel esportato con successo!');
    };

    // FUNZIONI PER VISTA SETTIMANALE
    const getInizioSettimana = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const getGiorniSettimana = (startDate: Date) => {
        const giorni = [];
        for (let i = 0; i < 7; i++) {
            const giorno = new Date(startDate);
            giorno.setDate(startDate.getDate() + i);
            giorni.push(giorno);
        }
        return giorni;
    };

    const renderVistaGiornaliera = () => {
        const dataStr = `${giornoCorrente.getFullYear()}-${String(giornoCorrente.getMonth() + 1).padStart(2, '0')}-${String(giornoCorrente.getDate()).padStart(2, '0')}`;
        const assenzeGiorno = getAssenzePerData(dataStr);
        const info = getInfoGiorno(giornoCorrente.getDate(), giornoCorrente.getMonth(), giornoCorrente.getFullYear());

        return (
            <div className="bg-white/50 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/60">
                {/* Header Giorno - Responsive */}
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-800 leading-tight break-words px-2">
                        {nomiGiorni[giornoCorrente.getDay()]} {giornoCorrente.getDate()} {nomiMesi[giornoCorrente.getMonth()]} {giornoCorrente.getFullYear()}
                    </h2>
                    {info.isFestivo && (
                        <p className="text-red-600 font-bold text-sm sm:text-base mt-2 flex items-center justify-center gap-2">
                            <span className="text-lg sm:text-xl">🎉</span> Giorno Festivo
                        </p>
                    )}
                    {info.isWeekend && !info.isFestivo && (
                        <p className="text-zinc-600 font-bold text-sm sm:text-base mt-2 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" /> Weekend
                        </p>
                    )}
                </div>

                {/* Empty State - Responsive */}
                {assenzeGiorno.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 md:py-20 text-zinc-500 px-4">
                        <Calendar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-30" />
                        <p className="text-lg sm:text-xl md:text-2xl font-bold">Nessuna assenza per questo giorno</p>
                    </div>
                ) : (
                    /* Lista Assenze - Responsive */
                    <div className="space-y-3 sm:space-y-4">
                        {assenzeGiorno.map((assenza, idx) => {
                            const employee = getEmployeeById(assenza.employeeId);
                            const nomeCompleto = employee?.name || `Dip.${assenza.employeeId}`;

                            return (
                                <div
                                    key={`giornaliera-${assenza.id}-${idx}`}
                                    className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-zinc-200/50 shadow-lg hover:shadow-xl transition-all active:scale-0.99"
                                >
                                    {/* Header Card - Stack su mobile, affiancato su desktop */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                        {/* Info Dipendente */}
                                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-lg md:text-xl font-black text-zinc-800 truncate">{nomeCompleto}</h3>
                                                <p className="text-sm sm:text-base text-zinc-600 truncate">{employee?.team || 'N/D'}</p>
                                            </div>
                                        </div>

                                        {/* Badge Tipo Assenza - Full width su mobile */}
                                        <div
                                            className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg shadow-lg border-2 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap bg-gradient-to-r ${getTipoColor(assenza.tipo)} text-white`}
                                        >
                                            <span className="text-lg sm:text-xl md:text-2xl">{getTipoEmoji(assenza.tipo)}</span>
                                            <span className="uppercase">{assenza.tipo}</span>
                                        </div>
                                    </div>

                                    {/* Durata */}
                                    <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg sm:rounded-xl w-full sm:w-auto inline-flex">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                                        <span className="text-sm sm:text-base font-bold text-emerald-800">Durata: </span>
                                        <span className="text-base sm:text-lg md:text-xl font-black">
                      {assenza.durata} {assenza.tipo === 'permesso' ? 'ore' : 'giorni'}
                    </span>
                                    </div>

                                    {/* Motivo */}
                                    {assenza.motivo && (
                                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-zinc-100 rounded-lg sm:rounded-xl border border-zinc-200">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-zinc-600 uppercase tracking-wider mb-1">Motivo</p>
                                                    <p className="text-sm sm:text-base text-zinc-800 break-words leading-relaxed">{assenza.motivo}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Badge Stato */}
                                    {assenza.stato && (
                                        <div className="mt-3 sm:mt-4 flex items-center gap-2">
                      <span
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 sm:gap-2 ${
                              assenza.stato === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                  : assenza.stato === 'pending'
                                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                      : 'bg-rose-100 text-rose-700 border border-rose-300'
                          }`}
                      >
                        {assenza.stato === 'pending' ? (
                            <>
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">In attesa</span>
                                <span className="sm:hidden">Attesa</span>
                            </>
                        ) : assenza.stato === 'approved' ? (
                            <>
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Approvata</span>
                                <span className="sm:hidden">Approvata</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Rifiutata</span>
                                <span className="sm:hidden">Rifiutata</span>
                            </>
                        )}
                      </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderVistaSettimanale = () => {
        const inizioSettimana = getInizioSettimana(settimanaCorrente);
        const giorniSettimana = getGiorniSettimana(inizioSettimana);
        const fineSettimana = new Date(giorniSettimana[6]);

        return (
            <div className="bg-white/50 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/60">
                {/* Header Settimana - Responsive */}
                <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg md:text-2xl font-black text-zinc-800 leading-tight px-2 break-words">
                        Settimana dal {inizioSettimana.getDate()} {nomiMesi[inizioSettimana.getMonth()]} al {fineSettimana.getDate()} {nomiMesi[fineSettimana.getMonth()]}{' '}
                        {fineSettimana.getFullYear()}
                    </h2>
                </div>

                {/* Griglia Giorni - Responsive 1 colonna su mobile, 7 su desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
                    {giorniSettimana.map((giorno, idx) => {
                        const dataStr = `${giorno.getFullYear()}-${String(giorno.getMonth() + 1).padStart(2, '0')}-${String(giorno.getDate()).padStart(2, '0')}`;
                        const assenzeGiorno = getAssenzePerData(dataStr);
                        const info = getInfoGiorno(giorno.getDate(), giorno.getMonth(), giorno.getFullYear());
                        const today = new Date().toISOString().split('T')[0] === dataStr;

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    apriModale(dataStr);
                                    const mieAssenze = getAssenzePerData(dataStr).filter((a) => a.employeeId === user?.id);
                                    if (mieAssenze.length === 0) {
                                        apriPopupNuova(dataStr);
                                    }
                                }}
                                className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 min-h-[180px] sm:min-h-[200px] ${
                                    assenzeGiorno.length > 0
                                        ? 'bg-gradient-to-br from-emerald-50/80 to-blue-50/60 border-emerald-300/70'
                                        : info.isFestivo
                                            ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/80 border-red-400'
                                            : info.isWeekend
                                                ? 'bg-gray-200 border-zinc-200/60'
                                                : 'bg-white/90 border-zinc-200/50 hover:border-emerald-300/70'
                                } ${today ? 'ring-2 sm:ring-4 ring-emerald-400/40' : ''}`}
                            >
                                {/* Header Giorno */}
                                <div className="text-center mb-3 sm:mb-4">
                                    <p className="text-xs sm:text-sm font-bold text-zinc-600 uppercase tracking-wider">{nomiGiorni[giorno.getDay()].substring(0, 3)}</p>
                                    <p className={`text-2xl sm:text-3xl font-black ${today ? 'text-emerald-700' : 'text-zinc-800'}`}>{giorno.getDate()}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{nomiMesi[giorno.getMonth()].substring(0, 3)}</p>
                                </div>

                                {/* Badge Festivo/Weekend */}
                                {info.isFestivo && <div className="absolute top-2 right-2 text-lg sm:text-xl">🎉</div>}
                                {info.isWeekend && !info.isFestivo && (
                                    <div className="absolute top-2 right-2 bg-zinc-500/20 rounded-full p-1">
                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-600" />
                                    </div>
                                )}

                                {/* Lista Assenze */}
                                <div className="space-y-1.5 sm:space-y-2">
                                    {assenzeGiorno.slice(0, 3).map((assenza, idx) => {
                                        const employee = getEmployeeById(assenza.employeeId);
                                        const nomeCorto = employee?.name || `Dip.${assenza.employeeId}`.substring(0, 20);

                                        return (
                                            <div
                                                key={`week-${assenza.id}-${idx}`}
                                                className={`px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white shadow-md hover:scale-105 transition-transform bg-gradient-to-r ${getTipoColor(assenza.tipo)}`}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="truncate flex-1">{nomeCorto}</p>
                                                    <span className="text-[10px] sm:text-xs bg-white/30 px-1 rounded shrink-0">
                            {assenza.durata}
                                                        {assenza.tipo === 'permesso' ? 'h' : 'g'}
                          </span>
                                                </div>
                                                <p className="text-[9px] sm:text-[10px] opacity-90 mt-0.5 capitalize">{assenza.tipo}</p>
                                            </div>
                                        );
                                    })}

                                    {/* Badge Altre assenze */}
                                    {assenzeGiorno.length > 3 && (
                                        <div className="text-xs text-center font-bold text-zinc-600 bg-zinc-100/80 py-1.5 rounded-lg border border-zinc-200">
                                            +{assenzeGiorno.length - 3} {assenzeGiorno.length === 4 ? 'altra' : 'altre'}
                                        </div>
                                    )}

                                    {/* Empty state per giorni senza assenze */}
                                    {assenzeGiorno.length === 0 && !info.isFestivo && !info.isWeekend && (
                                        <div className="text-center py-4 sm:py-6 text-zinc-400">
                                            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs sm:text-sm font-medium">Nessuna assenza</p>
                                        </div>
                                    )}
                                </div>

                                {/* Badge Oggi */}
                                {today && <div className="absolute bottom-2 right-2 px-2 py-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-black rounded-full shadow-lg">OGGI</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex items-center justify-center p-4 sm:p-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-blue-100/10 backdrop-blur-xl" />
                <div className="bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl text-center max-w-lg mx-auto border border-white/50 relative z-10 w-full">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl sm:rounded-3xl mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <div className="animate-spin rounded-full h-10 h-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-4 border-white/20 border-t-white shadow-xl" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-zinc-800 mb-3 sm:mb-4">Caricamento calendario...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 sm:p-4 md:p-8 relative overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] via-blue-500/[0.01] to-purple-500/[0.01] backdrop-blur-xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-4 sm:space-y-6 md:space-y-8">
                {/* Header - Ottimizzato per mobile */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/60 hover:shadow-3xl transition-all duration-700">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl border border-white/40 shrink-0">
                                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white drop-shadow-lg" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-slate-800 bg-clip-text text-transparent mb-2 sm:mb-3">
                                    Calendario Assenze
                                </h1>
                                <p className="text-sm sm:text-base md:text-xl text-zinc-600 font-light flex flex-wrap items-center gap-2 sm:gap-3">
                                    {isAdmin ? (
                                        visualizzaTutti ? (
                                            <>
                                                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                                                <span className="font-bold text-xs sm:text-sm md:text-base">Tutti i dipendenti</span>
                                            </>
                                        ) : (
                                            <>
                                                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                                <span className="font-bold text-xs sm:text-sm md:text-base truncate max-w-[150px] sm:max-w-none">{dipendenteSelezionato?.name}</span>
                                                <span className="text-xs sm:text-sm">- {dipendenteSelezionato?.team}</span>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="font-bold text-xs sm:text-sm md:text-base truncate max-w-[150px] sm:max-w-none">{user?.name}</span>
                                            <span className="text-xs sm:text-sm">- {user?.team}</span>
                                        </>
                                    )}
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-100/80 text-amber-700 text-[10px] sm:text-xs font-mono rounded-full border border-amber-200 whitespace-nowrap">
                    {assenze.filter((a) => a.stato === 'pending').length} in attesa
                  </span>
                                </p>
                            </div>
                        </div>

                        {/* Controlli - Stack su mobile */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full">
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        setVisualizzaTutti(!visualizzaTutti);
                                        if (!visualizzaTutti) {
                                            setDipendenteSelezionato(null);
                                        }
                                    }}
                                    className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 h-12 sm:h-16 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg shadow-xl transition-all backdrop-blur-xl border-2 w-full sm:w-auto active:scale-95 ${
                                        visualizzaTutti
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400/50 shadow-emerald-500/25 hover:from-emerald-600 hover:to-green-700'
                                            : 'bg-white/80 text-zinc-800 border-zinc-200/50 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${visualizzaTutti ? 'text-white' : 'text-emerald-500'}`} />
                                    {visualizzaTutti ? 'Tutti' : 'Singolo'}
                                </button>
                            )}

                            {!visualizzaTutti && employees.length > 0 && (
                                <select
                                    value={dipendenteSelezionato?.id}
                                    onChange={(e) => {
                                        const empId = Number(e.target.value);
                                        const emp = employees.find((e) => e.id === empId);
                                        if (emp) {
                                            setDipendenteSelezionato(emp);
                                            fetchAssenze(emp.id);
                                        }
                                    }}
                                    className="flex-1 sm:min-w-[280px] px-4 sm:px-6 py-3 sm:py-4 h-12 sm:h-16 bg-white/80 backdrop-blur-xl border-2 border-zinc-200/50 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg text-zinc-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xl"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} - {emp.team}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {(isAdmin || isManager) && (
                                <button
                                    onClick={exportExcelMensile}
                                    className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 h-12 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-3xl hover:from-blue-600 hover:to-indigo-700 transition-all backdrop-blur-xl border border-blue-400/50 w-full sm:w-auto active:scale-95"
                                >
                                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Export Excel</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filtri - Ottimizzato per mobile */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/70">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            <h3 className="text-lg sm:text-xl font-bold text-zinc-800">Filtra per tipo</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {['smartworking', 'ferie', 'malattia', 'permesso', 'fuori-sede', 'congedo-parentale'].map((tipo) => (
                            <button
                                key={tipo}
                                onClick={() => setFiltriAttivi((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]))}
                                className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base shadow-lg transition-all border-2 active:scale-95 ${
                                    filtriAttivi.includes(tipo) ? `bg-gradient-to-r ${getTipoColor(tipo)} text-white` : 'bg-white/80 text-zinc-700 border-zinc-200 hover:border-emerald-400'
                                }`}
                            >
                                {getTipoEmoji(tipo)}
                                <span className="ml-1 sm:ml-2">{getTipoLabel(tipo)}</span>
                            </button>
                        ))}
                    </div>

                    {filtriAttivi.length > 0 && (
                        <button
                            onClick={() => setFiltriAttivi([])}
                            className="mt-3 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm shadow-lg transition-all border-2 bg-red-500 text-white border-red-400 hover:bg-red-600 active:scale-95"
                        >
                            <X className="w-4 h-4 inline mr-2" /> Rimuovi filtri
                        </button>
                    )}
                </div>

                {/* Selettore Vista + Navigazione - Ottimizzato per mobile */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/70 space-y-4">
                    {/* Selettore Vista */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <button
                            onClick={() => setVistaCalendario('giornaliera')}
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base shadow-lg transition-all border-2 active:scale-95 ${
                                vistaCalendario === 'giornaliera'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400'
                                    : 'bg-white/80 text-zinc-700 border-zinc-200 hover:border-emerald-400'
                            }`}
                        >
                            Giorno
                        </button>
                        <button
                            onClick={() => setVistaCalendario('settimanale')}
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base shadow-lg transition-all border-2 active:scale-95 ${
                                vistaCalendario === 'settimanale'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400'
                                    : 'bg-white/80 text-zinc-700 border-zinc-200 hover:border-emerald-400'
                            }`}
                        >
                            Settimana
                        </button>
                        <button
                            onClick={() => setVistaCalendario('mensile')}
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base shadow-lg transition-all border-2 active:scale-95 ${
                                vistaCalendario === 'mensile'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400'
                                    : 'bg-white/80 text-zinc-700 border-zinc-200 hover:border-emerald-400'
                            }`}
                        >
                            Mese
                        </button>
                    </div>
                    {/* Legenda - Sotto il calendario */}
                    <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/70">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                    <span className="text-lg sm:text-xl">📋</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-zinc-800">Legenda Tipi di Assenza</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {['ferie', 'malattia', 'permesso', 'smartworking', 'fuori-sede', 'congedo-parentale'].map((tipo) => (
                                <div
                                    key={tipo}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-md bg-gradient-to-r ${getTipoColor(tipo)} text-white`}
                                >
                                    <span className="text-2xl shrink-0">{getTipoEmoji(tipo)}</span>
                                    <span className="font-bold text-sm sm:text-base">{getTipoLabel(tipo)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Legenda Stati */}
                        <div className="mt-6 pt-6 border-t-2 border-zinc-200/50">
                            <h4 className="text-base sm:text-lg font-bold text-zinc-800 mb-3 sm:mb-4">Stati delle Richieste</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-100 border-2 border-emerald-300 shadow-md">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span className="font-bold text-sm sm:text-base text-emerald-700">Approvata</span>
                                </div>

                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-100 border-2 border-amber-300 shadow-md">
                                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                                    <span className="font-bold text-sm sm:text-base text-amber-700">In Attesa</span>
                                </div>

                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-100 border-2 border-rose-300 shadow-md">
                                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                    <span className="font-bold text-sm sm:text-base text-rose-700">Rifiutata</span>
                                </div>
                            </div>
                        </div>

                        {/* Legenda Giorni Speciali */}
                        <div className="mt-6 pt-6 border-t-2 border-zinc-200/50">
                            <h4 className="text-base sm:text-lg font-bold text-zinc-800 mb-3 sm:mb-4">Giorni Speciali</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-red-400 shadow-md">
                                    <span className="text-xl shrink-0">🎉</span>
                                    <span className="font-bold text-sm sm:text-base text-red-600">Festività</span>
                                </div>

                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-200 border-2 border-zinc-300 shadow-md">
                                    <Calendar className="w-5 h-5 text-zinc-600 shrink-0" />
                                    <span className="font-bold text-sm sm:text-base text-zinc-700">Weekend</span>
                                </div>

                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 border-emerald-400 shadow-md ring-2 ring-emerald-400/40">
                                    <span className="text-xl shrink-0">📍</span>
                                    <span className="font-bold text-sm sm:text-base text-emerald-700">Oggi</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigazione */}
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <button
                            onClick={() => {
                                if (vistaCalendario === 'giornaliera') {
                                    const nuovaData = new Date(giornoCorrente);
                                    nuovaData.setDate(giornoCorrente.getDate() - 1);
                                    setGiornoCorrente(nuovaData);
                                } else if (vistaCalendario === 'settimanale') {
                                    const nuovaData = new Date(settimanaCorrente);
                                    nuovaData.setDate(settimanaCorrente.getDate() - 7);
                                    setSettimanaCorrente(nuovaData);
                                } else {
                                    if (mese === 0) {
                                        setMese(11);
                                        setAnno(anno - 1);
                                    } else {
                                        setMese(mese - 1);
                                    }
                                }
                            }}
                            className="p-2 sm:p-3 md:p-4 hover:bg-white/50 rounded-xl sm:rounded-2xl backdrop-blur-xl border border-zinc-200/50 hover:border-zinc-300 transition-all hover:scale-105 shadow-lg active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-zinc-700" />
                        </button>

                        <div className="text-center flex-1 min-w-0">
                            <div className="text-base sm:text-xl md:text-4xl font-black bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent tracking-tight truncate">
                                {vistaCalendario === 'giornaliera'
                                    ? `${giornoCorrente.getDate()} ${nomiMesi[giornoCorrente.getMonth()]} ${giornoCorrente.getFullYear()}`
                                    : vistaCalendario === 'settimanale'
                                        ? `Sett. ${getInizioSettimana(settimanaCorrente).getDate()} ${nomiMesi[getInizioSettimana(settimanaCorrente).getMonth()]}`
                                        : vistaCalendario === 'mensile'
                                            ? `${nomiMesi[mese]} ${anno}`
                                            : ''}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (vistaCalendario === 'giornaliera') {
                                    const nuovaData = new Date(giornoCorrente);
                                    nuovaData.setDate(giornoCorrente.getDate() + 1);
                                    setGiornoCorrente(nuovaData);
                                } else if (vistaCalendario === 'settimanale') {
                                    const nuovaData = new Date(settimanaCorrente);
                                    nuovaData.setDate(settimanaCorrente.getDate() + 7);
                                    setSettimanaCorrente(nuovaData);
                                } else {
                                    if (mese === 11) {
                                        setMese(0);
                                        setAnno(anno + 1);
                                    } else {
                                        setMese(mese + 1);
                                    }
                                }
                            }}
                            className="p-2 sm:p-3 md:p-4 hover:bg-white/50 rounded-xl sm:rounded-2xl backdrop-blur-xl border border-zinc-200/50 hover:border-zinc-300 transition-all hover:scale-105 shadow-lg active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-zinc-700" />
                        </button>
                    </div>
                </div>

                {/* Calendario Mensile - Griglia responsive */}
                {vistaCalendario === 'mensile' && (
                    <div className="bg-white/50 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 md:p-10 border border-white/60">
                        {/* Intestazione giorni */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-4 mb-3 sm:mb-6">
                            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, idx) => (
                                <div key={idx} className="text-center py-2 sm:py-3">
                                    <div className="text-xs sm:text-sm md:text-base font-black text-zinc-700 uppercase tracking-widest bg-zinc-100/50 px-1 sm:px-2 py-1 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-xl border border-zinc-200/50 shadow-sm">
                                        <span className="hidden sm:inline">{['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'][idx]}</span>
                                        <span className="sm:hidden">{day}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Giorni del mese */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-4">
                            {/* Celle vuote iniziali */}
                            {Array.from({ length: getPrimoGiornoSettimana(mese, anno) }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="h-16 sm:h-24 md:h-32 bg-zinc-50/50 rounded-lg sm:rounded-2xl border-2 border-dashed border-zinc-200/40 backdrop-blur-xl"
                                />
                            ))}

                            {/* Giorni effettivi */}
                            {Array.from({ length: getGiorniMese(mese, anno) }).map((_, i) => {
                                const giorno = i + 1;
                                const dataStr = `${anno}-${String(mese + 1).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
                                const assenzeGiorno = getAssenzePerData(dataStr);
                                const info = getInfoGiorno(giorno, mese, anno);
                                const { isFestivo, isWeekend } = info;
                                const today = new Date().toISOString().split('T')[0] === dataStr;

                                return (
                                    <div
                                        key={giorno}
                                        onClick={() => {
                                            apriModale(dataStr);
                                            const mieAssenze = getAssenzePerData(dataStr).filter((a) => a.employeeId === user?.id);
                                            if (mieAssenze.length === 0) {
                                                apriPopupNuova(dataStr);
                                            }
                                        }}
                                        className={`relative h-16 sm:h-32 md:h-52 p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-2xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 sm:hover:-translate-y-1 backdrop-blur-xl flex flex-col justify-between group cursor-pointer overflow-hidden ${
                                            assenzeGiorno.length > 0
                                                ? 'bg-gradient-to-br from-emerald-50/80 to-blue-50/60 border-emerald-300/70'
                                                : isFestivo
                                                    ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/80 border-red-400'
                                                    : isWeekend
                                                        ? 'bg-gray-200 border-zinc-200/60'
                                                        : 'bg-white/90 border-zinc-200/50 hover:border-emerald-300/70'
                                        } ${today ? 'ring-2 sm:ring-4 ring-emerald-400/40' : ''}`}
                                    >
                                        {/* Numero giorno */}
                                        <div className="flex items-center justify-between">
                                            <div className={`text-xs sm:text-base md:text-2xl font-black ${today ? 'text-emerald-600' : 'text-zinc-800'} ${isFestivo ? 'text-red-500' : ''}`}>
                                                {giorno}
                                            </div>

                                            {/* Badge Festivo/Weekend */}
                                            {isFestivo && <div className="text-sm sm:text-base md:text-lg">🎉</div>}
                                            {isWeekend && !isFestivo && <div className="hidden sm:block text-zinc-400 text-xs md:text-sm">🏖️</div>}
                                        </div>

                                        {/* Assenze - responsive */}
                                        <div className="flex flex-col gap-0.5 sm:gap-1 mt-auto z-10 w-full">
                                            {assenzeGiorno
                                                .filter((a) => {
                                                    const info = getInfoGiorno(giorno, mese, anno);
                                                    return info.isLavorativo;
                                                })
                                                .slice(0, 2) // Riduci a 2 su mobile
                                                .map((assenza, idx) => {
                                                    const employee = getEmployeeById(assenza.employeeId);
                                                    const nomeCompleto = employee?.name || `Dip.${assenza.employeeId}`;

                                                    return (
                                                        <div
                                                            key={`${assenza.id}-${idx}`}
                                                            title={`${nomeCompleto} - ${assenza.tipo} - ${assenza.durata} ${assenza.tipo === 'permesso' ? 'ore' : 'giorni'}`}
                                                            className={`h-2 sm:h-auto sm:px-2 sm:py-1.5 rounded-sm sm:rounded-lg shadow-sm sm:shadow-md border sm:font-bold group-hover:scale-105 transition-all cursor-pointer active:scale-95 bg-gradient-to-r ${getTipoColor(
                                                                assenza.tipo
                                                            )} border-${assenza.tipo}-400/60 sm:text-white`}
                                                        >
                                                            {/* Tablet e Desktop: Nome + Durata */}
                                                            <div className="hidden sm:flex items-center justify-between gap-1">
                                                                <span className="text-[10px] md:text-[11px] truncate">{nomeCompleto}</span>
                                                                <span className="text-[9px] md:text-[10px] bg-white/30 px-1 rounded-sm shrink-0">
                                  {assenza.tipo === 'permesso' ? `${assenza.durata}h` : `${assenza.durata}g`}
                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>

                                        {/* Badge per assenze extra */}
                                        {assenzeGiorno.length > 2 && (
                                            <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white text-[9px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold shadow-lg z-20 border border-white">
                                                +{assenzeGiorno.length - 2}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Vista giornaliera e settimanale - mantieni come sono ma aggiungi padding responsive */}
                {vistaCalendario === 'giornaliera' && renderVistaGiornaliera()}
                {vistaCalendario === 'settimanale' && renderVistaSettimanale()}
            </div>

            {/* Modale per dettagli assenze */}
            {modalAperto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-white/95 backdrop-blur-3xl rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl border border-white/70">
                        {/* Header modale */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 sm:p-6 md:p-8 flex justify-between items-start gap-3 border-b-4 border-emerald-400/50">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 shrink-0" />
                                    <span className="break-words">Assenze del {formattaDataItaliana(giornoSelezionato)}</span>
                                </h2>
                                <p className="text-emerald-100 text-sm sm:text-base md:text-lg mt-2 font-medium">
                                    {assenzeModale.length} {assenzeModale.length === 1 ? 'richiesta' : 'richieste'} totali
                                </p>
                            </div>

                            <button
                                onClick={() => setModalAperto(false)}
                                className="p-2 sm:p-3 hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all hover:rotate-90 duration-300 backdrop-blur-xl border border-white/30 shrink-0 active:scale-95"
                            >
                                <X className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                            </button>
                        </div>

                        {/* Corpo modale con scroll */}
                        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-140px)] sm:max-h-[calc(90vh-180px)]">
                            <div className="space-y-4 sm:space-y-6">
                                {assenzeModale.map((assenza, idx) => {
                                    const employee = getEmployeeById(assenza.employeeId);
                                    const nomeCompleto = employee?.name || `Dipendente ${assenza.employeeId}`;
                                    const team = employee?.team || 'N/D';

                                    return (
                                        <div
                                            key={`modal-${assenza.id}-${idx}`}
                                            className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-zinc-200/50 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <div className="flex flex-col gap-4 sm:gap-6">
                                                {/* Info dipendente */}
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl border border-white/40 shrink-0">
                                                        <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-zinc-800 tracking-tight truncate">{nomeCompleto}</h3>
                                                        <p className="text-zinc-600 font-medium text-sm sm:text-base md:text-lg">Team: {team}</p>
                                                    </div>
                                                </div>

                                                {/* Badges tipo e stato */}
                                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                                    <div
                                                        className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg shadow-lg border-2 inline-flex items-center gap-2 bg-gradient-to-r ${getTipoColor(
                                                            assenza.tipo
                                                        )} text-white`}
                                                    >
                                                        <span className="text-lg sm:text-xl md:text-2xl">{getTipoEmoji(assenza.tipo)}</span>
                                                        <span className="truncate">{assenza.tipo.toUpperCase()}</span>
                                                    </div>

                                                    <div
                                                        className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg shadow-xl border-2 inline-flex items-center gap-2 ${
                                                            assenza.stato === 'approved'
                                                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400/50'
                                                                : assenza.stato === 'pending'
                                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-400/50'
                                                                    : 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-red-400/50'
                                                        }`}
                                                    >
                                                        {assenza.stato === 'pending' ? (
                                                            <>
                                                                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                <span className="hidden sm:inline">IN ATTESA</span>
                                                                <span className="sm:hidden">ATTESA</span>
                                                            </>
                                                        ) : assenza.stato === 'approved' ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                <span className="hidden sm:inline">APPROVATA</span>
                                                                <span className="sm:hidden">OK</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                <span className="hidden sm:inline">RIFIUTATA</span>
                                                                <span className="sm:hidden">NO</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Durata */}
                                                <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-300 rounded-xl sm:rounded-2xl font-black text-emerald-800 text-sm sm:text-base md:text-lg shadow-lg inline-flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                                    <span className="truncate">
                            {assenza.durata} {assenza.tipo === 'permesso' ? 'ore' : 'giorni'}
                          </span>
                                                </div>

                                                {/* Motivo */}
                                                {assenza.motivo && (
                                                    <div className="bg-zinc-100/80 border-2 border-zinc-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
                                                        <div className="flex items-start gap-2 sm:gap-3">
                                                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 mt-0.5 shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs sm:text-sm font-bold text-zinc-600 uppercase tracking-wider mb-1">Motivo</p>
                                                                <p className="text-zinc-800 font-medium text-sm sm:text-base md:text-lg break-words">{assenza.motivo}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer modale */}
                        <div className="bg-zinc-100/80 backdrop-blur-xl p-4 sm:p-6 border-t-2 border-zinc-200/50">
                            <button
                                onClick={() => setModalAperto(false)}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl hover:from-emerald-600 hover:to-green-700 shadow-2xl transition-all active:scale-95 mx-auto block"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup nuova richiesta */}
            {popupNuovaRichiesta && !isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-white/95 backdrop-blur-3xl rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-white/70">
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 sm:p-6 md:p-8 flex justify-between items-start gap-3 border-b-4 border-emerald-400/50">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">Nuova Richiesta Assenza</h2>
                                <p className="text-emerald-100 text-sm sm:text-base mt-2">Data: {formattaDataItaliana(giornoSelezionato)}</p>
                            </div>

                            <button
                                onClick={() => setPopupNuovaRichiesta(false)}
                                className="p-2 sm:p-3 hover:bg-white/20 rounded-xl transition-all hover:rotate-90 duration-300 backdrop-blur-xl border border-white/30 shrink-0 active:scale-95"
                            >
                                <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-2">Tipo</label>
                                <select
                                    value={tipoRichiesta}
                                    // @ts-ignore
                                    onChange={(e) => setTipoRichiesta(e.target.value)}
                                    className="w-full p-3 sm:p-4 text-sm sm:text-base border-2 border-zinc-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg"
                                >
                                    <option value="">Seleziona tipo</option>
                                    <option value="ferie">🌴 Ferie</option>
                                    <option value="malattia">🤒 Malattia</option>
                                    <option value="permesso">⏰ Permesso</option>
                                    <option value="smartworking">🏠 Smartworking</option>
                                    <option value="fuori-sede">✈️ Fuori Sede</option>
                                    <option value="congedo-parentale">👶 Congedo Parentale</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-2">
                                    Durata ({tipoRichiesta === 'permesso' ? 'ore' : 'giorni'})
                                </label>
                                <input
                                    type="number"
                                    value={durata}
                                    // @ts-ignore
                                    onChange={(e) => setDurata(e.target.value)}
                                    placeholder="es. 1"
                                    className="w-full p-3 sm:p-4 text-sm sm:text-base border-2 border-zinc-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-2">Motivo (opzionale)</label>
                                <textarea
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    rows={3}
                                    placeholder="Inserisci un motivo..."
                                    className="w-full p-3 sm:p-4 text-sm sm:text-base border-2 border-zinc-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-lg resize-none"
                                />
                            </div>

                            <button
                                onClick={inviaRichiesta}
                                disabled={!tipoRichiesta || !durata}
                                className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl hover:from-emerald-600 hover:to-green-700 shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                Invia Richiesta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
