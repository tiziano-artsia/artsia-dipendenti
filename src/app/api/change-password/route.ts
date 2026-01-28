import { NextRequest, NextResponse } from 'next/server';
import { connectDB, EmployeeModel } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword, userId } = await request.json();

        // Validazione dei dati
        if (!currentPassword || !newPassword || !userId) {
            return NextResponse.json(
                { error: 'Password attuale, nuova password e ID utente sono obbligatori' },
                { status: 400 }
            );
        }

        // Connessione al DB
        await connectDB();

        // Recupera l'utente per ID
        const user = await EmployeeModel.findOne({ id: userId }).lean();
        if (!user) {
            return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
        }

        // Verifica la password attuale
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 401 });
        }

        // Hash della nuova password
        const newHash = await bcrypt.hash(newPassword, 10);

        // Aggiorna la password nel DB
        await EmployeeModel.updateOne({ id: userId }, { passwordHash: newHash });

        return NextResponse.json({ message: 'Password aggiornata con successo' }, { status: 200 });
    } catch (error) {
        console.error('Errore nel cambio password:', error);
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}
