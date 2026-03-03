import { NextRequest, NextResponse } from 'next/server';
import {connectDB, EmployeeModel, AbsenceModel, type EmployeeDoc, type Team} from '@/lib/db';

// Interfacce per il frontend
export interface PresenceEmployee {
    id: number;
    name: string;
    surname?: string; // Aggiungi se presente nel tuo schema
    team: Team;
    fullRemote: boolean;
    status: 'smart' | 'ufficio' | 'assente';
    absenceType?: string;
}

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

            const smartworkingAbsence = await AbsenceModel.findOne({
                employeeId: emp.id,
                type: 'smartworking',
                status: 'approved',
                $expr: {
                    $and: [
                        { $lte: ['$dataInizio', date] },  // dataInizio <= oggi
                        { $gte: ['$dataFine', date] }     // dataFine >= oggi
                    ]
                }
            }).lean();



            const status: PresenceEmployee['status'] = smartworkingAbsence ? 'smart' : 'ufficio';

            presences.push({
                id: emp.id,
                name: emp.name,
                team: emp.team,
                fullRemote: emp.fullRemote || false,
                status,
                absenceType: smartworkingAbsence?.type
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
