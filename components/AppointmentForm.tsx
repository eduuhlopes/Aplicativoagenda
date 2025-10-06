import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenerativeAI } from 'https://aistudiocdn.com/@google/generative-ai';
import { Appointment, BlockedSlot, AppointmentStatus, Service, Client, Professional } from '../types';
import DateTimePickerModal from './DateTimePickerModal';

interface AppointmentFormProps {
    onSchedule: (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => void;
    appointmentToEdit: Appointment | null;
    onUpdate: (updatedAppointment: Appointment) => void;
    onCancelEdit: () => void;
    appointments: Appointment[];
    blockedSlots: BlockedSlot[];
    onMarkAsDelayed: (appointment: Appointment) => void;
    services: Service[];
    clients: Client[];
    onViewClientHistory: (client: Client) => void;
    professionals: Professional[];
    currentUser: Professional;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const SparklesIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 12l-2.293-2.293a1 1 0 010-1.414L10 6m5 4l2.293-2.293a1 1 0 000-1.414L15 6m-5 4l-2.293 2.293a1 1 0 000 1.414L10 18l2.293-2.293a1 1 0 000-1.414L10 12z" />
    </svg>
);

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSchedule, appointmentToEdit, onUpdate, onCancelEdit, appointments, blockedSlots, onMarkAsDelayed, services, clients, onViewClientHistory, professionals, currentUser, showToast }) => {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [professionalUsername, setProfessionalUsername] = useState('');
    const [selectedServices, setSelectedServices] = useState<{ name: string; value: number; duration: number; category: string }[]>([]);
    const [serviceToAdd, setServiceToAdd] = useState('');
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const [observations, setObservations] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [modifiedServiceIndices, setModifiedServiceIndices] = useState<Set<number>>(new Set());
    const [isSuccess, setIsSuccess] = useState(false);
    const [isOrganizing, setIsOrganizing] = useState(false);
    
    // State for client autocomplete and history link
    const [suggestions, setSuggestions] = useState<Client[]>([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const suggestionBoxRef = useRef<HTMLDivElement>(null);

    const availableServices = useMemo(() => {
        if (!professionalUsername) return [];
        const professional = professionals.find(p => p.username === professionalUsername);
        if (!professional) return [];
        if (professional.role === 'admin') return services; // Admins can book any service
        return services.filter(s => professional.assignedServices.includes(s.name));
    }, [professionalUsername, professionals, services]);
    
    useEffect(() => {
        if (appointmentToEdit) {
            setClientName(appointmentToEdit.clientName);
            setClientPhone(appointmentToEdit.clientPhone);
            setClientEmail(appointmentToEdit.clientEmail || '');
            setProfessionalUsername(appointmentToEdit.professionalUsername);
            setSelectedServices(appointmentToEdit.services);
            setSelectedDateTime(new Date(appointmentToEdit.datetime));
            setObservations(appointmentToEdit.observations || '');
            setModifiedServiceIndices(new Set());
            const existingClient = clients.find(c => c.phone === appointmentToEdit.clientPhone);
            setSelectedClient(existingClient || null);
        } else {
            resetForm();
            // Default to current user if not admin, otherwise leave blank
            if (currentUser.role !== 'admin') {
                setProfessionalUsername(currentUser.username);
            }
        }
        setIsSuccess(false); // Reset success state when form opens or changes
    }, [appointmentToEdit, clients, currentUser]);
    
     // Effect to close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target as Node)) {
                setIsSuggestionsVisible(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

     // Sync selected client with phone number (for manual entry)
    useEffect(() => {
        if (!selectedClient && clientPhone) {
            const matchedClient = clients.find(c => c.phone === clientPhone);
            if (matchedClient) {
                setSelectedClient(matchedClient);
            }
        }
        if (selectedClient && clientPhone !== selectedClient.phone) {
             setSelectedClient(null);
        }
    }, [clientPhone, clients, selectedClient]);


    const resetForm = () => {
        setClientName('');
        setClientPhone('');
        setClientEmail('');
        setProfessionalUsername('');
        setSelectedServices([]);
        setServiceToAdd('');
        setSelectedDateTime(null);
        setObservations('');
        setModifiedServiceIndices(new Set());
        setSuggestions([]);
        setIsSuggestionsVisible(false);
        setSelectedClient(null);
    };

    const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setClientName(value);

        if (value.length > 1) {
            const filteredSuggestions = clients.filter(client => 
                client.name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            setIsSuggestionsVisible(true);
        } else {
            setIsSuggestionsVisible(false);
            setSelectedClient(null);
        }
    };

    const handleSuggestionClick = (client: Client) => {
        setClientName(client.name);
        setClientPhone(client.phone);
        setClientEmail(client.email || '');
        setSelectedClient(client);
        setIsSuggestionsVisible(false);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        const length = value.length;
        if (length > 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else if (length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        setClientPhone(value);
    };

    const handleAddService = () => {
        if (serviceToAdd && !selectedServices.some(s => s.name === serviceToAdd)) {
            const serviceData = services.find(s => s.name === serviceToAdd);
            if (serviceData) {
                setSelectedServices(prev => [...prev, { ...serviceData }]);
            }
        }
        setServiceToAdd('');
    };

    const handleRemoveService = (indexToRemove: number) => {
        setSelectedServices(prev => prev.filter((_, i) => i !== indexToRemove));
        setModifiedServiceIndices(prev => {
            const newSet = new Set<number>();
            prev.forEach(index => {
                if (index < indexToRemove) {
                    newSet.add(index);
                } else if (index > indexToRemove) {
                    newSet.add(index - 1);
                }
            });
            return newSet;
        });
    };
    
    const markServiceAsModified = (index: number) => {
        setModifiedServiceIndices(prev => new Set(prev).add(index));
    };

    const handleServiceChange = (index: number, newServiceName: string) => {
        const newServiceData = services.find(s => s.name === newServiceName);
        if (newServiceData) {
            setSelectedServices(prev => 
                prev.map((service, i) => 
                    i === index ? { ...newServiceData } : service
                )
            );
            markServiceAsModified(index);
        }
    };

    const handleServiceValueChange = (index: number, newValue: string) => {
        const value = parseFloat(newValue);
        setSelectedServices(prev => prev.map((service, i) => i === index ? { ...service, value: isNaN(value) ? 0 : value } : service));
        markServiceAsModified(index);
    };
    
    const handleServiceDurationChange = (index: number, newDuration: string) => {
        const duration = parseInt(newDuration, 10);
        setSelectedServices(prev => prev.map((service, i) => i === index ? { ...service, duration: isNaN(duration) ? 0 : duration } : service));
        markServiceAsModified(index);
    };

    const handleSaveServiceChange = (index: number) => {
        setModifiedServiceIndices(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    };

    const totalValue = useMemo(() => {
        return selectedServices.reduce((sum, service) => sum + service.value, 0);
    }, [selectedServices]);
    
    const totalDuration = useMemo(() => {
        return selectedServices.reduce((sum, service) => sum + service.duration, 0);
    }, [selectedServices]);

    const handleDateTimeConfirm = (data: { date: Date }) => {
        setSelectedDateTime(data.date);
        setIsPickerOpen(false);
    };

    const handleOrganizeObservations = async () => {
        if (!observations) return;
        setIsOrganizing(true);
        try {
            const ai = new GoogleGenerativeAI({apiKey: process.env.API_KEY});
            const prompt = `Você é um assistente de salão de beleza. Reorganize as anotações a seguir sobre o agendamento de uma cliente em observações claras e estruturadas. Use bullet points (usando asteriscos *) para informações chave. Foque nas preferências da cliente, avisos importantes (como alergias, em maiúsculas), e serviços mencionados que talvez precisem ser adicionados. Torne as anotações mais profissionais e fáceis de ler. As anotações são:\n\n"${observations}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            const text = response.text;
            if (text) {
                setObservations(text.trim());
                showToast('Observações organizadas com IA!', 'success');
            } else {
                throw new Error("A resposta da IA está vazia.");
            }
        } catch (error) {
            console.error("Error organizing observations with AI:", error);
            showToast("Erro ao contatar a IA. Tente novamente.", 'error');
        } finally {
            setIsOrganizing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSuccess) return; // Prevent multiple submissions

        if (!clientName || !clientPhone || !professionalUsername || selectedServices.length === 0 || !selectedDateTime) {
            alert("Por favor, preencha todos os detalhes do agendamento, incluindo a profissional e data/hora.");
            return;
        }
        
        const finalDateTime = new Date(selectedDateTime);
        const finalEndTime = new Date(finalDateTime.getTime() + totalDuration * 60 * 1000);

        if (finalDateTime >= finalEndTime) {
            alert("A duração do serviço deve ser positiva, resultando em um horário de término maior que o de início.");
            return;
        }

        const category = Array.from(new Set(selectedServices.map(s => s.category))).join(', ');

        const appointmentData = {
            clientName,
            clientPhone,
            clientEmail,
            professionalUsername,
            services: selectedServices,
            datetime: finalDateTime,
            endTime: finalEndTime,
            observations,
            category,
        };

        if (appointmentToEdit) {
            onUpdate({ ...appointmentToEdit, ...appointmentData });
        } else {
            onSchedule(appointmentData);
        }
        
        setIsSuccess(true);

        setTimeout(() => {
            onCancelEdit();
        }, 1500);
    };
    
    const handleStatusChange = (newStatus: 'confirmed' | 'completed') => {
        if(appointmentToEdit) {
            onUpdate({ ...appointmentToEdit, status: newStatus });
            onCancelEdit();
        }
    }
    
    const handleCancelAppointment = () => {
        if(appointmentToEdit) {
             if (window.confirm(`Tem certeza que deseja CANCELAR o agendamento de ${appointmentToEdit.clientName}? Esta ação não pode ser desfeita.`)) {
                 onUpdate({ ...appointmentToEdit, status: 'cancelled' }); 
                 onCancelEdit();
            }
        }
    }

    const inputClasses = "w-full h-11 px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 relative">
             {isSuccess && (
                <div className="success-overlay rounded-2xl">
                    <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
            )}

            <div style={{ visibility: isSuccess ? 'hidden' : 'visible' }}>
                <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-bold text-[var(--text-dark)] mb-4">{appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
                    <button type="button" onClick={onCancelEdit} className="p-2 -mt-2 -mr-2 text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label htmlFor="client-name" className="block text-md font-medium text-[var(--text-dark)] mb-1">
                            Nome da Cliente:
                        </label>
                        <input type="text" id="client-name" value={clientName} onChange={handleClientNameChange} placeholder="Digite o nome da cliente" className={inputClasses} required autoComplete="off" />
                        {isSuggestionsVisible && suggestions.length > 0 && (
                            <div ref={suggestionBoxRef} className="absolute z-10 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.map(client => (
                                    <div
                                        key={client.id}
                                        onClick={() => handleSuggestionClick(client)}
                                        className="px-4 py-2 cursor-pointer hover:bg-[var(--highlight)]"
                                    >
                                        <p className="font-semibold text-[var(--text-dark)]">{client.name}</p>
                                        <p className="text-sm text-[var(--secondary)]">{client.phone}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedClient && !isSuggestionsVisible && (
                            <div className="mt-2 text-sm text-right">
                                <button
                                    type="button"
                                    onClick={() => onViewClientHistory(selectedClient)}
                                    className="font-semibold text-[var(--primary)] hover:underline focus:outline-none"
                                >
                                    Ver histórico de {selectedClient.name.split(' ')[0]} &rarr;
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="client-phone" className="block text-md font-medium text-[var(--text-dark)] mb-1">
                            Telefone (WhatsApp):
                        </label>
                        <input type="tel" id="client-phone" value={clientPhone} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX" maxLength={15} className={inputClasses} required />
                    </div>
                </div>

                <div>
                    <label htmlFor="client-email" className="block text-md font-medium text-[var(--text-dark)] mb-1">
                        E-mail (opcional):
                    </label>
                    <input type="email" id="client-email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@exemplo.com" className={inputClasses} />
                </div>


                <div>
                    <label htmlFor="professional-select" className="block text-md font-medium text-[var(--text-dark)] mb-1">Profissional:</label>
                    <select
                        id="professional-select"
                        value={professionalUsername}
                        onChange={(e) => {
                            setProfessionalUsername(e.target.value);
                            setSelectedServices([]); // Reset services when professional changes
                        }}
                        className={inputClasses}
                        required
                        disabled={currentUser.role !== 'admin' && !!appointmentToEdit} // Non-admins can't change professional on existing appointments
                    >
                        <option value="">Selecione a profissional</option>
                        {professionals.map(p => (
                            <option key={p.username} value={p.username}>{p.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Services Section */}
                <div>
                    <label htmlFor="service-select" className="block text-md font-medium text-[var(--text-dark)] mb-1">Serviços:</label>
                    <div className="flex gap-2">
                        <select id="service-select" value={serviceToAdd} onChange={(e) => setServiceToAdd(e.target.value)} className={inputClasses} disabled={!professionalUsername}>
                            <option value="">{professionalUsername ? 'Selecione um serviço' : 'Selecione uma profissional primeiro'}</option>
                            {availableServices.map(s => <option key={s.name} value={s.name} title={`Duração: ${s.duration} min`}>{s.name}</option>)}
                        </select>
                        <button type="button" onClick={handleAddService} className="px-4 py-2 bg-[var(--secondary)] text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all active:scale-95" disabled={!serviceToAdd || selectedServices.some(s => s.name === serviceToAdd)}>
                            Adicionar
                        </button>
                    </div>
                </div>

                {selectedServices.length > 0 && (
                    <div className="space-y-3 p-3 bg-[var(--highlight)] border border-[var(--border)] rounded-lg">
                        {selectedServices.map((service, index) => {
                            const isModified = modifiedServiceIndices.has(index);
                            return (
                            <div key={index} className={`flex items-center gap-2 p-2 bg-white rounded-md shadow-sm border-2 transition-colors ${isModified ? 'border-[var(--info)]' : 'border-transparent'}`}>
                                <select 
                                    value={service.name} 
                                    onChange={(e) => handleServiceChange(index, e.target.value)}
                                    className="text-[var(--text-dark)] font-medium flex-grow bg-white border border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors py-1 px-2"
                                >
                                    {availableServices.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                                
                                <div className="flex items-baseline gap-1">
                                    <input type="number" value={service.duration} onChange={(e) => handleServiceDurationChange(index, e.target.value)} step="5" min="0" className="w-16 px-2 py-1 bg-white border border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                                    <span className="text-xs text-[var(--secondary)]">min</span>
                                </div>
                            
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-[var(--secondary)]">R$</span>
                                    <input type="number" value={service.value} onChange={(e) => handleServiceValueChange(index, e.target.value)} step="0.01" min="0" className="w-20 px-2 py-1 bg-white border border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                                </div>

                                {isModified && (
                                    <button type="button" onClick={() => handleSaveServiceChange(index)} title="Salvar alteração do serviço" className="p-1 text-[var(--success)] hover:bg-green-100 rounded-full transition-transform active:scale-90">
                                        <CheckIcon />
                                    </button>
                                )}
                            
                                <button type="button" onClick={() => handleRemoveService(index)} className="p-1 text-[var(--danger)] hover:bg-red-100 rounded-full transition-transform active:scale-90">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                            );
                        })}
                        <div className="text-xs text-center text-[var(--secondary)] italic mt-2 p-2 bg-blue-50 rounded-md border border-dashed border-blue-200">
                           Dica: Você pode editar o valor e a duração de cada serviço individualmente.
                        </div>
                        <div className="border-t border-[var(--border)] pt-2 mt-2 flex justify-between items-center">
                            <div className="text-left">
                                <span className="text-md font-bold text-[var(--text-dark)]">Duração:</span>
                                <span className="text-lg font-extrabold text-[var(--secondary)] ml-2">{totalDuration} min</span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-[var(--text-dark)]">Total:</span>
                                <span className="text-2xl font-extrabold text-[var(--success)] ml-2">
                                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="observations" className="block text-md font-medium text-[var(--text-dark)]">
                            Observações:
                        </label>
                        <button
                            type="button"
                            onClick={handleOrganizeObservations}
                            disabled={!observations || isOrganizing}
                            className="flex items-center gap-1.5 text-sm text-[var(--primary)] font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Organizar anotações com IA"
                        >
                            {isOrganizing ? <LoadingSpinner /> : <SparklesIcon />}
                            <span>Organizar com IA</span>
                        </button>
                    </div>
                    <textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Alergias, preferências, etc." rows={2} className="w-full px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition" />
                </div>

                <div>
                    <label className="block text-md font-medium text-[var(--text-dark)] mb-1">Data e Hora:</label>
                    <button 
                        type="button" 
                        onClick={() => setIsPickerOpen(true)}
                        className={`${inputClasses} text-left text-[var(--text-dark)] font-semibold flex items-center justify-between`}
                    >
                        <span>
                            {selectedDateTime 
                                ? selectedDateTime.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })
                                : 'Selecione um horário...'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--secondary)]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="mt-6 flex flex-col items-center">
                    <button type="submit" className="w-full py-3 px-4 btn-primary-gradient text-white font-bold text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale" disabled={!clientName || !clientPhone || !professionalUsername || selectedServices.length === 0 || !selectedDateTime || isSuccess}>
                        {appointmentToEdit ? 'Salvar Alterações' : 'Concluir Agendamento'}
                    </button>
                    <p className="text-center text-sm text-[var(--secondary)] italic mt-2">
                        Após salvar, você poderá notificar a cliente sobre as alterações.
                    </p>
                </div>
                {appointmentToEdit && (
                    <div className="border-t border-[var(--border)] mt-4 pt-4 space-y-3">
                        <p className="text-md font-semibold text-center text-[var(--text-dark)]">Status Atual: <span className={`font-bold uppercase ${appointmentToEdit.status === 'delayed' ? 'text-[var(--warning)]' : 'text-[var(--primary)]'}`}>{appointmentToEdit.status}</span></p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {appointmentToEdit.status === 'scheduled' && (
                                <button type="button" onClick={() => handleStatusChange('confirmed')} className="w-full py-2 px-4 bg-[var(--success)] text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all text-sm active:scale-95">
                                    Marcar como Confirmado
                                </button>
                            )}
                            {(appointmentToEdit.status === 'scheduled' || appointmentToEdit.status === 'confirmed' || appointmentToEdit.status === 'delayed') && (
                                <button type="button" onClick={() => handleStatusChange('completed')} className="w-full py-2 px-4 bg-[var(--secondary)] text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all text-sm active:scale-95">
                                    Marcar como Finalizado
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(appointmentToEdit.status === 'scheduled' || appointmentToEdit.status === 'confirmed') && (
                                <button type="button" onClick={() => onMarkAsDelayed(appointmentToEdit)} className="w-full py-2 px-4 bg-[var(--warning)] text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all text-sm active:scale-95">
                                    Marcar como Atrasado
                                </button>
                            )}
                            {(appointmentToEdit.status === 'scheduled' || appointmentToEdit.status === 'confirmed' || appointmentToEdit.status === 'delayed') && (
                                <button
                                    type="button"
                                    onClick={handleCancelAppointment}
                                    className={`w-full py-2 px-4 bg-[var(--danger)] text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all text-sm active:scale-95 ${
                                        appointmentToEdit.status === 'delayed' ? 'sm:col-span-2' : ''
                                    }`}
                                >
                                    Cancelar Agendamento
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <DateTimePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onConfirm={handleDateTimeConfirm}
                appointments={appointments}
                blockedSlots={blockedSlots}
                totalDuration={totalDuration}
                editingAppointmentId={appointmentToEdit?.id ?? null}
                initialDate={selectedDateTime}
                professionals={professionals}
                professionalUsername={professionalUsername}
            />
        </form>
    );
};

export default AppointmentForm;