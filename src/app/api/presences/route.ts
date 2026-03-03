import { NextRequest, NextResponse } from 'next/server';
import {connectDB, EmployeeModel, AbsenceModel, type EmployeeDoc, type Team} from '@/lib/db';
import type {PresenceEmployee} from "@/types";



export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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

            const smartworkingAbsence = todayAbsences.find(abs => abs.type === 'smartworking');
            if (smartworkingAbsence) {
                status = 'smart';
                absenceType = smartworkingAbsence.type;
            } else {
                const otherAbsence = todayAbsences.find(abs =>
                    ['ferie', 'malattia'].includes(abs.type)
                );
                if (otherAbsence) {
                    status = 'assente';
                    absenceType = otherAbsence.type;
                }
                // Se nessuna assenza → ufficio
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
