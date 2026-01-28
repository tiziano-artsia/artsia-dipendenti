// src/lib/db.ts
import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error("MONGODB_URI mancante in .env.local");
}

/**
 * Cache connessione (necessaria in dev con hot reload)
 */
type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI!, {
                bufferCommands: false,
            })
            .then((m) => {
                console.log("✅ MongoDB connesso");
                return m;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

/**
 * Types
 */
export type Role = "dipendente" | "manager" | "admin";
export type Team = "Sviluppo" | "Digital" | "Admin";
export type AbsenceType = "ferie" | "permesso" | "smartworking" | "malattia";
export type AbsenceStatus = "pending" | "approved" | "rejected";

export type EmployeeDoc = {
    id: number;
    name: string;
    email: string;
    team: Team;
    role: Role;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
};

export type AbsenceDoc = {
    tipo: string;
    data:string;
    id: number;
    employeeId: any;
    type: AbsenceType;
    dataInizio: string; // YYYY-MM-DD
    durata: number; // giorni o ore
    motivo: string;
    status: AbsenceStatus;
    approvedBy?: number | null;
    createdAt: Date;
    updatedAt: Date;
    _id: any;
    stato: string;
    requestedBy: string;
}


/**
 * Schemas
 */
const employeeSchema = new Schema<EmployeeDoc>(
    {
        id: { type: Number, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        team: { type: String, required: true, enum: ["Sviluppo", "Digital", "Admin"] },
        role: { type: String, required: true, enum: ["dipendente", "manager", "admin"] },
        passwordHash: { type: String, required: true },
    },
    { timestamps: true }
);

const absenceSchema = new Schema<AbsenceDoc>(
    {
        id: { type: Number, required: true, unique: true, index: true },
        employeeId: { type: Number, required: true, index: true },
        type: { type: String, required: true, enum: ["ferie", "permesso", "smartworking","malattia"] },
        dataInizio: { type: String, required: true }, // YYYY-MM-DD
        durata: { type: Number, required: true },
        motivo: { type: String, default: "" },
        status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
        requestedBy: {
            type: String,
            default: ''
        },
        approvedBy: { type: Number, default: null },
    },
    { timestamps: true }
);

export const EmployeeModel: Model<EmployeeDoc> =
    mongoose.models.Employee || mongoose.model<EmployeeDoc>("Employee", employeeSchema);

export const AbsenceModel: Model<AbsenceDoc> =
    mongoose.models.Absence || mongoose.model<AbsenceDoc>("Absence", absenceSchema);

/**
 * Demo seed (15 dipendenti + 1 admin)
 * - password admin: admin123
 * - password altri: pass123
 */

const demoEmployees = [
    // Team Sviluppo (8)
    { id: 1, name: "Marco Rossi", email: "marco.rossi@azienda.it", team: "Sviluppo" as const, role: "manager" as const },
    { id: 2, name: "Luca Bianchi", email: "luca.bianchi@azienda.it", team: "Sviluppo" as const, role: "dipendente" as const },
    { id: 3, name: "Andrea Verdi", email: "andrea.verdi@azienda.it", team: "Sviluppo" as const, role: "dipendente" as const },
    { id: 4, name: "Paolo Neri", email: "paolo.neri@azienda.it", team: "Sviluppo" as const, role: "dipendente" as const },
    { id: 5, name: "Gabriele Blu", email: "gabriele.blu@azienda.it", team: "Sviluppo" as const, role: "dipendente" as const },
    { id: 6, name: "Sofia Rossi", email: "sofia.rossi@azienda.it", team: "Sviluppo" as const, role: "dipendente" as const },
    { id: 7, name: "Michele Gialli", email: "michele.gialli@azienda.it", team: "Sviluppo" as const, role: "dipendente" as const },
    { id: 8, name: "Federica Viola", email: "federica.viola@azienda.it", team: "Sviluppo" as const, role: "dipendente" as const },

    // Team Digital (7)
    { id: 9, name: "Elena Ferrari", email: "elena.ferrari@azienda.it", team: "Digital" as const, role: "manager" as const },
    { id: 10, name: "Marco Bianchi", email: "marco.bianchi@azienda.it", team: "Digital" as const, role: "dipendente" as const },
    { id: 11, name: "Chiara Rossi", email: "chiara.rossi@azienda.it", team: "Digital" as const, role: "dipendente" as const },
    { id: 12, name: "Davide Rizzo", email: "davide.rizzo@azienda.it", team: "Digital" as const, role: "dipendente" as const },
    { id: 13, name: "Laura Marini", email: "laura.marini@azienda.it", team: "Digital" as const, role: "dipendente" as const },
    { id: 14, name: "Giovanni Russo", email: "giovanni.russo@azienda.it", team: "Digital" as const, role: "dipendente" as const },
    { id: 15, name: "Valentina Costa", email: "valentina.costa@azienda.it", team: "Digital" as const, role: "dipendente" as const },

    // Admin
    { id: 100, name: "Admin", email: "admin@azienda.it", team: "Admin" as const, role: "admin" as const },
];


export async function ensureSeeded() {
    await connectDB();

    const employeeCount = await EmployeeModel.countDocuments();
    if (employeeCount > 0) return;

    console.log("🌱 Seeding demo data...");

    const passHash = await bcrypt.hash("pass123", 10);
    const adminHash = await bcrypt.hash("admin123", 10);

    await EmployeeModel.insertMany(
        demoEmployees.map((e) => ({
            ...e,
            passwordHash: e.role === "admin" ? adminHash : passHash,
        }))
    );

    //await AbsenceModel.insertMany(demoAbsences);

    console.log("✅ Seed completato (dipendenti + assenze demo)");
}

/**
 * Auth (usata dalla route /api/auth/login)
 */
export async function authenticateUser(email: string, password: string) {
    await ensureSeeded();

    const user = await EmployeeModel.findOne({ email: email.toLowerCase().trim() }).lean<EmployeeDoc | null>();
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        team: user.team,
        role: user.role,
    };
}

/**
 * CRUD utilities
 */
export async function getEmployees() {
    await connectDB();
    return EmployeeModel.find({ role: { $ne: "admin" } }).sort({ team: 1, name: 1 }).lean();
}

export async function getAbsences(filter: Partial<Pick<AbsenceDoc, "employeeId" | "type" | "status">> = {}) {
    await connectDB();
    return AbsenceModel.find(filter).sort({ createdAt: -1 }).lean();
}

export async function createAbsence(data: {
    _id: undefined;
    tipo: string;
    employeeId: number;
    type: any;
    dataInizio: any;
    durata: number;
    motivo: any;
    status: string;
    approvedBy: null;
    data: any;
    stato: string;
    requestedBy: string
}) {
    await connectDB();
    const doc = await AbsenceModel.create({ ...data, id: Date.now() });
    return doc.toObject();
}

export async function updateAbsenceStatus(absenceId: number | string, status: AbsenceStatus, approvedBy: number) {
    await connectDB();


    const result = await AbsenceModel.updateOne(
        // @ts-ignore
        { id: absenceId },
        {
            $set: {
                status,
                approvedBy,
                updatedAt: new Date()
            }
        }
    );

    console.log('🔍 MongoDB Update:', {
        absenceId,
        status,
        matched: result.matchedCount,
        modified: result.modifiedCount
    });

    return result.modifiedCount > 0;
}

export type PayslipDoc = {
    id: number;
    employeeId: number;
    employeeName: string;
    mese: string;
    anno: string;
    netto: string;
    filePath: string;
    createdAt: Date;
    updatedAt: Date;
};

const payslipSchema = new Schema<PayslipDoc>(
    {
        id: { type: Number, required: true, unique: true, index: true },
        employeeId: { type: Number, required: true, index: true },
        employeeName: { type: String, required: true },
        mese: { type: String, required: true },
        anno: { type: String, required: true },
        netto: { type: String, required: true },
        filePath: { type: String, required: true },
    },
    { timestamps: true }
);
export const PayslipModel: Model<PayslipDoc> =
    mongoose.models.Payslip || mongoose.model<PayslipDoc>("Payslip", payslipSchema);

export async function getPayslips(filter: Partial<Pick<PayslipDoc, "employeeId" | "mese" | "anno">> = {}) {
    await connectDB();
    return PayslipModel.find(filter).sort({ createdAt: -1 }).lean();
}

export async function createPayslip(data: {
    employeeId: number;
    employeeName: string;
    mese: string;
    anno: string;
    netto: string;
    filePath: string;
}) {
    await connectDB();
    const doc = await PayslipModel.create({ ...data, id: Date.now() });
    return doc.toObject();
}

export async function getPayslipById(id: number) {
    await connectDB();
    return PayslipModel.findOne({ id }).lean();
}
