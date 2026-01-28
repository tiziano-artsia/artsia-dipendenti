import { NextRequest, NextResponse } from 'next/server';
import jwt, {type JwtPayload} from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectDB, EmployeeModel } from '@/lib/db';
interface CustomJwtPayload extends JwtPayload {
    email?: string;
}
export async function POST(req: NextRequest) {
    const { name, surname, team, role } = await req.json();

    if (!name || !surname || !team || !role) {
        return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Token mancante' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;
        const user = await EmployeeModel.findOne({ email: decoded.email }).lean();
        if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        const newEmail = `${name.toLowerCase().replace(' ', '.')}.${surname.toLowerCase().replace(' ', '.')}@artsia.it`;
        const password = 'Artsia.2026!';
        const passwordHash = await bcrypt.hash(password, 10);

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

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
    }
}
