import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Client, Service, PaymentLink, PaymentProof } from '../types';

// Helper to parse dates from JSON while loading
const dateTimeReviver = (key: string, value: any) => {
    if ((key === 'datetime' || key === 'endTime' || key === 'date' || key === 'createdAt') && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }
    return value;
};

// Generic loader from localStorage, used for initializing state
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue, dateTimeReviver) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const PublicPaymentPage: React.FC = () => {
    // Component State
    const [linkId, setLinkId] = useState<string | null>(null);
    const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Data from LocalStorage, initialized directly on component load
    const [logoUrl] = useState(() => loadFromStorage('spaco-delas-global-logo', '/logo.png'));
    
    // Effect to apply theme on mount
    useEffect(() => {
        const theme = localStorage.getItem('app-theme') || 'pink';
        document.documentElement.setAttribute('data-theme', theme);
    }, []);
    
    // Effect to parse URL and load data
    useEffect(() => {
        const pathParts = window.location.pathname.split('/');
        const id = pathParts[pathParts.length - 1];
        if (!id) {
            setError("Link de pagamento inválido ou ausente.");
            setIsLoading(false);
            return;
        }
        setLinkId(id);

        // Load all necessary data from storage
        const allLinks = loadFromStorage<Record<string, PaymentLink>>('spaco-delas-payment-links', {});
        const linkData = allLinks[id];

        if (!linkData) {
            setError("Este link de pagamento não foi encontrado ou expirou.");
            setIsLoading(false);
            return;
        }

        const allClients = loadFromStorage<Client[]>('spaco-delas-clients', []);
        const clientData = allClients.find(c => c.id === linkData.clientId);

        if (!clientData) {
            setError("Não foi possível encontrar os dados do cliente associados a este link.");
            setIsLoading(false);
            return;
        }

        const allAppointments = loadFromStorage<Appointment[]>('spaco-delas-appointments', []);
        const appointmentData = allAppointments.filter(a => linkData.appointmentIds.includes(a.id));

        setPaymentLink(linkData);
        setClient(clientData);
        setAppointments(appointmentData);
        setIsLoading(false);

    }, []);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                alert("O arquivo é muito grande. Por favor, envie uma imagem com menos de 5MB.");
                return;
            }
            setFile(selectedFile);
        }
    };
    
    const handleSubmitProof = () => {
        if (!file || !paymentLink || !client) {
            alert("Por favor, selecione um arquivo de comprovante.");
            return;
        }
        setIsSubmitting(true);
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const imageDataUrl = reader.result as string;
            
            const newProof: PaymentProof = {
                id: paymentLink.id,
                clientId: client.id,
                appointmentIds: paymentLink.appointmentIds,
                totalDue: paymentLink.totalDue,
                imageDataUrl,
                status: 'pending_validation'
            };

            // Save the proof to localStorage for the main app to process
            const existingProofs = loadFromStorage<PaymentProof[]>('spaco-delas-payment-proofs', []);
            const updatedProofs = [...existingProofs.filter(p => p.id !== newProof.id), newProof];
            localStorage.setItem('spaco-delas-payment-proofs', JSON.stringify(updatedProofs));
            
            setIsSubmitting(false);
            setIsSuccess(true);
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("Ocorreu um erro ao processar seu arquivo. Tente novamente.");
            setIsSubmitting(false);
        };
    };

    const renderHeader = () => (
         <header className="text-center py-6 bg-[var(--surface-opaque)] border-b-2 border-[var(--border)]">
            <img src={logoUrl} alt="Spaço Delas Logo" className="h-20 w-20 rounded-full object-cover border-2 border-white/50 shadow-lg mx-auto mb-3" />
            <h1 className="font-brand text-4xl sm:text-5xl text-[var(--text-dark)]">Spaço Delas</h1>
            <p className="text-lg text-[var(--secondary)]">Pagamento de Pendências</p>
        </header>
    );

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-8">Carregando...</div>;
        }
        if (error) {
            return <div className="text-center p-8 text-red-600 font-semibold">{error}</div>;
        }
        if (isSuccess) {
            return (
                <div className="animate-view-in text-center">
                     <svg className="success-checkmark mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mt-4 mb-2">Comprovante Enviado!</h2>
                    <p className="text-[var(--text-body)] mb-6">Recebemos seu comprovante e ele será validado em breve. Agradecemos pelo seu pagamento!</p>
                </div>
            );
        }
        if (paymentLink && client) {
            return (
                 <div className="animate-view-in">
                    <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mb-2">Olá, {client.name}!</h2>
                    <p className="text-center text-[var(--text-body)] mb-4">Aqui estão os detalhes da sua pendência:</p>
                    
                    <div className="bg-white p-4 rounded-lg border border-[var(--border)] space-y-2 mb-6">
                        {appointments.map(appt => (
                             <div key={appt.id} className="flex justify-between items-center text-sm border-b border-dashed pb-2 last:border-none">
                                <div>
                                    <p className="font-semibold">{appt.datetime.toLocaleDateString('pt-BR')}</p>
                                    <p className="text-xs text-gray-600">{appt.services.map(s => s.name).join(', ')}</p>
                                </div>
                                <p className="font-bold">{appt.services.reduce((sum,s)=>sum+s.value,0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 font-bold text-xl">
                            <span className="text-[var(--text-dark)]">Total a Pagar:</span>
                            <span className="text-[var(--danger)]">{paymentLink.totalDue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="proof-upload" className="block text-md font-medium text-[var(--text-dark)] mb-2 text-center">
                            Envie o comprovante de pagamento:
                        </label>
                        <input
                            type="file"
                            id="proof-upload"
                            accept="image/png, image/jpeg, image/gif, application/pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[var(--highlight)] file:text-[var(--primary)]
                                hover:file:bg-[var(--accent)]"
                        />
                         {file && <p className="text-center text-sm mt-2 text-gray-500">Arquivo selecionado: {file.name}</p>}
                    </div>

                    <button 
                        onClick={handleSubmitProof} 
                        disabled={!file || isSubmitting}
                        className="mt-6 w-full py-3 btn-primary-gradient text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                        {isSubmitting ? 'Enviando...' : 'Confirmar Envio do Comprovante'}
                    </button>
                 </div>
            );
        }
        return null;
    };
    
    return (
        <div className="bg-[var(--background)] min-h-screen font-sans">
            {renderHeader()}
            <main className="p-4 sm:p-8 max-w-lg mx-auto">
                <div className="bg-[var(--surface-opaque)] p-6 rounded-2xl shadow-lg border border-[var(--border)]">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default PublicPaymentPage;