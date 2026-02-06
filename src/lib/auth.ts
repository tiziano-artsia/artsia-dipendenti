import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type {Employee} from '@/types';
import { EmployeeModel, connectDB } from './db';
import {NextRequest} from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function generateToken(employee: Employee) {
    return jwt.sign(
        {
            id: employee.id,
            email: employee.email,
            role: employee.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export async function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
        return null;
    }
}

export async function authenticateUser(email: string, password: string) {
    try {
        await connectDB();

        const user = await EmployeeModel.findOne({ email });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            team: user.team,
            role: user.role,
        };
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}



export async function getUserFromToken(request: NextRequest) {
    try {
        await connectDB();

        // ✅ Estrai il token dall'header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) return null;

        const token = authHeader.substring(7);

        const decoded = await verifyToken(token); // ✅ Ora passa la stringa
        if (!decoded) return null;

        const user = await EmployeeModel.findOne({ id: decoded.id });
        if (!user) return null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            team: user.team,
            role: user.role,
        };
    } catch (error) {
        return null;
    }
}

