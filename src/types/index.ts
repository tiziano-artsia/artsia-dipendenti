import type {Team} from "@/lib/db";

export interface Employee {
    _id?: string;
    id: number;
    name: string;
    email: string;
    team: 'Sviluppo' | 'Digital';
    role: 'dipendente' | 'manager' | 'admin';
    passwordHash?: string;
    createdAt?: Date;
    hasKeys: boolean;
}

export interface Absence {
    _id?: string;
    id: number;
    employeeId: number;
    type: 'ferie' | 'permesso' | 'smartworking';
    dataInizio: string;
    durata: number;
    motivo: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AuthToken {
    token: string;
    user: Employee;
    expiresIn: number;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface EmployeePresence {
    id: number;
    name: string;
    team: 'Sviluppo' | 'Digital' | 'Bottega' | 'Admin';
    fullRemote: boolean;
    status: 'smart' | 'ufficio' | 'assente';
    absenceType?: string;
}


export interface PresenceEmployee {
    id: number;
    name: string;
    surname?: string;
    team: Team;
    fullRemote: boolean;
    status: 'smart' | 'ufficio' | 'assente';
    absenceType?: string;
}

export interface UseDailyPresencesReturn {
    smart: EmployeePresence[];
    office: EmployeePresence[];
    assente: EmployeePresence[];
    loading: boolean;
    total: number;
}

export interface KeysHolder {
    id: string;  // String perché DB restituisce string
    name: string;
}

export interface SSEKeysResponse {
    holder: KeysHolder | null;
}

export interface KeysAPIResponse {
    success: boolean;
    hasKeys: boolean;
    holder?: KeysHolder;
}
