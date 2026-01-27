import { NextRequest, NextResponse } from 'next/server';
import { EmployeeModel, AbsenceModel } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

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

        // Solo PENDING requests
        const absences = await AbsenceModel.find({
            status: 'pending',
            type: { $in: ['ferie', 'permesso', 'smartworking'] }
        })
            .populate('employeeId', 'nome email team')
            .lean();

        // Formatta per frontend
        const formatted = absences.map(abs => ({
            id: abs._id,
            employeeId: abs.employeeId._id,
            dipendente: abs.employeeId.nome,
            team: abs.employeeId.team || 'Sviluppo',
            tipo: abs.type === 'smartworking' ? 'Smartworking' :
                abs.type === 'ferie' ? 'Ferie' : 'Permesso',
            data: new Date(abs.dataInizio).toLocaleDateString('it-IT'),
            durata: abs.durata + (typeof abs.durata === 'number' ? ' giorni' : ' ore'),
            stato: abs.status,
            motivo: abs.motivo
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Pending requests error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
