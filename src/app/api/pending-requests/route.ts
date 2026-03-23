import { NextRequest, NextResponse } from 'next/server';
import { EmployeeModel, AbsenceModel } from '@/lib/db';
import jwt from 'jsonwebtoken';
import type { ObjectId } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET!;

interface PopulatedAbsence {
    _id: ObjectId;
    employeeId: {
        _id: ObjectId;
        nome: string;
        email: string;
        team?: string;
    };
    type: string;
    dataInizio: string | Date;
    durata: number;
    status: string;
    motivo?: string;
}

interface PendingRequest {
    id: string;
    employeeId: string;
    dipendente: string;
    team: string;
    tipo: string;
    data: string;
    durata: string;
    stato: string;
    motivo?: string;
}

export async function GET(request: NextRequest) {
    try {
        // Auth
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role === 'dipendente') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        // Query PENDING + populate
        const absences: PopulatedAbsence[] = await AbsenceModel.find({
            status: 'pending',
            type: { $in: ['ferie', 'permesso', 'smartworking', 'fuori-sede'] } // + nuovi tipi
        })
            .populate('employeeId', 'nome email team')
            .lean();

        // Format response
        const formatted: PendingRequest[] = absences.map((abs) => ({
            id: abs._id!.toString(),
            employeeId: abs.employeeId._id!.toString(),
            dipendente: abs.employeeId.nome,
            team: abs.employeeId.team || 'Sviluppo',
            tipo: abs.type === 'smartworking' ? 'Smartworking' :
                abs.type === 'fuori-sede' ? 'Fuori Sede' :
                    abs.type === 'ferie' ? 'Ferie' : 'Permesso',
            data: new Date(abs.dataInizio).toLocaleDateString('it-IT'),
            durata: `${abs.durata} ${abs.durata === 1 ? 'giorno' : 'giorni'}`,
            stato: abs.status,
            motivo: abs.motivo || ''
        }));

        return NextResponse.json({
            success: true,
            data: formatted,
            count: formatted.length
        });

    } catch (error) {
        console.error('Pending requests error:', error);
        return NextResponse.json({ error: 'Errore server interno' }, { status: 500 });
    }
}