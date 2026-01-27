// pages/api/payslips/index.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPayslips, createPayslip } from '@/lib/db';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        const payslips = await getPayslips();

        return NextResponse.json({
            success: true,
            data: payslips
        });
    } catch (error) {
        console.error('❌ API Payslips error:', error);
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

        const form = formidable({
            uploadDir: path.join(process.cwd(), 'public', 'uploads'),
            keepExtensions: true,
        });

        const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
            form.parse(request, (err, fields, files) => {
                if (err) {
                    console.error('Errore nel parsing del form:', err);
                    reject(err);
                }
                resolve({ fields, files });
            });
        });

        const employeeId = fields.employeeId[0];
        const employeeName = fields.employeeName[0]; // Aggiunto employeeName
        const mese = fields.mese[0];
        const anno = fields.anno[0];
        const netto = fields.netto[0];
        const file = files.file[0];

        // Salva il file nella cartella uploads
        const filePath = `/uploads/${file.originalFilename}`;
        fs.copyFileSync(file.filepath, path.join(process.cwd(), 'public', filePath));

        // Crea la busta paga
        const payslip = await createPayslip({
            employeeId: Number(employeeId),
            employeeName: employeeName,
            mese: mese,
            anno: anno,
            netto: netto,
            filePath: filePath,
        });

        return NextResponse.json({
            success: true,
            data: payslip
        });
    } catch (error) {
        console.error('❌ API Payslips error:', error);
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        );
    }
}
