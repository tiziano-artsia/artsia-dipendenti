export interface Employee {
    _id?: string;
    id: number;
    name: string;
    email: string;
    team: 'Sviluppo' | 'Digital';
    role: 'dipendente' | 'manager' | 'admin';
    passwordHash?: string;
    createdAt?: Date;
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