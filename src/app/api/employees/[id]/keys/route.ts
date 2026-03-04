import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {connectDB, type EmployeeDoc, EmployeeModel} from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface PatchBody {
    hasKeys: boolean;
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id: rawId } = await params;
        const employeeId = rawId?.replace(/\/$/, '');
        if (!employeeId) {
            return NextResponse.json({ error: 'ID dipendente mancante' }, { status: 400 });
        }

        // Auth JWT
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        // Solo se è il proprio profilo o admin
        if (user.id.toString() !== employeeId && user.role !== 'admin') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        const body = (await req.json()) as PatchBody;
        if (typeof body.hasKeys !== 'boolean') {
            return NextResponse.json({ error: 'hasKeys deve essere boolean' }, { status: 400 });
        }

        // Aggiorno solo il dipendente selezionato
        const employee = await EmployeeModel.findOneAndUpdate(
            { id: Number(employeeId) },
            { $set: { hasKeys: body.hasKeys } },
            { new: true, lean: true } // lean = plain JS object
        ) as (EmployeeDoc & { id: number }) | null;

        if (!employee) {
            return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
        }

        // Holder info per risposta
        const holderInfo = employee.hasKeys
            ? { id: employee.id, name: employee.name?.trim() || 'Nome mancante' }
            : null;

        return NextResponse.json({
            success: true,
            hasKeys: employee.hasKeys,
            holder: holderInfo,
        });
    } catch (error: any) {
        console.error('💥 PATCH KEYS ERROR:', error);
        return NextResponse.json(
            { error: 'Errore server', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id: rawId } = await params;
        const employeeId = rawId?.replace(/\/$/, '');
        if (!employeeId) {
            return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
        }

        const employee = await EmployeeModel.findOne({ id: Number(employeeId) })
            .select('hasKeys')
            .lean() as (Pick<EmployeeDoc, 'hasKeys'> & { id: number }) | null;

        return NextResponse.json({
            hasKeys: employee?.hasKeys || false,
        });
    } catch (error: any) {
        console.error('GET KEYS ERROR:', error);
        return NextResponse.json(
            { error: 'Errore server', details: error.message },
            { status: 500 }
        );
    }
}