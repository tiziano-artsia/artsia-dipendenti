import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import {
    createAbsence,
    connectDB,
    EmployeeModel
} from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || ''

interface JWTPayload {
    id: number
    role: string
    name: string
    email: string
}

function getUserFromToken(request: NextRequest): JWTPayload | null {

    try {

        const authHeader = request.headers.get('authorization')

        if (!authHeader?.startsWith('Bearer '))
            return null

        const token = authHeader.substring(7)

        return jwt.verify(token, JWT_SECRET) as JWTPayload

    } catch {

        return null

    }

}

export async function POST(request: NextRequest) {

    try {

        const user = getUserFromToken(request)

        console.log("DECODED USER:", user)

        if (!user || user.role !== 'admin') {

            return NextResponse.json(
                { error: 'Solo admin autorizzato' },
                { status: 403 }
            )

        }

        const body = await request.json()

        const tipo = (body.tipo || '').trim().toLowerCase()

        const tipiValidi = new Set([
            'ferie',
            'permesso',
            'malattia',
            'smartworking',
            'fuori-sede',
            'congedo-parentale',
            'festivita'
        ])

        if (!tipiValidi.has(tipo)) {

            return NextResponse.json(
                { error: 'Tipo assenza non valido' },
                { status: 400 }
            )

        }

        if (!body.dataInizio) {

            return NextResponse.json(
                { error: 'dataInizio obbligatoria' },
                { status: 400 }
            )

        }

        await connectDB()

        let employees: any[] = []

        //  singolo dipendente
        if (body.target === 'utente') {

            const emp = await EmployeeModel.findOne({
                id: Number(body.utenteId)
            }).lean()

            if (!emp) {

                return NextResponse.json(
                    { error: 'Dipendente non trovato' },
                    { status: 404 }
                )

            }

            employees = [emp]

        }

        //  team
        if (body.target === 'team') {

            employees = await EmployeeModel.find({
                team: body.teamId
            }).lean()

        }

        //  tutti
        if (body.target === 'tutti') {

            employees = await EmployeeModel.find({
                role: { $ne: 'admin' }
            }).lean()

        }

        if (employees.length === 0) {

            return NextResponse.json(
                { error: 'Nessun dipendente trovato' },
                { status: 404 }
            )

        }

        const results = []

        for (const emp of employees) {

            const newAbsence = await createAbsence({

                employeeId: emp.id,

                type: tipo,
                tipo,

                dataInizio: body.dataInizio,
                dataFine: body.dataFine || body.dataInizio,

                durata: body.durata || 1,

                data: body.dataInizio,

                motivo: body.motivo || '',

                status: 'approved',
                stato: 'approved',

                requestedBy: user.name,
                approvedBy: user.id,

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()

            })

            results.push(newAbsence)

        }


        return NextResponse.json({

            success: true,
            count: results.length,
            data: results

        })

    } catch (error: any) {

        console.error('❌ ADMIN ASSENZE ERROR:', error)

        return NextResponse.json(
            {
                error: 'Errore creazione assenze',
                details: error.message
            },
            { status: 500 }
        )

    }

}