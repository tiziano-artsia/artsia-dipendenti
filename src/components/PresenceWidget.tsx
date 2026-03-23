'use client';

import {useEffect, useState} from 'react';
import { ChevronLeft, ChevronRight, Home, Building2, Loader2, Calendar } from 'lucide-react';
import { format, addDays, subDays, isSaturday, isSunday, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import useDailyPresences from '@/hooks/useDailyPresences';

const PresenceWidget: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const { smart, office, loading, assente , fuoriSede } = useDailyPresences(dateString);

    const prevDay = (): void => {
        let newDate = subDays(selectedDate, 1);
        // Skip weekend andando indietro
        while (isSaturday(newDate) || isSunday(newDate)) {
            newDate = subDays(newDate, 1);
        }
        setSelectedDate(newDate);
    };

    const nextDay = (): void => {
        let newDate = addDays(selectedDate, 1);
        // Skip weekend andando avanti
        while (isSaturday(newDate) || isSunday(newDate)) {
            newDate = addDays(newDate, 1);
        }
        setSelectedDate(newDate);
    };

    useEffect(() => {
        const today = new Date();

        if (isSaturday(today) || isSunday(today)) {
            let workDay = today;

            while (isSaturday(workDay) || isSunday(workDay)) {
                workDay = subDays(workDay, 1);
            }

            setSelectedDate(workDay);
        }
    }, []);

    const getItalianDate = (date: Date): string => {
        const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const months = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

        const dayName = days[date.getDay()];
        const dayNum = date.getDate();
        const monthName = months[date.getMonth() + 1];
        const year = date.getFullYear();

        return `${dayName} ${dayNum} ${monthName} ${year}`;
    };


    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border border-white/70 col-span-full">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mr-3" />
                    <span className="text-lg text-zinc-600 font-medium">Caricamento presenze...</span>
                </div>
            </div>
        );
    }



    // Nascondi se weekend
    if (isSaturday(selectedDate) || isSunday(selectedDate)) {
        return (
            <div className="bg-gradient-to-br from-orange-50/80 to-yellow-50/80 backdrop-blur-xl rounded-3xl p-10 md:p-12 shadow-2xl border border-orange-200/50 text-center col-span-full">
                <Calendar className="w-20 h-20 mx-auto mb-6 text-orange-500 opacity-60" />
                <h2 className="text-3xl md:text-4xl font-black text-zinc-800 mb-4">
                    Weekend
                </h2>
                <p className="text-xl text-zinc-600 font-medium mb-8 max-w-md mx-auto">
                    Presenze disponibili solo nei giorni lavorativi (lun-ven)
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={prevDay}
                        className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:bg-emerald-600 transition-all active:scale-95"
                    >
                        Lunedì Precedente
                    </button>
                    <button
                        onClick={nextDay}
                        className="px-8 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:bg-blue-600 transition-all active:scale-95"
                    >
                        Lunedì Successivo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-3xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/70 hover:shadow-3xl transition-all duration-700 col-span-full">
            {/* Header con navigazione + info giorno - MOBILE PERFECT */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 gap-3 sm:gap-4 px-1 sm:px-0">
                <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* Prev Button - Fisso mobile */}
                    <button
                        onClick={prevDay}
                        className="p-2 sm:p-2.5 rounded-2xl bg-white/60 hover:bg-white/90 hover:shadow-md transition-all border border-zinc-200/80 active:scale-95 flex-shrink-0 hover:scale-105"
                        aria-label="Giorno lavorativo precedente"
                        title="Giorno lavorativo precedente"
                    >
                        <ChevronLeft className="w-5 h-5 text-zinc-700" />
                    </button>

                    {/* Data Centrale - Responsive perfetta */}
                    <div className="text-center flex-1 px-2 sm:px-4 min-w-0">
                        <h2 className="sm:d-none  sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-zinc-800 via-zinc-700 to-slate-800 bg-clip-text text-transparent truncate leading-tight px-1 sm:px-2">
                           {getItalianDate(selectedDate)}
                        </h2>
                    </div>

                    {/* Next Button - Fisso mobile */}
                    <button
                        onClick={nextDay}
                        className="p-2 sm:p-2.5 rounded-2xl bg-white/60 hover:bg-white/90 hover:shadow-md transition-all border border-zinc-200/80 active:scale-95 flex-shrink-0 hover:scale-105"
                        aria-label="Giorno lavorativo successivo"
                        title="Giorno lavorativo successivo"
                    >
                        <ChevronRight className="w-5 h-5 text-zinc-700" />
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Smartworking */}
                <div className="group bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-blue-200/50 hover:border-blue-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Home className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-zinc-800 mb-1">Smart</h3>
                            <p className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                {smart.length}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100 pr-2">
                        {smart.length === 0 ? (
                            <p className="text-zinc-500 italic text-sm py-6 text-center bg-white/50 rounded-2xl p-4">Nessuno in smart oggi</p>
                        ) : (
                            smart.slice(0, 8).map((emp: any) => (
                                <div key={emp.id} className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/90 rounded-2xl text-sm transition-all hover:shadow-md">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
                                    <span className="font-medium text-zinc-800 truncate">{emp.name}</span>
                                    {emp.surname && <span className="text-zinc-500">({emp.surname})</span>}
                                </div>
                            ))
                        )}
                        {smart.length > 8 && <p className="text-xs text-zinc-500 text-center pt-2">+{smart.length - 8} altri</p>}
                    </div>
                </div>

                {/* Ufficio */}
                <div className="group bg-gradient-to-br from-emerald-50/80 to-green-50/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-emerald-200/50 hover:border-emerald-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Building2 className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-zinc-800 mb-1">Ufficio</h3>
                            <p className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                {office.length}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100 pr-2">
                        {office.length === 0 ? (
                            <p className="text-zinc-500 italic text-sm py-6 text-center bg-white/50 rounded-2xl p-4">Ufficio vuoto oggi</p>
                        ) : (
                            office.slice(0, 8).map((emp: any) => (
                                <div key={emp.id} className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/90 rounded-2xl text-sm transition-all hover:shadow-md">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0" />
                                    <span className="font-medium text-zinc-800 truncate">{emp.name}</span>
                                    {emp.surname && <span className="text-zinc-500">({emp.surname})</span>}
                                </div>
                            ))
                        )}
                        {office.length > 8 && <p className="text-xs text-zinc-500 text-center pt-2">+{office.length - 8} altri</p>}
                    </div>
                </div>

                {/* Fuori sede */}
                {fuoriSede.length > 0 && (
                    <div className="group bg-gradient-to-br from-orange-50/80 to-amber-50/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-orange-200/50 hover:border-orange-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Calendar className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-zinc-800 mb-1">Fuori sede</h3>
                                <p className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                                    {fuoriSede.length}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100 pr-2">
                            {fuoriSede.slice(0, 8).map((emp) => (
                                <div
                                    key={emp.id}
                                    className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/90 rounded-2xl text-sm transition-all hover:shadow-md"
                                >
                                    <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0" />
                                    <span className="font-medium text-zinc-800 truncate">{emp.name}</span>
                                </div>
                            ))}
                            {fuoriSede.length > 8 && (
                                <p className="text-xs text-zinc-500 text-center pt-2">
                                    +{fuoriSede.length - 8} altri
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Assenti */}
                {assente.length > 0 && (
                    <div className="group bg-gradient-to-br from-orange-50/80 to-amber-50/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-orange-200/50 hover:border-orange-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Calendar className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-zinc-800 mb-1">Assenti</h3>
                                <p className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                                    {assente.length}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100 pr-2">
                            {assente.length === 0 ? (
                                <p className="text-zinc-500 italic text-sm py-6 text-center bg-white/50 rounded-2xl p-4">Tutti in presenza oggi</p>
                            ) : (
                                assente.slice(0, 8).map((emp: any) => (
                                    <div key={emp.id} className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/90 rounded-2xl text-sm transition-all hover:shadow-md">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0" />
                                        <span className="font-medium text-zinc-800 truncate">{emp.name}</span>
                                        {emp.surname && <span className="text-zinc-500">({emp.surname})</span>}
                                    </div>
                                ))
                            )}
                            {assente.length > 8 && <p className="text-xs text-zinc-500 text-center pt-2">+{assente.length - 8} altri</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PresenceWidget;
