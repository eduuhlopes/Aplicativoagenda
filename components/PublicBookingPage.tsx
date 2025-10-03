import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Professional, Service, BlockedSlot, StoredProfessional } from '../types';
import { SERVICES, TIMES, MONTHS } from '../constants';

// Helper to parse dates from JSON while loading
const dateTimeReviver = (key: string, value: any) => {
    if ((key === 'datetime' || key === 'endTime' || key === 'date') && typeof value === 'string') {
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


const UserIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-16 w-16 text-gray-300"} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" />
    </svg>
);


const PublicBookingPage: React.FC = () => {
    // Component State
    const [step, setStep] = useState(1);
    const [clientPhone, setClientPhone] = useState('');
    const [clientName, setClientName] = useState('');
    const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // Data from LocalStorage, initialized directly on component load
    const [logoUrl, setLogoUrl] = useState(() => loadFromStorage('spaco-delas-global-logo', '/logo.png'));
    const [professionalsData, setProfessionalsData] = useState(() => loadFromStorage<Record<string, StoredProfessional>>("spaco-delas-users", {}));
    const [services, setServices] = useState(() => loadFromStorage<Service[]>("spaco-delas-services", SERVICES));
    const [appointments, setAppointments] = useState(() => loadFromStorage<Appointment[]>("spaco-delas-appointments", []));
    const [blockedSlots, setBlockedSlots] = useState(() => loadFromStorage<BlockedSlot[]>("spaco-delas-blockedSlots", []));
    
    // Appointment requests are read and also written back to storage from this page
    const [appointmentRequests, setAppointmentRequests] = useState(() => loadFromStorage<Appointment[]>("spaco-delas-appointment-requests", []));
    
    // Effect to apply theme on mount
    useEffect(() => {
        const theme = localStorage.getItem('app-theme') || 'pink';
        document.documentElement.setAttribute('data-theme', theme);
    }, []);
    
    // Effect to save appointmentRequests back to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem("spaco-delas-appointment-requests", JSON.stringify(appointmentRequests));
        } catch (error) {
            console.error("Error writing appointment requests to localStorage:", error);
        }
    }, [appointmentRequests]);


    const professionalsList = useMemo((): Professional[] => 
        Object.entries(professionalsData).map(([username, data]) => {
            // FIX: Cast `data` to `StoredProfessional` to resolve errors where properties
            // were being accessed on a variable inferred as `unknown` from `Object.entries`.
            const professionalData = data as StoredProfessional;
            return {
                username,
                name: professionalData.name,
                role: professionalData.role || 'professional',
                assignedServices: professionalData.assignedServices || [],
                bio: professionalData.bio || `Especialista em ${professionalData.assignedServices?.[0] || 'beleza e bem-estar'}.`,
                avatarUrl: professionalData.avatarUrl,
                workSchedule: professionalData.workSchedule || {},
            };
        }), 
    [professionalsData]);

    const clientHistory = useMemo(() => {
        if (!isPhoneSubmitted || !clientPhone) return [];
        return appointments
            .filter(a => a.clientPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, ''))
            .sort((a,b) => b.datetime.getTime() - a.datetime.getTime());
    }, [isPhoneSubmitted, clientPhone, appointments]);

    const formatPhone = (value: string): string => {
        let digits = value.replace(/\D/g, '');
        if (digits.length > 11) digits = digits.slice(0, 11);
        const len = digits.length;
        if (len > 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        if (len > 6) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        if (len > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return digits;
    };
    
    // --- Step Logic ---
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClientPhone(formatPhone(e.target.value));
    };
    
    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const existingClient = appointments.find(a => a.clientPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, ''));
        if (existingClient) {
            setClientName(existingClient.clientName);
        }
        setIsPhoneSubmitted(true);
        setStep(2);
    };
    
    const handleSelectProfessional = (prof: Professional) => {
        setSelectedProfessional(prof);
        setSelectedServices([]);
        setSelectedDateTime(null);
        setStep(3);
    };

    const handleServiceToggle = (service: Service) => {
        setSelectedServices(prev => 
            prev.some(s => s.name === service.name)
                ? prev.filter(s => s.name !== service.name)
                : [...prev, service]
        );
        setSelectedDateTime(null); // Reset date when services change
    };

    const handleDateTimeConfirm = (date: Date) => {
        setSelectedDateTime(date);
        setStep(5);
    };
    
    const handleBookingRequest = () => {
        if (!selectedProfessional || selectedServices.length === 0 || !selectedDateTime || !clientName) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
        const endTime = new Date(selectedDateTime.getTime() + totalDuration * 60 * 1000);

        const newRequest: Appointment = {
            id: Date.now(),
            clientName,
            clientPhone,
            professionalUsername: selectedProfessional.username,
            services: selectedServices,
            datetime: selectedDateTime,
            endTime,
            status: 'pending',
        };

        setAppointmentRequests(prev => [...prev, newRequest]);
        setStep(6); // Success step
    };
    
    // --- Render Methods ---
    
    const renderHeader = () => (
         <header className="text-center py-6 bg-[var(--surface-opaque)] border-b-2 border-[var(--border)]">
            <img src={logoUrl} alt="Spaço Delas Logo" className="h-20 w-20 rounded-full object-cover border-2 border-white/50 shadow-lg mx-auto mb-3" />
            <h1 className="font-brand text-5xl text-[var(--text-dark)]">Spaço Delas</h1>
            <p className="text-lg text-[var(--secondary)]">Agende seu horário online</p>
        </header>
    );

    const renderStep1_Phone = () => (
        <div className="animate-view-in">
            <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mb-2">Bem-vinda!</h2>
            <p className="text-center text-[var(--text-body)] mb-6">Digite seu telefone para começar ou ver seus agendamentos.</p>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <input
                    type="tel"
                    value={clientPhone}
                    onChange={handlePhoneChange}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full h-12 px-4 text-lg text-center bg-[var(--highlight)] border-2 border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    maxLength={15}
                    required
                />
                 <button type="submit" className="w-full py-3 btn-primary-gradient text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform active:scale-95">
                    Avançar
                </button>
            </form>
        </div>
    );

    const renderStep2_Professional = () => {
        const availableProfessionals = professionalsList;

        return (
            <div className="animate-view-in">
                <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mb-4">Escolha uma profissional</h2>
                <div className="space-y-4">
                    {availableProfessionals.length > 0 ? (
                        availableProfessionals.map(prof => (
                            <button key={prof.username} onClick={() => handleSelectProfessional(prof)} className="w-full flex items-center gap-4 p-4 bg-white border border-[var(--border)] rounded-lg shadow-sm text-left hover:border-[var(--primary)] hover:shadow-md transition-all">
                                {prof.avatarUrl ? (
                                    <img src={prof.avatarUrl} alt={prof.name} className="h-16 w-16 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                    <div className="h-16 w-16 rounded-full flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                        <UserIcon />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-lg text-[var(--text-dark)]">{prof.name}</p>
                                    <p className="text-sm text-[var(--text-body)]">{prof.bio}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8 bg-white rounded-lg border border-dashed border-[var(--border)]">
                            <p className="text-[var(--secondary)] italic">Nenhuma profissional disponível para agendamento no momento.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
     const availableServices = useMemo(() => {
        if (!selectedProfessional) return [];
        const professional = professionalsList.find(p => p.username === selectedProfessional.username);
        if (!professional) return [];
        // A professional with an empty assignedServices array can still be booked if they have a 'professional' role.
        // It's the admin's responsibility to assign services. If none are assigned, the list will be empty, which is correct.
        if (professional.role === 'admin') return services;
        return services.filter(s => professional.assignedServices.includes(s.name));
    }, [selectedProfessional, services, professionalsList]);

    const renderStep3_Services = () => (
        <div className="animate-view-in">
            <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mb-4">Selecione os serviços</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto p-2 -m-2">
                {availableServices.length > 0 ? availableServices.map(service => {
                    const isSelected = selectedServices.some(s => s.name === service.name);
                    return (
                        <div key={service.name} onClick={() => handleServiceToggle(service)} className={`flex justify-between items-center p-4 rounded-lg cursor-pointer transition-all border-2 ${isSelected ? 'bg-green-50 border-[var(--success)]' : 'bg-white border-[var(--border)] hover:border-[var(--accent)]'}`}>
                            <div>
                                <p className="font-bold text-[var(--text-dark)]">{service.name}</p>
                                <p className="text-sm text-[var(--secondary)]">{service.duration} min</p>
                            </div>
                            <p className="font-semibold text-lg text-[var(--success)]">{service.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    );
                }) : (
                    <p className="text-center italic text-[var(--secondary)] py-4">Nenhum serviço disponível para esta profissional.</p>
                )}
            </div>
             <button onClick={() => setStep(4)} disabled={selectedServices.length === 0} className="mt-6 w-full py-3 btn-primary-gradient text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale">
                Escolher Horário
            </button>
        </div>
    );
    
    // Time Picker (integrated into Step 4)
    const TimePicker = () => {
        const [viewDate, setViewDate] = useState(new Date());
        const [selectedDay, setSelectedDay] = useState<Date | null>(null);

        const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + s.duration, 0), [selectedServices]);

        const calendarGrid = useMemo(() => {
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // FIX: Use `React.ReactElement` to explicitly reference the type from the imported React module, resolving the "Cannot find namespace 'JSX'" error.
            const grid: React.ReactElement[] = [];
            for (let i = 0; i < firstDayOfMonth; i++) {
                grid.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const fullDate = new Date(year, month, day);
                const isPast = fullDate < new Date(new Date().toDateString());
                const isSelected = selectedDay?.toDateString() === fullDate.toDateString();
                const isBlocked = blockedSlots.some(s => s.isFullDay && new Date(s.date).toDateString() === fullDate.toDateString());
                
                const dayOfWeek = fullDate.getDay() as (0 | 1 | 2 | 3 | 4 | 5 | 6);
                const isDayOff = selectedProfessional?.workSchedule?.[dayOfWeek] === null;

                grid.push(
                     <div key={day} onClick={() => !(isPast || isBlocked || isDayOff) && setSelectedDay(fullDate)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all text-sm ${isPast || isBlocked || isDayOff ? 'text-gray-400 cursor-not-allowed line-through' : 'cursor-pointer hover:bg-[var(--border)]'} ${isSelected ? 'bg-[var(--primary)] text-white font-bold' : ''}`}>
                        {day}
                    </div>
                );
            }
            return grid;
        }, [viewDate, selectedDay, blockedSlots, selectedProfessional]);

        const suggestedTimes = useMemo(() => {
            if (!selectedDay || !selectedProfessional) return [];
            
            const dayOfWeek = selectedDay.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

            // Determine if a schedule is configured. It's configured if it's not undefined and has keys.
            const schedule = selectedProfessional.workSchedule;
            const isScheduleConfigured = schedule && Object.keys(schedule).length > 0;
            const workDay = schedule?.[dayOfWeek];

            if (isScheduleConfigured && !workDay) {
                // A schedule is set up, but this day is not in it or is null, so it's a day off.
                return [];
            }
    
            // Use the specific work day hours, or fallback to the full day if no schedule is configured.
            const workStartTime = workDay?.start || '07:00';
            const workEndTime = workDay?.end || '20:00';

            const dayStr = selectedDay.toDateString();
            const busySlots = new Set<string>();

            // Blocked slots
            blockedSlots.forEach(slot => {
                if (new Date(slot.date).toDateString() !== dayStr) return;
                // Simplified: assuming all blocks apply to all professionals for now
                if (slot.isFullDay) TIMES.forEach(time => busySlots.add(time));
                else if (slot.startTime) {
                    const start = slot.startTime;
                    const end = slot.endTime || TIMES[TIMES.indexOf(start) + 1] || start;
                    TIMES.forEach(time => { if (time >= start && time < end) busySlots.add(time) });
                }
            });

            // Appointments for the selected professional
            appointments.forEach(appt => {
                if (appt.professionalUsername !== selectedProfessional.username) return;
                if (new Date(appt.datetime).toDateString() !== dayStr) return;
                
                const startTime = appt.datetime.getTime();
                const endTime = appt.endTime.getTime();

                TIMES.forEach(timeStr => {
                    const [h, m] = timeStr.split(':').map(Number);
                    const checkTime = new Date(selectedDay).setHours(h, m, 0, 0);
                    if (checkTime >= startTime && checkTime < endTime) {
                        busySlots.add(timeStr);
                    }
                });
            });

            const availableStartTimes: string[] = [];
            const slotsNeeded = Math.ceil(totalDuration / 30);
            
            const today = new Date();
            const isTodaySelected = selectedDay.toDateString() === today.toDateString();

            for (let i = 0; i <= TIMES.length - slotsNeeded; i++) {
                const startTimeCandidate = TIMES[i];
                const endTimeCandidate = TIMES[i + slotsNeeded - 1];
                
                if (startTimeCandidate < workStartTime || endTimeCandidate >= workEndTime) {
                    continue;
                }

                if (isTodaySelected) {
                    const [h, m] = startTimeCandidate.split(':').map(Number);
                    const candidateDate = new Date();
                    candidateDate.setHours(h, m, 0, 0);
                    if (candidateDate < today) continue;
                }

                let isSequenceAvailable = true;
                for (let j = 0; j < slotsNeeded; j++) {
                    if (busySlots.has(TIMES[i + j])) {
                        isSequenceAvailable = false;
                        break;
                    }
                }
                if (isSequenceAvailable) availableStartTimes.push(startTimeCandidate);
            }
            return availableStartTimes;
        }, [selectedDay, selectedProfessional, totalDuration, appointments, blockedSlots]);

        return (
            <div>
                 <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() -1, 1))} className="p-2 rounded-full hover:bg-[var(--highlight)]">&lt;</button>
                    <h4 className="font-bold">{`${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}</h4>
                    <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-[var(--highlight)]">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--secondary)] mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d,i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-4 place-items-center">
                    {calendarGrid}
                </div>
                {/* Time Slots */}
                {selectedDay && (
                     <div className="border-t border-[var(--border)] pt-4">
                        <h4 className="font-bold text-center mb-2">Horários para {selectedDay.toLocaleDateString('pt-BR', {day: '2-digit', month: 'long'})}</h4>
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                            {suggestedTimes.length > 0 ? (
                                suggestedTimes.map(time => {
                                    const [h,m] = time.split(':').map(Number);
                                    const finalDate = new Date(selectedDay);
                                    finalDate.setHours(h,m);
                                    return (
                                        <button key={time} onClick={() => handleDateTimeConfirm(finalDate)} className="p-2 rounded-lg bg-[var(--highlight)] hover:bg-[var(--accent)] transition">
                                            {time}
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="col-span-full text-center text-[var(--secondary)] italic py-4">Nenhum horário disponível para a duração selecionada.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderStep4_DateTime = () => (
         <div className="animate-view-in">
            <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mb-1">Escolha a data e hora</h2>
             <div className="text-center text-sm text-[var(--text-body)] mb-4 p-2 bg-[var(--highlight)] rounded-lg border border-dashed border-[var(--border)]">
                <p><strong>Profissional:</strong> {selectedProfessional?.name}</p>
                <p><strong>Serviços:</strong> {selectedServices.map(s => s.name).join(', ')}</p>
            </div>
            <TimePicker />
        </div>
    );
    
    const renderStep5_Confirm = () => (
        <div className="animate-view-in">
            <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mb-4">Confirme seu agendamento</h2>
            <div className="bg-white p-4 rounded-lg border border-[var(--border)] space-y-2 text-md">
                <p><strong>Profissional:</strong> {selectedProfessional?.name}</p>
                <p><strong>Serviços:</strong> {selectedServices.map(s => s.name).join(', ')}</p>
                <p><strong>Data:</strong> {selectedDateTime?.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                <p className="font-bold text-xl text-[var(--success)]"><strong>Total:</strong> {selectedServices.reduce((s,i) => s + i.value, 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
            </div>
            <div className="mt-4">
                 <label htmlFor="client-name" className="block font-medium text-[var(--text-dark)] mb-1">Seu nome completo:</label>
                 <input type="text" id="client-name" value={clientName} onChange={e => setClientName(e.target.value)} required className="w-full h-11 px-3 bg-[var(--highlight)] border-2 border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"/>
            </div>
            <button onClick={handleBookingRequest} className="mt-6 w-full py-3 btn-primary-gradient text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform active:scale-95">
                Enviar Solicitação
            </button>
        </div>
    );
    
    const renderStep6_Success = () => (
        <div className="animate-view-in text-center">
             <svg className="success-checkmark mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h2 className="text-2xl font-bold text-center text-[var(--text-dark)] mt-4 mb-2">Solicitação Enviada!</h2>
            <p className="text-[var(--text-body)] mb-6">Seu pedido foi enviado com sucesso. Aguarde a confirmação da nossa equipe via WhatsApp.</p>
            <button onClick={() => window.location.reload()} className="w-full max-w-sm py-3 btn-primary-gradient text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform active:scale-95">
                Agendar Novo Horário
            </button>
        </div>
    );
    
     const renderHistory = () => (
        <div className="animate-view-in mt-6">
            <button onClick={() => setShowHistory(prev => !prev)} className="font-bold text-[var(--primary)] w-full text-left mb-2">
                {showHistory ? 'Ocultar Histórico' : 'Ver Meus Agendamentos'}
            </button>
            {showHistory && (
                 <div className="space-y-3 max-h-60 overflow-y-auto border-t-2 border-[var(--border)] pt-3">
                    {clientHistory.length > 0 ? clientHistory.map(appt => (
                         <div key={appt.id} className="p-3 bg-white border-l-4 border-[var(--primary)] rounded-r-md">
                            <p className="font-bold">{appt.datetime.toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</p>
                            <p className="text-sm">{appt.services.map(s => s.name).join(', ')}</p>
                            <p className="text-sm font-semibold capitalize">Status: {appt.status}</p>
                        </div>
                    )) : <p className="text-center italic text-[var(--secondary)]">Nenhum agendamento encontrado.</p>}
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-[var(--background)] min-h-screen font-sans">
            {renderHeader()}
            <main className="p-4 sm:p-8 max-w-2xl mx-auto">
                <div className="bg-[var(--surface-opaque)] p-6 rounded-2xl shadow-lg border border-[var(--border)]">
                    {!isPhoneSubmitted && renderStep1_Phone()}
                    {isPhoneSubmitted && (
                        <>
                            <div className="flex justify-between items-center text-sm mb-4">
                               <p className="text-[var(--text-body)]">Telefone: <strong>{clientPhone}</strong></p>
                               <button onClick={() => { setIsPhoneSubmitted(false); setStep(1); }} className="font-semibold text-[var(--primary)] hover:underline">Trocar</button>
                            </div>

                            {step > 1 && step < 6 && (
                                <div className="flex items-center justify-between text-sm mb-4 border-b border-[var(--border)] pb-4">
                                    <button
                                        onClick={() => {
                                            if (step === 2) {
                                                setIsPhoneSubmitted(false);
                                                setClientPhone('');
                                                setClientName('');
                                                setStep(1);
                                            } else {
                                                setStep(prev => prev - 1);
                                            }
                                        }}
                                        className="font-semibold text-[var(--primary)] hover:underline"
                                    >
                                        &larr; Voltar
                                    </button>
                                    <span className="font-bold text-[var(--secondary)]">Passo {step-1} de 4</span>
                                </div>
                            )}

                            {step === 2 && renderStep2_Professional()}
                            {step === 3 && renderStep3_Services()}
                            {step === 4 && renderStep4_DateTime()}
                            {step === 5 && renderStep5_Confirm()}
                            {step === 6 && renderStep6_Success()}
                        </>
                    )}
                </div>
                {isPhoneSubmitted && step !== 6 && renderHistory()}
            </main>
        </div>
    );
};

export default PublicBookingPage;