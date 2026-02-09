'use client';

import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import {
    Calendar,
    Clock,
    Home,
    FileText,
    CheckCircle,
    LogOut,
    Briefcase,
    Sun,
    Loader2,
    Plane,
    DollarSign,
    Eye,
    EyeOff,
    Euro,
    Download,
    EuroIcon,
    Lock
} from 'lucide-react';
import { useState } from 'react';
import { useUserPayslips } from '@/hooks/useUserPayslips';

export default function Dashboard() {
    const { user, logout, token } = useAuth();
    const { stats, loading } = useStats();
    const [showPayslips, setShowPayslips] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const isAdmin = user?.role === 'admin';
    const { payslips: userPayslips, loading: loadingUserPayslips } = useUserPayslips();


    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        surname: '',
        team: '',
        role: ''
    });
    const [employeeError, setEmployeeError] = useState('');


    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordError('Le password non coincidono');
            return;
        }
        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    userId: user?.id
                })
            });
            if (response.ok) {
                alert('Password cambiata con successo');
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
            } else {
                const data = await response.json();
                setPasswordError(data.error || 'Errore durante il cambio password');
            }
        } catch (error) {
            setPasswordError('Errore di rete');
        }
    };


    const handleAddEmployee = async () => {
        if (!token) {
            console.error("Token JWT mancante");
            return;
        }

        try {
            const response = await fetch('/api/add-employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newEmployee.name,
                    surname: newEmployee.surname,
                    team: newEmployee.team,
                    role: newEmployee.role
                })
            });

            if (response.ok) {
                alert('Dipendente aggiunto con successo');
                setShowAddEmployeeModal(false);
                setNewEmployee({ name: '', surname: '', team: '', role: 'dipendente' });
            } else {
                const data = await response.json();
                setEmployeeError(data.error || 'Errore durante l\'aggiunta del dipendente');
            }
        } catch (error) {
            setEmployeeError('Errore di rete');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
                <div className="bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl p-8 sm:p-16 shadow-2xl text-center w-full max-w-lg mx-auto border border-white/50">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl sm:rounded-3xl mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-2xl border border-white/30">
                        <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-white animate-spin" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-800 mb-4">
                        Caricamento statistiche...
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 backdrop-blur-xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-4 sm:space-y-6 md:space-y-8">
                {/* Header - Layout modificato per desktop */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/60 hover:shadow-3xl transition-all duration-700">
                    {/* Mobile: tutto in colonna */}
                    <div className="flex flex-col gap-4 sm:gap-6 md:hidden">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border border-white/40 shrink-0">
                                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-zinc-800 to-slate-800 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight">
                                    Dashboard Personale
                                </h1>
                                <p className="text-sm sm:text-lg text-zinc-600 font-light flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <span>Ciao</span>
                                    <span className="font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-none">
                                        {user?.name}
                                    </span>
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/50 backdrop-blur-xl rounded-full text-[10px] sm:text-xs font-mono text-zinc-700 border border-zinc-200 uppercase tracking-wider">
                                        {user?.role}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="flex items-center justify-center gap-2 px-4 py-3 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-2xl hover:shadow-3xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl border border-blue-400/50 w-full active:scale-95"
                            >
                                <Lock className="w-4 h-4" />
                                <span className="whitespace-nowrap">Cambia Password</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 px-4 py-3 h-12 bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-sm rounded-xl shadow-2xl hover:shadow-3xl hover:from-rose-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-rose-500/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl border border-rose-400/50 w-full active:scale-95"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="whitespace-nowrap">Esci</span>
                            </button>
                        </div>
                    </div>

                    {/* Desktop: layout con bottoni a destra allineati */}
                    <div className="hidden md:flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl border border-white/40 shrink-0">
                                <Briefcase className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                            <div>
                                <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-zinc-800 to-slate-800 bg-clip-text text-transparent mb-3 leading-tight">
                                    Dashboard Personale
                                </h1>
                                <p className="text-xl text-zinc-600 font-light flex flex-wrap items-center gap-2">
                                    <span>Ciao</span>
                                    <span className="font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                        {user?.name}
                                    </span>
                                    <span className="px-3 py-1 bg-white/50 backdrop-blur-xl rounded-full text-xs font-mono text-zinc-700 border border-zinc-200 uppercase tracking-wider">
                                        {user?.role}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Bottoni allineati a destra verticalmente */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="flex items-center justify-center gap-3 px-6 py-3 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-2xl hover:shadow-3xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl border border-blue-400/50 whitespace-nowrap"
                            >
                                <Lock className="w-4 h-4" />
                                <span>Cambia Password</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-3 px-6 py-3 h-12 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-sm rounded-2xl shadow-2xl hover:shadow-3xl hover:from-rose-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-rose-500/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl border border-rose-400/50 whitespace-nowrap"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Esci</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modale Cambio Password */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Cambia Password</h3>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password Attuale</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nuova Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Conferma Nuova Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {passwordError && <p className="text-red-500 text-xs sm:text-sm">{passwordError}</p>}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 active:scale-95 transition-transform"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        onClick={handlePasswordChange}
                                        className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
                                    >
                                        Cambia
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Modale Aggiungi Dipendente */}
                {showAddEmployeeModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Aggiungi Dipendente</h3>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <input
                                        type="text"
                                        value={newEmployee.name}
                                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cognome</label>
                                    <input
                                        type="text"
                                        value={newEmployee.surname}
                                        onChange={(e) => setNewEmployee({...newEmployee, surname: e.target.value})}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Team</label>
                                    <select
                                        value={newEmployee.team}
                                        onChange={(e) => setNewEmployee({...newEmployee, team: e.target.value})}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleziona team</option>
                                        <option value="Sviluppo">Sviluppo</option>
                                        <option value="Digital">Digital</option>
                                        {user?.role === 'admin' && <option value="Admin">Admin</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                                    <select
                                        value={newEmployee.role}
                                        onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="dipendente">Dipendente</option>
                                        <option value="manager">Manager</option>
                                        {user?.role === 'admin' && <option value="admin">Admin</option>}
                                    </select>
                                </div>
                                {employeeError && <p className="text-red-500 text-xs sm:text-sm">{employeeError}</p>}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                                    <button
                                        onClick={() => setShowAddEmployeeModal(false)}
                                        className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 active:scale-95 transition-transform"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        onClick={handleAddEmployee}
                                        className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition-transform"
                                    >
                                        Aggiungi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid - 2 colonne su mobile, 4 su desktop */}
                {!isAdmin && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        {[
                            {
                                value: stats.ferie,
                                label: 'Ferie',
                                icon: Plane,
                                color: 'from-orange-500 to-orange-600',
                                unit: 'giorni',
                                bgColor: 'from-orange-100/80 to-orange-50/60'
                            },
                            {
                                value: stats.permessi,
                                label: 'Permessi',
                                icon: Clock,
                                color: 'from-yellow-500 to-amber-600',
                                unit: 'ore',
                                bgColor: 'from-yellow-100/80 to-amber-50/60'
                            },
                            {
                                value: stats.smartworking,
                                label: 'Smartworking',
                                icon: Home,
                                color: 'from-blue-500 to-indigo-600',
                                unit: 'giorni',
                                bgColor: 'from-blue-100/80 to-blue-50/60'
                            },
                            {
                                value: stats.malattia,
                                label: 'Malattia',
                                icon: FileText,
                                color: 'from-rose-500 to-red-600',
                                unit: 'giorni',
                                bgColor: 'from-rose-100/80 to-red-50/60'
                            }
                        ].map(({ value, label, icon: Icon, color, unit, bgColor }) => (
                            <div
                                key={label}
                                className="group bg-white/70 backdrop-blur-3xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 border border-white/50 hover:border-white/70 transition-all duration-500 cursor-pointer relative overflow-hidden active:scale-95"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="relative z-10">
                                    <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-gradient-to-br ${color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white drop-shadow-lg" />
                                    </div>

                                    <h3 className="text-[10px] sm:text-xs md:text-sm font-black text-zinc-600 uppercase tracking-wider mb-1 sm:mb-2 md:mb-3 opacity-90">
                                        {label}
                                    </h3>

                                    <div className="flex items-baseline gap-1 sm:gap-2">
                                        <p className={`text-2xl sm:text-3xl md:text-5xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                                            {value}
                                        </p>
                                    </div>

                                    <p className="text-[9px] sm:text-[10px] md:text-xs text-zinc-500 font-mono tracking-widest uppercase opacity-70 mt-1 sm:mt-2">
                                        {unit}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Buste Paga */}
                {user?.role !== 'admin'  && (
                    <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 md:mb-10 gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-600 shrink-0" />
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent">
                                    Ultime Buste Paga
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowPayslips(!showPayslips)}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300 text-xs sm:text-sm font-mono uppercase tracking-wider active:scale-95 w-full sm:w-auto justify-center"
                                title={showPayslips ? "Nascondi importi" : "Mostra importi"}
                            >
                                {showPayslips ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                <span>{showPayslips ? 'Nascondi' : 'Mostra'}</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {loadingUserPayslips ? (
                                <div className="col-span-full flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-500 mr-2" />
                                    <span className="text-sm sm:text-base">Caricamento buste paga...</span>
                                </div>
                            ) : userPayslips.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-zinc-500 text-sm sm:text-base">
                                    Nessuna busta paga disponibile
                                </div>
                            ) : (
                                userPayslips.slice(0, 3).map((payslip) => (
                                    <a
                                        key={payslip.id}
                                        href={`/api/payslips/${payslip.id}/download`}
                                        className="group relative p-5 sm:p-6 bg-white/90 backdrop-blur-xl border border-zinc-200/50 rounded-xl sm:rounded-2xl hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-400 overflow-hidden flex flex-col active:scale-95"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="relative z-10 flex items-start justify-between mb-2 sm:mb-3">
                                            <h3 className="font-black text-lg sm:text-xl text-zinc-800 group-hover:text-indigo-700">
                                                {payslip.mese
                                                    ? `${payslip.mese.charAt(0).toUpperCase()}${payslip.mese.slice(1)} ${payslip.anno}`
                                                    : (payslip.documentName || `Documento ${payslip.anno}`)
                                                }
                                            </h3>

                                            <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                        </div>

                                        {payslip.netto && (
                                            <p className="text-xl sm:text-2xl font-black text-indigo-600 mb-2">
                                                {showPayslips ? `€${payslip.netto}` : '****'}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-wider">
                                            <span>Scarica PDF</span>
                                            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                        </div>
                                    </a>
                                ))
                            )}
                            <a
                                href="/dashboard/buste-paga"
                                className="group p-5 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl sm:rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-400 flex flex-col items-center justify-center text-center active:scale-95"
                            >
                                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-black text-lg sm:text-xl text-zinc-700 mb-1 sm:mb-2">Vedi Tutte</h3>
                                <p className="text-xs sm:text-sm text-zinc-500">Archivio completo buste paga</p>
                            </a>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-6 sm:mb-8 md:mb-10 bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent">
                        Azioni Rapide
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                        {[
                            ...(!isAdmin ? [{
                                href: '/dashboard/miei-dati',
                                label: 'Le mie Richieste',
                                icon: FileText,
                                color: 'from-blue-500 to-indigo-600',
                                description: 'Gestisci le tue assenze'
                            }] : []),
                            {
                                href: '/dashboard/calendario',
                                label: 'Calendario',
                                icon: Calendar,
                                color: 'from-purple-500 to-violet-600',
                                description: 'Visualizza le date'
                            },
                            ...(isAdmin ? [
                                {
                                    href: '/dashboard/approvazioni',
                                    label: 'Approvazioni',
                                    icon: CheckCircle,
                                    color: 'from-emerald-500 to-green-600',
                                    description: 'Approva richieste'
                                }
                            ]: []),
                           {
                                href: '/dashboard/buste-paga',
                                label: 'Buste Paga - Documenti',
                                icon: EuroIcon,
                                color: 'from-orange-500 to-red-600',
                                description: 'Documenti'
                            }
                        ].map(({ href, label, icon: Icon, color, description }) => (

                            <a
                                key={label}
                                href={href}
                                className="group relative p-5 sm:p-6 md:p-8 bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-2xl sm:rounded-3xl hover:shadow-2xl hover:border-white/90 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col items-center text-center active:scale-95"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                <div className="relative z-10 w-full">
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br ${color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 mx-auto border border-white/50`}>
                                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white drop-shadow-lg" />
                                    </div>

                                    <h3 className="text-base sm:text-lg md:text-xl font-black text-zinc-800 mb-2 sm:mb-3 group-hover:text-zinc-900 transition-colors">
                                        {label}
                                    </h3>

                                    <p className="text-xs sm:text-sm text-zinc-600 font-light mb-3 sm:mb-4">
                                        {description}
                                    </p>

                                    <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono tracking-wider uppercase opacity-75 group-hover:opacity-100 transition-opacity">
                                        <span>Apri</span>
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                        ))}
                        {
                            user?.role === 'manager' || user?.role === 'admin' ? (
                                <div
                                    onClick={() => setShowAddEmployeeModal(true)}
                                    className="group relative p-5 sm:p-6 md:p-8 bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-2xl sm:rounded-3xl hover:shadow-2xl hover:border-white/90 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col items-center text-center cursor-pointer active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                                    <div className="relative z-10 w-full">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 mx-auto border border-white/50">
                                            <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white drop-shadow-lg" />
                                        </div>
                                        <h3 className="text-base sm:text-lg md:text-xl font-black text-zinc-800 mb-2 sm:mb-3 group-hover:text-zinc-900 transition-colors">
                                            Aggiungi Dipendente
                                        </h3>
                                        <p className="text-xs sm:text-sm text-zinc-600 font-light mb-3 sm:mb-4">
                                            Inserisci un nuovo dipendente
                                        </p>
                                        <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono tracking-wider uppercase opacity-75 group-hover:opacity-100 transition-opacity">
                                            <span>Apri</span>
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        }

                    </div>
                </div>
            </div>
        </div>
    );
}
