'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Biometrics } from '@capacitor/biometrics';
import { Capacitor } from '@capacitor/core';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    // ✅ Controlla disponibilità Face ID/Touch ID
    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const result = await Biometrics.isAvailable();
            setBiometricAvailable(result.isAvailable);

            // Se ha già fatto login prima, prova auto-login con Face ID
            const savedEmail = localStorage.getItem('lastEmail');
            if (savedEmail && result.isAvailable) {
                setEmail(savedEmail);
            }
        } catch (error) {
            console.error('Biometric check error:', error);
        }
    };

    // ✅ Login con Face ID
    const handleBiometricLogin = async () => {
        setLoading(true);
        setError('');

        try {
            // Autentica con Face ID/Touch ID
            await Biometrics.verify({
                reason: 'Accedi con Face ID',
                title: 'Autenticazione',
                subtitle: 'Gestione Dipendenti',
                cancelTitle: 'Annulla'
            });

            // Recupera credenziali salvate (devi salvarle in modo sicuro!)
            const savedToken = localStorage.getItem('biometric_token');
            const savedUser = localStorage.getItem('biometric_user');

            if (savedToken && savedUser) {
                const user = JSON.parse(savedUser);
                localStorage.setItem('token', savedToken);
                localStorage.setItem('user', savedUser);
                login(user, savedToken);
                router.push('/dashboard');
            } else {
                setError('Credenziali non trovate. Effettua login con email/password');
            }
        } catch (error: any) {
            setError('Autenticazione biometrica fallita');
            console.error('Biometric auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    //  Login tradizionale
    const handleSubmit = async (e: React.FormEvent) => {
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

                // ✅ Salva per Face ID futuro (ATTENZIONE: usa storage sicuro in produzione!)
                localStorage.setItem('biometric_token', data.token);
                localStorage.setItem('biometric_user', JSON.stringify(data.user));
                localStorage.setItem('lastEmail', email);

                login(data.user, data.token);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Credenziali non valide');
            }
        } catch (err: any) {
            setError('Errore connessione');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900/30 backdrop-blur-3xl flex items-center justify-center p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-zinc-900/20 to-black/10" />

            <div className="w-full max-w-sm relative z-10">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 group">
                    {/* Logo */}
                    <div className="w-20 h-20 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl mx-auto mb-8 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <img
                            src="https://www.artsia.it/assets/images/logos/logo-artsia.svg"
                            alt="Artsia Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <h1 className="text-3xl font-light tracking-wide text-white/95 text-center mb-2 leading-tight">
                        Gestione
                    </h1>
                    <p className="text-white/60 text-sm text-center font-light tracking-wider uppercase mb-12">
                        Dipendenti
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-xl text-red-100 p-4 rounded-2xl mb-8 text-center text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* ✅ Bottone Face ID (se disponibile) */}
                    {biometricAvailable && (
                        <button
                            type="button"
                            onClick={handleBiometricLogin}
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 rounded-2xl text-lg font-light text-white/95 shadow-2xl hover:shadow-3xl hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-500 mb-6 flex items-center justify-center gap-3 disabled:opacity-40"
                        >
                            <span className="text-2xl">🔐</span>
                            Accedi con Face ID
                        </button>
                    )}

                    {/* Separatore */}
                    {biometricAvailable && (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-white/40 text-xs uppercase tracking-widest">oppure</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>
                    )}

                    {/* Form tradizionale */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="w-full h-14 px-5 py-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg text-white/95 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                                placeholder="Email aziendale"
                                required
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="w-full h-14 px-5 py-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg text-white/95 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                                placeholder="Password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-lg font-light text-white/95 shadow-2xl hover:shadow-3xl hover:from-white/30 hover:to-white/20 transition-all duration-500 flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-40"
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
                </div>
            </div>
        </div>
    );
}
