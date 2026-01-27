'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { FileText, Euro, Download, Loader2 } from 'lucide-react';
import React from "react";
import { useEmployees } from "@/hooks/useEmployees";

export default function BustePaga() {
    const { user, token } = useAuth();
    const { employees, loading, error } = useEmployees();
    const isAdmin = user?.role === 'admin';
    const [showPayslips, setShowPayslips] = useState(false);
    const [payslips, setPayslips] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [mese, setMese] = useState('');
    const [anno, setAnno] = useState('2026');
    const [netto, setNetto] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loadingPayslips, setLoadingPayslips] = useState(false);
    const selectedEmployeeName = employees.find(emp => emp.id === parseInt(selectedEmployee))?.name || '';

    useEffect(() => {
        const fetchPayslips = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Token mancante');
                return;
            }

            try {
                setLoadingPayslips(true);
                const res = await fetch('/api/payslips', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!res.ok) {
                    console.error('Errore nella risposta:', res.status, res.statusText);
                    return;
                }

                const payslipsData = await res.json();
                setPayslips(Array.isArray(payslipsData.data) ? payslipsData.data : []);
            } catch (err: any) {
                console.error('Errore nel caricamento delle buste paga:', err);
            } finally {
                setLoadingPayslips(false);
            }
        };

        fetchPayslips();
    }, []);

    if (loading) {
        return <div>Caricamento dipendenti...</div>;
    }

    if (error) {
        return <div>Errore: {error}</div>;
    }

    const handleUpload = async () => {
        if (!selectedEmployee || !mese || !anno || !selectedFile || !netto) {
            alert('Completa tutti i campi');
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token mancante');
            return;
        }

        setLoadingPayslips(true);
        try {
            const formData = new FormData();
            formData.append('employeeId', selectedEmployee);
            formData.append('employeeName', selectedEmployeeName);
            formData.append('mese', mese);
            formData.append('anno', anno);
            formData.append('netto', netto);
            formData.append('file', selectedFile);

            await fetch('/api/payslips', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            alert('Busta paga caricata con successo');
            // Ricarica la lista buste paga
            const payslipsRes = await fetch('/api/payslips');
            const payslipsData = await payslipsRes.json();
            setPayslips(payslipsData);
        } catch (error) {
            alert('Errore nel caricamento');
        } finally {
            setLoadingPayslips(false);
        }
    };

    // Raggruppa le buste paga per mese e anno
    const groupedPayslips = payslips.reduce((acc, payslip) => {
        // @ts-ignore
        const key = `${payslip.mese}-${payslip.anno}`;

        // @ts-ignore
        if (!acc[key]) {
            // @ts-ignore
            acc[key] = [];
        }
        // @ts-ignore
        acc[key].push(payslip);
        return acc;
    }, {});

    // @ts-ignore
    // @ts-ignore
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-800 to-slate-700 bg-clip-text text-transparent">
                    Archivio Buste Paga
                </h1>

                {/* Sezione Caricamento (solo admin) */}
                {isAdmin && (
                    <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-8 border border-white/70 hover:shadow-3xl transition-all duration-700">
                        <h2 className="text-2xl font-bold mb-6 text-zinc-800">Carica Nuova Busta Paga</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Dipendente</label>
                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white/80 backdrop-blur-xl"
                                >
                                    <option value="">Seleziona dipendente</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Mese</label>
                                <select
                                    value={mese}
                                    onChange={(e) => setMese(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white/80 backdrop-blur-xl"
                                >
                                    <option value="">Seleziona mese</option>
                                    <option value="gennaio">Gennaio</option>
                                    <option value="febbraio">Febbraio</option>
                                    <option value="marzo">Marzo</option>
                                    <option value="aprile">Aprile</option>
                                    <option value="maggio">Maggio</option>
                                    <option value="giugno">Giugno</option>
                                    <option value="luglio">Luglio</option>
                                    <option value="agosto">Agosto</option>
                                    <option value="settembre">Settembre</option>
                                    <option value="ottobre">Ottobre</option>
                                    <option value="novembre">Novembre</option>
                                    <option value="dicembre">Dicembre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Anno</label>
                                <select
                                    value={anno}
                                    onChange={(e) => setAnno(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white/80 backdrop-blur-xl"
                                >
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                    <option value="2027">2027</option>
                                    <option value="2028">2028</option>
                                    <option value="2029">2029</option>
                                    <option value="2030">2030</option>
                                    <option value="2031">2031</option>
                                    <option value="2032">2032</option>
                                    <option value="2033">2033</option>
                                    <option value="2034">2034</option>
                                    <option value="2035">2035</option>
                                    <option value="2036">2036</option>
                                    <option value="2037">2037</option>
                                    <option value="2038">2038</option>
                                    <option value="2039">2039</option>
                                    <option value="2040">2040</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Netto</label>
                                <input
                                    type="text"
                                    value={netto}
                                    onChange={(e) => setNetto(e.target.value)}
                                    placeholder="€1000"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white/80 backdrop-blur-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">File PDF</label>
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white/80 backdrop-blur-xl"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Carica Busta Paga
                        </button>
                    </div>
                )}

                {/* Tabella Buste Paga */}
                <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-8 border border-white/70 hover:shadow-3xl transition-all duration-700">
                    <h2 className="text-2xl font-bold mb-6 text-zinc-800">Buste Paga Disponibili</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow-md">
                            <thead>
                            <tr className="bg-indigo-500 text-white">
                                <th className="py-3 px-4 text-left">Mese-Anno</th>
                                <th className="py-3 px-4 text-left">Dipendente</th>
                                <th className="py-3 px-4 text-left">Azione</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(groupedPayslips).map(([key, payslipList]:any) => (
                                <React.Fragment key={key}>
                                    <tr className="bg-gray-100">
                                        <td colSpan={4} className="py-2 px-4 font-bold text-zinc-800">
                                            {key}
                                        </td>
                                    </tr>
                                    {payslipList.map((payslip:any) => (
                                        <tr key={payslip.id} className="hover:bg-indigo-50">
                                            <td className="py-2 px-4">{payslip.meseAnno?.toLowerCase() || ''}</td>
                                            <td className="py-2 px-4">{payslip.dipendente || ''}</td>
                                            <td className="py-2 px-4">
                                                <a
                                                    href={`/api/payslips/${payslip.id}/download?token=${token}`}
                                                    download={`busta-paga-${payslip.meseAnno?.toLowerCase().replace(' ', '-') || ''}.pdf`}
                                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Scarica
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
