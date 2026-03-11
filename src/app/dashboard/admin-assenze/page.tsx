'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, User, Calendar, Send, Loader2, Shield } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type Employee = {
    id: number;
    name: string;
    team?: string;
};

export default function AdminAssenze() {

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        tipo: '',
        dataInizio: '',
        dataFine: '',
        motivo: '',
        target: 'utente',
        utenteId: '',
        teamId: ''
    });

    useEffect(() => {

        const loadEmployees = async () => {

            try {

                const token = localStorage.getItem('token');

                const res = await fetch('/api/employees', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const json = await res.json();

                if (json.success) {
                    setEmployees(json.data);
                }

            } catch (err) {
                console.error(err);
                toast.error("Errore caricamento dipendenti");
            }

            setLoadingEmployees(false);

        };

        loadEmployees();

    }, []);

    const teams = useMemo(() => {
        return [...new Set(employees.map(e => e.team).filter(Boolean))];
    }, [employees]);

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        if (!form.tipo || !form.dataInizio) {
            toast.error("Compila i campi obbligatori");
            return;
        }

        try {

            setSubmitting(true);

            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/assenze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) throw new Error();

            toast.success("Assenza inserita con successo");

            setForm({
                tipo: '',
                dataInizio: '',
                dataFine: '',
                motivo: '',
                target: 'utente',
                utenteId: '',
                teamId: ''
            });

        } catch {

            toast.error("Errore inserimento");

        }

        setSubmitting(false);

    };

    if (loadingEmployees) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-10">

            <Toaster position="bottom-center"/>

            <div className="max-w-5xl mx-auto space-y-8">

                {/* HEADER */}

                <div className="bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl rounded-3xl p-8 flex items-center gap-6">

                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <Shield className="text-white w-8 h-8"/>
                    </div>

                    <div>
                        <h1 className="text-3xl font-black text-zinc-800">
                            Gestione Assenze
                        </h1>
                        <p className="text-zinc-600">
                            Inserisci assenze direttamente per dipendenti o team
                        </p>
                    </div>

                </div>

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="bg-white/40 backdrop-blur-3xl border border-white/70 shadow-2xl rounded-3xl p-10 space-y-8"
                >

                    {/* tipo */}

                    <div>

                        <label className="font-bold text-zinc-700 mb-2 block">
                            Tipo assenza
                        </label>

                        <select
                            value={form.tipo}
                            onChange={e => setForm({...form, tipo: e.target.value})}
                            className="w-full p-4 rounded-xl bg-white/70 border border-zinc-200 shadow-inner"
                            required
                        >
                            <option value="">Seleziona tipo</option>
                            <option value="ferie">Ferie</option>
                            <option value="malattia">Malattia</option>
                            <option value="permesso">Permesso</option>
                            <option value="smartworking">Smartworking</option>
                            <option value="fuori-sede">Fuori sede</option>
                            <option value="congedo-parentale">Congedo parentale</option>
                        </select>

                    </div>

                    {/* date */}

                    <div className="grid md:grid-cols-2 gap-6">

                        <div>
                            <label className="font-bold text-zinc-700 mb-2 block">
                                Data inizio
                            </label>

                            <input
                                type="date"
                                value={form.dataInizio}
                                onChange={e => setForm({...form, dataInizio: e.target.value})}
                                className="w-full p-4 rounded-xl bg-white/70 border border-zinc-200 shadow-inner"
                                required
                            />
                        </div>

                        <div>
                            <label className="font-bold text-zinc-700 mb-2 block">
                                Data fine
                            </label>

                            <input
                                type="date"
                                value={form.dataFine}
                                onChange={e => setForm({...form, dataFine: e.target.value})}
                                className="w-full p-4 rounded-xl bg-white/70 border border-zinc-200 shadow-inner"
                            />
                        </div>

                    </div>

                    {/* target */}

                    <div>

                        <label className="font-bold text-zinc-700 mb-2 block">
                            Assegna a
                        </label>

                        <select
                            value={form.target}
                            onChange={e => setForm({...form, target: e.target.value})}
                            className="w-full p-4 rounded-xl bg-white/70 border border-zinc-200 shadow-inner"
                        >

                            <option value="utente">Singolo dipendente</option>
                            <option value="team">Team</option>
                            <option value="tutti">Tutti i dipendenti</option>

                        </select>

                    </div>

                    {/* utente */}

                    {form.target === "utente" && (

                        <div>

                            <label className="font-bold text-zinc-700 mb-2 block">
                                Dipendente
                            </label>

                            <select
                                value={form.utenteId}
                                onChange={e => setForm({...form, utenteId: e.target.value})}
                                className="w-full p-4 rounded-xl bg-white/70 border border-zinc-200 shadow-inner"
                            >

                                <option value="">Seleziona dipendente</option>

                                {employees.map(emp => (

                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} {emp.team && `(${emp.team})`}
                                    </option>

                                ))}

                            </select>

                        </div>

                    )}

                    {/* team */}

                    {form.target === "team" && (

                        <div>

                            <label className="font-bold text-zinc-700 mb-2 block">
                                Team
                            </label>

                            <select
                                value={form.teamId}
                                onChange={e => setForm({...form, teamId: e.target.value})}
                                className="w-full p-4 rounded-xl bg-white/70 border border-zinc-200 shadow-inner"
                            >

                                <option value="">Seleziona team</option>

                                {teams.map(team => (

                                    <option key={team} value={team}>
                                        {team}
                                    </option>

                                ))}

                            </select>

                        </div>

                    )}

                    {/* motivo */}

                    <div>

                        <label className="font-bold text-zinc-700 mb-2 block">
                            Motivo
                        </label>

                        <textarea
                            value={form.motivo}
                            onChange={e => setForm({...form, motivo: e.target.value})}
                            rows={3}
                            className="w-full p-4 rounded-xl bg-white/70 border border-zinc-200 shadow-inner"
                        />

                    </div>

                    {/* submit */}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition"
                    >

                        {submitting ? (
                            <Loader2 className="animate-spin w-5 h-5"/>
                        ) : (
                            <Send className="w-5 h-5"/>
                        )}

                        Inserisci assenza

                    </button>

                </form>

            </div>

        </div>
    );
}