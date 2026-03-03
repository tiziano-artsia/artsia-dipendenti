'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { Loader2, Save, Trash2, Edit3, Lock, Users } from 'lucide-react';

export default function ListaDipendenti() {
    const { user } = useAuth();
    const { employees, loading, error, refetch } = useEmployees();

    const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
    const [editedData, setEditedData] = useState<{ [key: number]: any }>({});
    const [saving, setSaving] = useState<{ [key: number]: boolean }>({});

    const formatDateIT = (dateString?: string) => {
        if (!dateString) return 'N/D';
        try {
            return new Date(dateString).toLocaleDateString('it-IT');
        } catch {
            return 'N/D';
        }
    };

    const totals = useMemo(() => {
        return employees.reduce(
            (acc, emp: any) => ({
                costoMensile: acc.costoMensile + (emp.costoMensile || 0),
                costoAnnuale: acc.costoAnnuale + (emp.costoAnnuale || 0),
                costoOrario: acc.costoOrario + (emp.costoOrario || 0),
            }),
            { costoMensile: 0, costoAnnuale: 0, costoOrario: 0 }
        );
    }, [employees]);

    const toggleEdit = useCallback((id: number) => {
        setEditMode(prev => {
            const isEditing = prev[id];
            const newEditMode = { ...prev, [id]: !isEditing };

            if (!isEditing) {
                const emp = employees.find((e: any) => e.id === id);
                if (emp) {
                    const editData = { ...emp };
                    if (emp.dataNascita) {
                        editData.dataNascita = new Date(emp.dataNascita).toISOString().split('T')[0];
                    }
                    setEditedData(prevData => ({ ...prevData, [id]: editData }));
                }
            } else {
                setEditedData(prevData => {
                    const newData = { ...prevData };
                    delete newData[id];
                    return newData;
                });
            }
            return newEditMode;
        });
    }, [employees]);

    const saveEmployee = useCallback(async (id: number) => {
        setSaving(prev => ({ ...prev, [id]: true }));
        try {
            const token = localStorage.getItem('token')!;

            const allowedFields = [
                'dataNascita',      // Date YYYY-MM-DD
                'dataAssunzione',   // Date YYYY-MM-DD
                'inquadramento',
                'mansione',
                'costoMensile',
                'costoAnnuale',
                'costoOrario'
            ];

            const original = editedData[id];
            const dataToSave: any = {};

            for (const key of allowedFields) {
                if (original?.[key] !== undefined && original[key] !== '') {
                    dataToSave[key] = original[key];
                }
            }


            console.log('💾 Save payload:', dataToSave); // DEBUG

            const res = await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSave),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('API Error:', text);
                alert(`Errore ${res.status}: ${text}`);
                return;
            }

            await refetch();
            setEditMode(prev => ({ ...prev, [id]: false }));
            setEditedData(prev => {
                const newData = { ...prev };
                delete newData[id];
                return newData;
            });

        } catch (err) {
            console.error('Errore:', err);
            alert('Errore connessione');
        } finally {
            setSaving(prev => ({ ...prev, [id]: false }));
        }
    }, [editedData, refetch]);

    const updateField = useCallback((id: number, field: string, value: any) => {
        setEditedData(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    }, []);


    const deleteEmployee = useCallback(async (id: number) => {
        if (!confirm('Confermi eliminazione del dipendente?')) return;

        try {
            const token = localStorage.getItem('token')!;
            const res = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                alert('Errore eliminazione');
                return;
            }

            await refetch();

        } catch {
            alert('Errore di connessione');
        }
    }, [refetch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-600 text-center">{error}</div>;
    }

    if (!employees.length) {
        return (
            <div className="text-center py-12">
                <Users className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p>Nessun dipendente presente</p>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl">
                <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                    <table className="w-full table-auto text-sm">
                        <thead>
                        <tr className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
                            <th className="p-4 text-left font-black rounded-l-2xl">Nome</th>
                            <th className="p-4 text-left font-black">Data Nascita</th>
                            <th className="p-4 text-left font-black">Assunzione</th>
                            <th className="p-4 text-left font-black">Inquadramento</th>
                            <th className="p-4 text-left font-black">Mansione</th>
                            <th className="p-4 text-left font-black">Team</th>
                            <th className="p-4 text-right font-black">Mensile (€)</th>
                            <th className="p-4 text-right font-black">Annuale (€)</th>
                            <th className="p-4 text-right font-black">Orario (€)</th>
                            <th className="p-4 text-center font-black rounded-r-2xl">Azioni</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                        {employees.map((emp: any) => (
                            <tr key={emp.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="p-4 font-semibold text-zinc-900">
                                    <div className="flex items-center gap-2">
                                        {editMode[emp.id] && <Lock className="w-4 h-4 text-gray-400" />}
                                        <span className={editMode[emp.id] ? 'text-gray-500 italic' : ''}>{emp.name}</span>
                                    </div>
                                </td>

                                {/* ✅ DATA NASCITA */}
                                <td className="p-4">
                                    {editMode[emp.id] ? (
                                        <input
                                            type="date"
                                            value={editedData[emp.id]?.dataNascita || ''}
                                            onChange={(e) => updateField(emp.id, 'dataNascita', e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-32 p-2 border rounded-lg bg-yellow-50 focus:ring-2 focus:ring-yellow-400"
                                        />
                                    ) : (
                                        formatDateIT(emp.dataNascita)
                                    )}
                                </td>

                                {/* Assunzione */}
                                <td className="p-4">
                                    {editMode[emp.id] ? (
                                        <input
                                            type="date"
                                            value={editedData[emp.id]?.dataAssunzione || ''}
                                            onChange={(e) => updateField(emp.id, 'dataAssunzione', e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-32 p-2 border rounded-lg bg-yellow-50 focus:ring-2 focus:ring-yellow-400"
                                        />
                                    ) : (
                                        formatDateIT(emp.dataAssunzione)
                                    )}
                                </td>

                                {/* Inquadramento */}
                                <td className="p-4">
                                    {editMode[emp.id] ? (
                                        <input
                                            type="text"
                                            value={editedData[emp.id]?.inquadramento || ''}
                                            onChange={(e) => updateField(emp.id, 'inquadramento', e.target.value)}
                                            className="w-28 p-2 border rounded-lg bg-yellow-50 focus:ring-2 focus:ring-yellow-400"
                                        />
                                    ) : (
                                        emp.inquadramento || 'N/D'
                                    )}
                                </td>

                                {/* Mansione */}
                                <td className="p-4">
                                    {editMode[emp.id] ? (
                                        <input
                                            type="text"
                                            value={editedData[emp.id]?.mansione || ''}
                                            onChange={(e) => updateField(emp.id, 'mansione', e.target.value)}
                                            className="w-32 p-2 border rounded-lg bg-yellow-50 focus:ring-2 focus:ring-yellow-400"
                                        />
                                    ) : (
                                        emp.mansione || 'N/D'
                                    )}
                                </td>

                                {/* Team */}
                                <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                            editMode[emp.id]
                                                ? 'bg-gray-100 text-gray-600 ring-2 ring-gray-300'
                                                : emp.team === 'Sviluppo' ? 'bg-blue-100 text-blue-800'
                                                    : emp.team === 'Digital' ? 'bg-purple-100 text-purple-800'
                                                        : emp.team === 'Bottega' ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {editMode[emp.id] && <Lock className="w-3 h-3" />}
                                            {emp.team}
                                        </span>
                                </td>

                                {/* Costi */}
                                <td className="p-4 text-right font-mono">
                                    {editMode[emp.id] ? (
                                        <input type="number" step="100" min="0" value={editedData[emp.id]?.costoMensile || '0'} onChange={(e) => updateField(emp.id, 'costoMensile', parseFloat(e.target.value) || 0)} className="w-24 p-2 border rounded-lg text-right bg-yellow-50 focus:ring-2 focus:ring-yellow-400 font-mono" />
                                    ) : (
                                        `€${(emp.costoMensile || 0).toLocaleString('it-IT')}`
                                    )}
                                </td>
                                <td className="p-4 text-right font-mono">
                                    {editMode[emp.id] ? (
                                        <input type="number" step="1000" min="0" value={editedData[emp.id]?.costoAnnuale || '0'} onChange={(e) => updateField(emp.id, 'costoAnnuale', parseFloat(e.target.value) || 0)} className="w-24 p-2 border rounded-lg text-right bg-yellow-50 focus:ring-2 focus:ring-yellow-400 font-mono" />
                                    ) : (
                                        `€${(emp.costoAnnuale || 0).toLocaleString('it-IT')}`
                                    )}
                                </td>
                                <td className="p-4 text-right font-mono">
                                    {editMode[emp.id] ? (
                                        <input type="number" step="0.01" min="0" value={editedData[emp.id]?.costoOrario || '0'} onChange={(e) => updateField(emp.id, 'costoOrario', parseFloat(e.target.value) || 0)} className="w-20 p-2 border rounded-lg text-right bg-yellow-50 focus:ring-2 focus:ring-yellow-400 font-mono" />
                                    ) : (
                                        `€${(emp.costoOrario || 0).toFixed(2)}`
                                    )}
                                </td>

                                {/* Azioni */}
                                <td className="p-4 text-center">
                                    {editMode[emp.id] ? (
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => saveEmployee(emp.id)} disabled={saving[emp.id]} className="p-2 text-green-600 hover:bg-green-100 rounded-xl disabled:opacity-50" title="Salva">
                                                {saving[emp.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => toggleEdit(emp.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl" title="Annulla">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1 justify-center">
                                            <button onClick={() => toggleEdit(emp.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl" title="Modifica">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-xl" title="Elimina">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                        <tfoot>
                        <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-t-4 border-indigo-200">
                            <td className="p-4 font-black text-xl text-indigo-900">TOTALI</td>
                            <td colSpan={5} />
                            <td className="p-4 text-right font-black text-2xl text-indigo-900">€{totals.costoMensile.toLocaleString('it-IT')}</td>
                            <td className="p-4 text-right font-black text-2xl text-indigo-900">€{totals.costoAnnuale.toLocaleString('it-IT')}</td>
                            <td className="p-4 text-right font-black text-2xl text-indigo-900">€{totals.costoOrario.toFixed(2)}</td>
                            <td />
                        </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-200 text-center hover:shadow-xl transition-all">
                        <p className="text-sm text-indigo-600 font-mono uppercase tracking-wider">Mensile</p>
                        <p className="text-3xl font-black text-indigo-900 mt-2">€{totals.costoMensile.toLocaleString('it-IT')}</p>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 text-center hover:shadow-xl transition-all">
                        <p className="text-sm text-blue-600 font-mono uppercase tracking-wider">Annuale</p>
                        <p className="text-3xl font-black text-blue-900 mt-2">€{totals.costoAnnuale.toLocaleString('it-IT')}</p>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 text-center hover:shadow-xl transition-all">
                        <p className="text-sm text-purple-600 font-mono uppercase tracking-wider">Orario</p>
                        <p className="text-3xl font-black text-purple-900 mt-2">€{totals.costoOrario.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
