import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import {
    createAbsence,
    connectDB,
    EmployeeModel
} from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface JWTPayload {
    id: number;
    role: string;
    name: string;
    email: string;
}

function getUserFromToken(request: NextRequest): JWTPayload | null {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader?.startsWith('Bearer '))
            return null;

        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as JWTPayload;

    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {

        const user = getUserFromToken(request);

        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Solo admin autorizzato' },
                { status: 403 }
            );
        }

        const body = await request.json();


        const tipo = (body.tipo || '').trim().toLowerCase();
        const dataInizio = body.dataInizio;
        const dataFine = body.dataFine || dataInizio;
        const durata = body.durata || 1;
        const motivo = body.motivo || '';


        const tipiValidi = new Set([
            'ferie',
            'permesso',
            'malattia',
            'smartworking',
            'fuori-sede',
            'congedo-parentale',
            'festivita'
        ]);

        if (!tipiValidi.has(tipo)) {
            return NextResponse.json(
                { error: 'Tipo assenza non valido' },
                { status: 400 }
            );
        }

        if (!dataInizio) {
            return NextResponse.json(
                { error: 'dataInizio obbligatoria' },
                { status: 400 }
            );
        }

        await connectDB();

        let employees: any[] = [];


        const rawId = body.employeeId || body.utenteId;

        const normalizedId =
            typeof rawId === 'string' && !isNaN(Number(rawId))
                ? Number(rawId)
                : rawId;


        if (body.target === 'utente' || body.target === 'dipendente') {

            if (!normalizedId) {
                return NextResponse.json(
                    { error: 'ID dipendente mancante' },
                    { status: 400 }
                );
            }

            const emp = await EmployeeModel.findOne({
                id: normalizedId
            }).lean();

            if (!emp) {
                return NextResponse.json(
                    { error: 'Dipendente non trovato' },
                    { status: 404 }
                );
            }

            employees = [emp];

        }
        // 👥 TEAM
        else if (body.target === 'team') {

            if (!body.teamId) {
                return NextResponse.json(
                    { error: 'teamId mancante' },
                    { status: 400 }
                );
            }

            employees = await EmployeeModel.find({
                team: body.teamId
            }).lean();

        }

        else if (body.target === 'tutti') {

            employees = await EmployeeModel.find({
                role: { $ne: 'admin' }
            }).lean();

        }
        else {
            return NextResponse.json(
                { error: 'Target non valido' },
                { status: 400 }
            );
        }

        if (!employees || employees.length === 0) {
            return NextResponse.json(
                { error: 'Nessun dipendente trovato' },
                { status: 404 }
            );
        }

        const results = [];

        for (const emp of employees) {

            const newAbsence = await createAbsence({
                employeeId: emp.id,

                type: tipo,
                tipo,

                dataInizio,
                dataFine,

                durata,
                data: dataInizio,

                motivo,

                status: 'approved',
                stato: 'approved',

                requestedBy: user.name,
                approvedBy: user.id,

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            results.push(newAbsence);
        }


        return NextResponse.json({
            success: true,
            count: results.length,
            data: results
        });

    } catch (error: any) {
        console.error('❌ ADMIN ASSENZE ERROR:', error);

        return NextResponse.json(
            {
                error: 'Errore creazione assenze',
                details: error.message
            },
            { status: 500 }
        );
    }
}