'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send, Loader2, Shield, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type Employee = {
    id: number | string;
    name: string;
    team?: string;
    role?: string;
};

type TargetType = 'dipendente' | 'team' | 'tutti';

type FormState = {
    tipo: string;
    dataInizio: string;
    dataFine: string;
    durataOre: string;
    motivo: string;
    target: TargetType;
    utenteId: string;
    teamId: string;
};

const initialForm: FormState = {
    tipo: '',
    dataInizio: '',
    dataFine: '',
    durataOre: '',
    motivo: '',
    target: 'dipendente',
    utenteId: '',
    teamId: ''
};

const diffDaysInclusive = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

export default function AdminAssenze() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<FormState>(initialForm);

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token');

                const res = await fetch('/api/employees', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('API error');

                const json = await res.json();

                if (json.success) {
                    setEmployees(Array.isArray(json.data) ? json.data : []);
                } else {
                    toast.error('Errore caricamento dipendenti');
                }
            } catch (err) {
                console.error('Load employees error:', err);
                toast.error('Errore caricamento dipendenti');
            } finally {
                setLoadingEmployees(false);
            }
        };

        loadEmployees();
    }, []);

    const teams = useMemo(() => {
        return [...new Set(employees.map((e) => e.team).filter(Boolean))] as string[];
    }, [employees]);

    const isPermesso = form.tipo === 'permesso';

    const handleTipoChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            tipo: value,
            dataFine: value === 'permesso' ? '' : prev.dataFine,
            durataOre: value === 'permesso' ? prev.durataOre : '',
        }));
    };

    const handleTargetChange = (value: TargetType) => {
        setForm((prev) => ({
            ...prev,
            target: value,
            utenteId: '',
            teamId: ''
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.tipo || !form.dataInizio) {
            toast.error('Compila tipo e data inizio');
            return;
        }

        if (isPermesso) {
            const ore = parseFloat(form.durataOre);

            if (!form.durataOre || Number.isNaN(ore) || ore < 0.5) {
                toast.error('Permesso: minimo 0.5 ore (es. 4.5)');
                return;
            }

            if (ore > 8) {
                toast.error('Permesso: massimo 8 ore');
                return;
            }
        } else {
            if (!form.dataFine) {
                toast.error('Inserisci data fine per questo tipo');
                return;
            }

            if (form.dataFine < form.dataInizio) {
                toast.error('La data fine non può essere prima della data inizio');
                return;
            }
        }

        if (form.target === 'dipendente' && !form.utenteId) {
            toast.error('Seleziona un dipendente');
            return;
        }

        if (form.target === 'team' && !form.teamId) {
            toast.error('Seleziona un team');
            return;
        }

        try {
            setSubmitting(true);

            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token');

            const payload: Record<string, any> = {
                tipo: form.tipo,
                dataInizio: form.dataInizio,
                motivo: form.motivo.trim(),
                target: form.target
            };

            if (isPermesso) {
                const ore = parseFloat(form.durataOre);

                payload.durata = ore;
                payload.dataFine = form.dataInizio;
            } else {
                const durataGiorni = diffDaysInclusive(form.dataInizio, form.dataFine);

                if (!Number.isFinite(durataGiorni) || durataGiorni <= 0) {
                    throw new Error('Intervallo date non valido');
                }

                payload.dataFine = form.dataFine;
                payload.durata = durataGiorni;
            }

            if (form.target === 'dipendente') {
                payload.employeeId = form.utenteId;
            } else if (form.target === 'team') {
                payload.teamId = form.teamId;
            } else {
                payload.target = 'tutti';
            }

            const res = await fetch('/api/admin/assenze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (!res.ok) {
                console.error('Backend error:', json);
                throw new Error(json.error || json.details || 'Errore server');
            }

            toast.success('✅ Assenza inserita con successo!');
            setForm(initialForm);
        } catch (err: any) {
            console.error('Submit error:', err);
            toast.error(err.message || 'Errore inserimento assenza');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingEmployees) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-lg text-zinc-600">Caricamento dipendenti...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6 md:p-10">
            <Toaster position="bottom-center" reverseOrder={false} />

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white/50 backdrop-blur-xl border border-white/70 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                        <Shield className="text-white w-7 h-7 md:w-8 md:h-8" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-zinc-800 leading-tight">
                            Gestione Assenze Admin
                        </h1>
                        <p className="text-zinc-600 mt-1 text-sm md:text-base">
                            Crea assenze per singoli, team o tutti i dipendenti
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white/50 backdrop-blur-xl border border-white/70 shadow-2xl rounded-3xl p-6 md:p-10 space-y-6 md:space-y-8"
                >
                    <div>
                        <label className="block text-lg md:text-xl font-black text-zinc-700 mb-3 flex items-center gap-2">
                            Tipo assenza <span className="text-emerald-600 font-normal text-sm">*</span>
                        </label>

                        <select
                            value={form.tipo}
                            onChange={(e) => handleTipoChange(e.target.value)}
                            className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                            required
                        >
                            <option value="">📋 Seleziona tipo assenza</option>
                            <option value="ferie">☀️ Ferie</option>
                            <option value="malattia">🤒 Malattia</option>
                            <option value="permesso">⏰ Permesso (ore)</option>
                            <option value="smartworking">🏠 Smartworking</option>
                            <option value="fuori-sede">📍 Fuori sede</option>
                            <option value="festivita">🎉 Festività</option>
                            <option value="congedo-parentale">👨‍👩‍👧 Congedo parentale</option>
                            <option value="maternita">🤰 Maternità</option>
                            <option value="congedo-matrimoniale">💒 Congedo matrimoniale</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-black text-zinc-700 mb-3">
                                Data inizio <span className="text-emerald-600">*</span>
                            </label>

                            <input
                                type="date"
                                value={form.dataInizio}
                                onChange={(e) =>
                                    setForm((prev) => {
                                        const nextStart = e.target.value;
                                        const nextEnd =
                                            !isPermesso && prev.dataFine && prev.dataFine < nextStart
                                                ? nextStart
                                                : prev.dataFine;

                                        return {
                                            ...prev,
                                            dataInizio: nextStart,
                                            dataFine: nextEnd
                                        };
                                    })
                                }
                                className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                required
                            />
                        </div>

                        {!isPermesso && (
                            <div>
                                <label className="block text-lg font-black text-zinc-700 mb-3">
                                    Data fine <span className="text-emerald-600">*</span>
                                </label>

                                <input
                                    type="date"
                                    value={form.dataFine}
                                    onChange={(e) => setForm((prev) => ({ ...prev, dataFine: e.target.value }))}
                                    min={form.dataInizio || undefined}
                                    className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                    required={!isPermesso}
                                />
                            </div>
                        )}
                    </div>

                    {isPermesso && (
                        <div className="md:col-span-2">
                            <label className="block text-lg font-black text-zinc-700 mb-3 flex items-center gap-3">
                                <Clock className="w-6 h-6 text-amber-600" />
                                Durata permesso <span className="text-emerald-600">*</span>
                            </label>

                            <div className="relative">
                                <input
                                    type="number"
                                    min="0.5"
                                    max="8"
                                    step="0.5"
                                    value={form.durataOre}
                                    onChange={(e) => setForm((prev) => ({ ...prev, durataOre: e.target.value }))}
                                    placeholder="4.5"
                                    className="w-full p-5 md:p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-xl hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all text-2xl font-mono font-bold text-center tracking-wider"
                                    required={isPermesso}
                                />

                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-amber-600 font-bold">
                                    ore
                                </div>
                            </div>

                            <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
                                <span>Min 0.5 • Max 8h • Esempi: 2, 4.5</span>
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-lg font-black text-zinc-700 mb-3">
                            Assegna a
                        </label>

                        <select
                            value={form.target}
                            onChange={(e) => handleTargetChange(e.target.value as TargetType)}
                            className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                        >
                            <option value="dipendente">🎯 Singolo dipendente</option>
                            <option value="team">👥 Intero team</option>
                            <option value="tutti">🌐 Tutti i dipendenti</option>
                        </select>
                    </div>

                    {form.target === 'dipendente' && (
                        <div>
                            <label className="block text-lg font-black text-zinc-700 mb-3">
                                Seleziona dipendente <span className="text-emerald-600">*</span>
                            </label>

                            <select
                                value={form.utenteId}
                                onChange={(e) => setForm((prev) => ({ ...prev, utenteId: e.target.value }))}
                                className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                required={form.target === 'dipendente'}
                            >
                                <option value="">👤 Scegli un dipendente...</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={String(emp.id)}>
                                        {emp.name} {emp.team && `(${emp.team})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {form.target === 'team' && (
                        <div>
                            <label className="block text-lg font-black text-zinc-700 mb-3">
                                Seleziona team <span className="text-emerald-600">*</span>
                            </label>

                            <select
                                value={form.teamId}
                                onChange={(e) => setForm((prev) => ({ ...prev, teamId: e.target.value }))}
                                className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                required={form.target === 'team'}
                            >
                                <option value="">👥 Scegli un team...</option>
                                {teams.map((team) => (
                                    <option key={team} value={team}>
                                        {team} ({employees.filter((e) => e.team === team).length} membri)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-lg font-black text-zinc-700 mb-3">
                            Motivo (opzionale)
                        </label>

                        <textarea
                            value={form.motivo}
                            onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))}
                            rows={3}
                            placeholder="Es. Visita specialistica, riunione cliente esterno, riunione urgente..."
                            className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-zinc-300 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-500/20 transition-all resize-y text-lg font-medium"
                            maxLength={500}
                        />

                        <p className="text-sm text-zinc-500 mt-2 text-right font-mono">
                            {form.motivo.length}/500 caratteri
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-16 md:h-20 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600
                                   text-white font-black text-xl md:text-2xl flex items-center justify-center gap-4 shadow-2xl
                                   hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 hover:scale-[1.02]
                                   active:scale-[0.98] disabled:from-zinc-400 disabled:to-zinc-500
                                   disabled:scale-100 disabled:shadow-lg disabled:cursor-not-allowed transition-all duration-300
                                   group relative overflow-hidden"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin" />
                                <span className="tracking-wide">Inserimento in corso...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-7 h-7 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform duration-300" />
                                <span className="tracking-wide">Inserisci assenza ora</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}