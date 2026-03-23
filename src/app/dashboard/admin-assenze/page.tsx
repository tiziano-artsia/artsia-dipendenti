'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, User, Calendar, Send, Loader2, Shield, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type Employee = {
    id: number | string;
    name: string;
    team?: string;
    role?: string;
};

export default function AdminAssenze() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        tipo: '',
        dataInizio: '',
        dataFine: '',
        durataOre: '',
        motivo: '',
        target: 'dipendente' as 'dipendente' | 'team' | 'tutti',
        utenteId: '',
        teamId: ''
    });

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token');

                const res = await fetch('/api/employees', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('API error');

                const json = await res.json();
                if (json.success) {
                    setEmployees(json.data);
                } else {
                    toast.error("Errore caricamento dipendenti");
                }
            } catch (err) {
                console.error('Load employees error:', err);
                toast.error("Errore caricamento dipendenti");
            }
            setLoadingEmployees(false);
        };

        loadEmployees();
    }, []);

    const teams = useMemo(() => {
        return [...new Set(employees.map(e => e.team).filter(Boolean))] as string[];
    }, [employees]);

    const isPermesso = form.tipo === 'permesso';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validazione base
        if (!form.tipo || !form.dataInizio) {
            toast.error("Compila tipo e data inizio");
            return;
        }

        // Validazione permessi
        if (isPermesso && (!form.durataOre || parseFloat(form.durataOre) < 0.5)) {
            toast.error("Permesso: minimo 0.5 ore (es. 4.5)");
            return;
        }

        // Validazione altri tipi
        if (!isPermesso && !form.dataFine) {
            toast.error("Inserisci data fine per questo tipo");
            return;
        }

        // Validazione target
        if (form.target === 'dipendente' && !form.utenteId) {
            toast.error("Seleziona un dipendente");
            return;
        }
        if (form.target === 'team' && !form.teamId) {
            toast.error("Seleziona un team");
            return;
        }

        try {
            setSubmitting(true);

            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token');

            const payload: any = {
                tipo: form.tipo,
                dataInizio: form.dataInizio,
                motivo: form.motivo?.trim() || '',
                target: form.target
            };

            // Logica permessi vs giorni
            if (isPermesso) {
                const ore = parseFloat(form.durataOre);
                if (isNaN(ore)) throw new Error('Ore non valide');
                payload.durata = ore;
                payload.dataFine = form.dataInizio; // Permesso = 1 data
            } else {
                payload.dataFine = form.dataFine;
                payload.durata = 1; // Default giorni
            }

            // Target con parseInt sicuro
            if (form.target === 'dipendente' && form.utenteId) {
                payload.employeeId = form.utenteId;
            } else if (form.target === 'team' && form.teamId) {
                payload.teamId = form.teamId;
            } else if (form.target === 'tutti') {
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

            toast.success("✅ Assenza inserita con successo!");

            // Reset completo
            setForm({
                tipo: '',
                dataInizio: '',
                dataFine: '',
                durataOre: '',
                motivo: '',
                target: 'dipendente',
                utenteId: '',
                teamId: ''
            });

        } catch (err: any) {
            console.error('Submit error:', err);
            toast.error(err.message || "Errore inserimento assenza");
        }

        setSubmitting(false);
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
                {/* HEADER */}
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

                {/* FORM */}
                <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-xl border border-white/70 shadow-2xl rounded-3xl p-6 md:p-10 space-y-6 md:space-y-8">

                    {/* TIPO */}
                    <div>
                        <label className="block text-lg md:text-xl font-black text-zinc-700 mb-3 flex items-center gap-2">
                            Tipo assenza <span className="text-emerald-600 font-normal text-sm">*</span>
                        </label>
                        <select
                            value={form.tipo}
                            onChange={e => setForm({ ...form, tipo: e.target.value })}
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

                    {/* DATE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-black text-zinc-700 mb-3">
                                Data inizio <span className="text-emerald-600">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.dataInizio}
                                onChange={e => setForm({ ...form, dataInizio: e.target.value })}
                                className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                required
                            />
                        </div>

                        {/* Data fine (solo non-permesso) */}
                        {!isPermesso && (
                            <div>
                                <label className="block text-lg font-black text-zinc-700 mb-3">
                                    Data fine
                                </label>
                                <input
                                    type="date"
                                    value={form.dataFine}
                                    onChange={e => setForm({ ...form, dataFine: e.target.value })}
                                    min={form.dataInizio || undefined}
                                    className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                />
                            </div>
                        )}
                    </div>

                    {/* ORE PERMESSI */}
                    {isPermesso && (
                        <div className="md:col-span-2">
                            <label className="block text-lg font-black text-zinc-700 mb-3 flex items-center gap-3">
                                <Clock className="w-6 h-6 text-amber-600" />
                                Durata permesso <span className="text-emerald-600">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    max="7"
                                    step="1"
                                    value={form.durataOre}
                                    onChange={e => setForm({ ...form, durataOre: e.target.value })}
                                    placeholder="4.5"
                                    className="w-full p-5 md:p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-xl hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all text-2xl font-mono font-bold text-center tracking-wider"
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-amber-600 font-bold">
                                    ore
                                </div>
                            </div>
                            <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
                                <span>Min 1 • Max 7h • Esempi: 2</span>
                            </p>
                        </div>
                    )}

                    {/* TARGET */}
                    <div>
                        <label className="block text-lg font-black text-zinc-700 mb-3">
                            Assegna a
                        </label>
                        <select
                            value={form.target}
                            onChange={e => {
                                setForm({
                                    ...form,
                                    target: e.target.value as 'dipendente' | 'team' | 'tutti',
                                    utenteId: '',
                                    teamId: ''
                                });
                            }}
                            className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                        >
                            <option value="dipendente">🎯 Singolo dipendente</option>
                            <option value="team">👥 Intero team</option>
                            <option value="tutti">🌐 Tutti i dipendenti</option>
                        </select>
                    </div>

                    {/* DIPENDENTE */}
                    {form.target === 'dipendente' && (
                        <div>
                            <label className="block text-lg font-black text-zinc-700 mb-3">
                                Seleziona dipendente <span className="text-emerald-600">*</span>
                            </label>
                            <select
                                value={form.utenteId}
                                onChange={e => setForm({ ...form, utenteId: e.target.value })}
                                className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                required
                            >
                                <option value="">👤 Scegli un dipendente...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} {emp.team && `(${emp.team})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* TEAM */}
                    {form.target === 'team' && (
                        <div>
                            <label className="block text-lg font-black text-zinc-700 mb-3">
                                Seleziona team <span className="text-emerald-600">*</span>
                            </label>
                            <select
                                value={form.teamId}
                                onChange={e => setForm({ ...form, teamId: e.target.value })}
                                className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg font-semibold"
                                required
                            >
                                <option value="">👥 Scegli un team...</option>
                                {teams.map(team => (
                                    <option key={team} value={team}>
                                        {team} ({employees.filter(e => e.team === team).length} membri)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* MOTIVO */}
                    <div>
                        <label className="block text-lg font-black text-zinc-700 mb-3">
                            Motivo (opzionale)
                        </label>
                        <textarea
                            value={form.motivo}
                            onChange={e => setForm({ ...form, motivo: e.target.value })}
                            rows={3}
                            placeholder="Es. Visita specialistica, riunione cliente esterno, riunione urgente..."
                            className="w-full p-4 md:p-5 rounded-2xl bg-white/80 border-2 border-zinc-200 shadow-xl hover:border-zinc-300 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-500/20 transition-all resize-vertical text-lg font-medium"
                            maxLength={500}
                        />
                        <p className="text-sm text-zinc-500 mt-2 text-right font-mono">
                            {form.motivo.length}/500 caratteri
                        </p>
                    </div>

                    {/* BUTTON SUBMIT */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-16 md:h-20 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600
                                   text-white font-black text-xl md:text-2xl flex items-center justify-center gap-4 shadow-2xl
                                   hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 hover:scale-[1.02]
                                   hover:shadow-3xl active:scale-[0.98] disabled:from-zinc-400 disabled:to-zinc-500
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
