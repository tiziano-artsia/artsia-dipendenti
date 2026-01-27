'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const [email, setEmail] = useState('admin@azienda.it');
    const [password, setPassword] = useState('admin123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        /*
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success && data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log(data.user);
                login(data.user, data.token);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Credenziali non valide');
            }
        } catch (err: any) {
            setError('Errore connessione');
        } finally {
            setLoading(false);
        }*/
       return;
    };

    return (
        <div className="min-h-screen bg-zinc-900/30 backdrop-blur-3xl flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-zinc-900/20 to-black/10" />

            <div className="w-full max-w-sm relative z-10">
                {/* Card Liquid Glass */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 group">
                    {/* Logo subtle */}
                    <div className="w-20 h-20 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl mx-auto mb-8 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <span className="text-3xl">📊</span>
                    </div>

                    {/* Title minimal */}
                    <h1 className="text-3xl font-light tracking-wide text-white/95 text-center mb-2 leading-tight">
                        Gestione
                    </h1>
                    <p className="text-white/60 text-sm text-center font-light tracking-wider uppercase mb-12">
                        Dipendenti
                    </p>
                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-xl text-red-100 p-4 rounded-2xl mb-8 text-center text-sm font-medium border-opacity-50">
                            {error}
                        </div>
                    )}

                    {/* Form ultra minimal */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="w-full h-14 px-5 py-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg text-white/95 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:border-white/30 hover:bg-white/15 peer"
                                placeholder="Email aziendale"
                                required
                            />
                            <span className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 pointer-events-none transition-all duration-300 peer-focus:opacity-0" />
                        </div>

                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="w-full h-14 px-5 py-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg text-white/95 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:border-white/30 hover:bg-white/15 peer"
                                placeholder="Password"
                                required
                            />
                            <span className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 pointer-events-none transition-all duration-300 peer-focus:opacity-0" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg font-light tracking-wide text-white/95 shadow-2xl hover:shadow-3xl hover:from-white/30 hover:to-white/20 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-500 hover:-translate-y-0.5 transform group/button disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Accesso...
                                </>
                            ) : (
                                'Accedi'
                            )}
                        </button>
                    </form>

                    {/* Demo ultra minimal */}
                    <div className="mt-12 pt-8 border-t border-white/10">
                        <p className="text-xs text-white/40 text-center font-mono tracking-widest uppercase mb-3">
                            Demo
                        </p>
                        <div className="text-xs text-white/50 space-y-1 text-center font-mono tracking-wide">
                            <div>admin@azienda.it <span className="text-white/70">/</span> admin123</div>
                            <div>marco.rossi@azienda.it <span className="text-white/70">/</span> pass123</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
