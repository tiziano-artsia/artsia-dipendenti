import { NextRequest, NextResponse } from 'next/server';
import {connectDB, EmployeeModel, AbsenceModel, type EmployeeDoc} from '@/lib/db';
import type {PresenceEmployee} from "@/types";

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const employees = await EmployeeModel.find({
            role: { $ne: "admin" }
        }).lean<EmployeeDoc[]>();

        const presences: PresenceEmployee[] = [];

        for (const emp of employees) {
            if (emp.fullRemote || emp.team === 'Bottega') continue;

            const todayAbsences = await AbsenceModel.find({
                employeeId: emp.id,
                status: 'approved',
                $expr: {
                    $and: [
                        { $lte: ['$dataInizio', date] },
                        { $gte: ['$dataFine', date] }
                    ]
                }
            }).lean();

            let status: PresenceEmployee['status'] = 'ufficio';
            let absenceType: string | undefined;

            // Priorità: smartworking > ferie/malattia > fuori-sede > ufficio
            const smartworkingAbsence = todayAbsences.find(abs => abs.type === 'smartworking');
            if (smartworkingAbsence) {
                status = 'smart';
                absenceType = smartworkingAbsence.type;
            } else {
                const ferieMalattia = todayAbsences.find(abs =>
                    ['ferie', 'malattia'].includes(abs.type)
                );
                if (ferieMalattia) {
                    status = 'assente';
                    absenceType = ferieMalattia.type;
                } else {
                    const fuoriSedeAbsence = todayAbsences.find(abs => abs.type === 'fuori-sede');
                    if (fuoriSedeAbsence) {
                        status = 'fuori-sede';
                        absenceType = fuoriSedeAbsence.type;
                    }
                    // Altrimenti status = 'ufficio' (default)
                }
            }

            presences.push({
                id: emp.id,
                name: emp.name,
                team: emp.team,
                fullRemote: emp.fullRemote || false,
                status,
                absenceType
            });
        }

        const filteredPresences = presences.filter(p =>
            ['Sviluppo', 'Digital'].includes(p.team)
        );

        return NextResponse.json(filteredPresences);

    } catch (error) {
        console.error('❌ Errore API presences:', error);
        return NextResponse.json(
            { error: 'Errore interno server' },
            { status: 500 }
        );
    }
}