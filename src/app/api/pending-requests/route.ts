import { NextRequest, NextResponse } from 'next/server';
import { EmployeeModel, AbsenceModel } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// @ts-ignore
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role === 'dipendente') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        const absences = await AbsenceModel.find({
            status: 'pending',
            type: { $in: ['ferie', 'permesso', 'smartworking', 'fuori-sede'] }
        })
            .populate('employeeId', 'nome email team')
            .lean() as any[];

        const formatted = absences.map((abs: any) => ({
            id: abs._id?.toString(),
            employeeId: abs.employeeId?._id?.toString() || abs.employeeId,
            dipendente: abs.employeeId?.nome,
            team: abs.employeeId?.team || 'Sviluppo',
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
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}