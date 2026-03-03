import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB, EmployeeModel } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ✅ Promise!
) {
    console.log('🚀 PUT START');

    try {
        await connectDB();
        console.log('✅ DB OK');

        const { id: rawId } = await params;
        const employeeId = rawId?.replace(/\/$/, '') || '';
        console.log('🆔 ID:', employeeId);

        if (!employeeId) {
            return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
        }

        // Auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            console.log('❌ No auth');
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
        console.log('🔓 User:', user.role);

        const body = await req.json();
        console.log('📥 Body:', body);

        const updateData: any = {};
        const allowedFields = ['dataNascita', 'dataAssunzione', 'inquadramento', 'mansione', 'costoMensile', 'costoAnnuale', 'costoOrario'];

        for (const key of allowedFields) {
            if (body[key] !== undefined && body[key] !== '') {
                if (key.includes('data') && body[key]) {
                    const date = new Date(body[key]);
                    if (isNaN(date.getTime())) {
                        return NextResponse.json({ error: `Data ${key} invalida` }, { status: 400 });
                    }
                    updateData[key] = date;
                } else {
                    updateData[key] = body[key];
                }
            }
        }

        // Save
        // @ts-ignore
        const existing = await EmployeeModel.findOne({ id: employeeId });
        console.log('🔍 Esiste:', !!existing);

        const employee = await EmployeeModel.findOneAndUpdate(
            // @ts-ignore
            { id: employeeId },
            { $set: updateData },
            { new: true }
        );

        if (!employee) {
            return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
        }

        return NextResponse.json(employee);

    } catch (error: any) {
        return NextResponse.json({ error: 'Errore server', details: error.message }, { status: 500 });
    }
}


export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        // SOLO admin
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        // ID come stringa
        const { id: paramId } = await params;
        const employeeId = paramId;
        // @ts-ignore
        const result = await EmployeeModel.deleteOne({ id: employeeId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
        }

        console.log(`✅ Eliminato dipendente ${employeeId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ API Employees DELETE error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}