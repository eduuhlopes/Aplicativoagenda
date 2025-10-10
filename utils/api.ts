import { Appointment, Client, Professional, StoredProfessional } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to handle fetch responses and parse dates
const reviver = (key: string, value: any) => {
    const dateKeys = ['datetime', 'endTime', 'date', 'createdAt', 'validatedAt'];
    if (dateKeys.includes(key) && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return value;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) { // No Content
        return null;
    }
    const text = await response.text();
    return text ? JSON.parse(text, reviver) : null;
};

// --- Appointments ---
export const getAppointments = (): Promise<Appointment[]> => {
    return fetch(`${API_BASE_URL}/agendamentos`).then(handleResponse);
};

export const createAppointment = (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
    return fetch(`${API_BASE_URL}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
    }).then(handleResponse);
};

export const updateAppointment = (id: number, appointmentData: Appointment): Promise<Appointment> => {
    return fetch(`${API_BASE_URL}/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
    }).then(handleResponse);
};

// --- Clients ---
export const getClients = (): Promise<Client[]> => {
    return fetch(`${API_BASE_URL}/clientes`).then(handleResponse);
};

export const createClient = (clientData: Omit<Client, 'id'>): Promise<Client> => {
    return fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
    }).then(handleResponse);
};

export const updateClient = (id: number, clientData: Client): Promise<Client> => {
    return fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
    }).then(handleResponse);
};

// --- Professionals ---
export const getProfessionals = (): Promise<Record<string, StoredProfessional>> => {
    return fetch(`${API_BASE_URL}/profissionais`).then(handleResponse);
};

export const createProfessional = (professionalData: StoredProfessional & { username: string }): Promise<StoredProfessional> => {
    return fetch(`${API_BASE_URL}/profissionais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(professionalData),
    }).then(handleResponse);
};

export const updateProfessional = (username: string, professionalData: Partial<StoredProfessional>): Promise<StoredProfessional> => {
    return fetch(`${API_BASE_URL}/profissionais/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(professionalData),
    }).then(handleResponse);
};

export const deleteProfessional = (username: string): Promise<null> => {
    return fetch(`${API_BASE_URL}/profissionais/${username}`, {
        method: 'DELETE',
    }).then(handleResponse);
};