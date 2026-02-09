import { NextRequest, NextResponse } from 'next/server';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectDB, EmployeeModel } from '@/lib/db';

interface CustomJwtPayload extends JwtPayload {
    email?: string;
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { name, surname, team, role } = await req.json();

        if (!name || !surname || !team || !role) {
            return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
        }

        const authHeader = req.headers.get('Authorization');
        console.log('📋 Authorization header:', authHeader ? 'presente' : 'mancante');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token mancante' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        console.log('🔑 Token ricevuto:', token.substring(0, 20) + '...');

        if (!process.env.JWT_SECRET) {
            return NextResponse.json({ error: 'Configurazione server errata' }, { status: 500 });
        }

        console.log('🔐 JWT_SECRET presente:', process.env.JWT_SECRET.substring(0, 10) + '...');

        let decoded: CustomJwtPayload;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET) as CustomJwtPayload;
        } catch (jwtError: any) {
            return NextResponse.json({
                error: 'Token non valido o scaduto',
                details: jwtError.message
            }, { status: 401 });
        }

        if (!decoded.email) {
            return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
        }

        const user = await EmployeeModel.findOne({ email: decoded.email }).lean();

        if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Accesso negato - ruolo insufficiente' }, { status: 403 });
        }

        const newEmail = `${name.toLowerCase().replace(/\s+/g, '.')}.${surname.toLowerCase().replace(/\s+/g, '.')}@artsia.it`;
        const password = 'Artsia.2026!';
        const passwordHash = await bcrypt.hash(password, 10);

        const existingEmployee = await EmployeeModel.findOne({ email: newEmail }).lean();
        if (existingEmployee) {
            return NextResponse.json({ error: 'Email già esistente' }, { status: 400 });
        }

        const lastEmployee = await EmployeeModel.findOne().sort({ id: -1 }).lean();
        const newId = lastEmployee ? lastEmployee.id + 1 : 1;

        await EmployeeModel.create({
            id: newId,
            name: `${name} ${surname}`,
            email: newEmail,
            team,
            role,
            passwordHash
        });


        return NextResponse.json({
            success: true,
            email: newEmail,
            password: password
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Errore interno del server',
            details: error.message
        }, { status: 500 });
    }
}
