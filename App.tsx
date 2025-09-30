import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Appointment, ModalInfo, Client, BlockedSlot } from './types';
import Header from './components/Header';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import Modal from './components/Modal';
import RevenueDashboard from './components/RevenueDashboard';
import ClientList from './components/ClientList';
import DateTimePickerModal from './components/DateTimePickerModal';

const APP_STORAGE_KEY = 'spacoDelasAppointments';
const BLOCKED_SLOTS_STORAGE_KEY = 'spacoDelasBlockedSlots';

const AgendaManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM7 16h.01M12 16h.01M17 16h.01" />
    </svg>
);


const AgendaManagement: React.FC<{
    blockedSlots: BlockedSlot[];
    onBlockSlot: (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => void;
    onUnblockSlot: (id: number) => void;
}> = ({ blockedSlots, onBlockSlot, onUnblockSlot }) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleDateSelectAndBlock = (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => {
        onBlockSlot(data);
        setIsPickerOpen(false);
    };

    return (
        <>
            <div className="border-t-2 border-pink-200 pt-8 mt-8">
                <h2 className="text-2xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                    Gerenciar Agenda
                    <AgendaManagementIcon />
                </h2>

                <div className="mb-6 text-center">
                    <button
                        onClick={() => setIsPickerOpen(true)}
                        className="w-full py-3 px-4 bg-yellow-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-transform transform hover:scale-105"
                    >
                        Bloquear Horário
                    </button>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-purple-700 mb-3 text-center">Horários Bloqueados</h3>
                     <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 max-h-48">
                        {blockedSlots.length === 0 ? (
                            <p className="text-purple-600 text-center italic">Nenhum horário bloqueado.</p>
                        ) : (
                            blockedSlots.map(slot => (
                                <div key={slot.id} className="bg-white p-3 rounded-lg shadow flex items-center justify-between">
                                    <p className="font-semibold text-purple-800">
                                        {slot.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        {' - '}
                                        {slot.isFullDay ? 'Dia Inteiro' : (slot.endTime ? `${slot.startTime} às ${slot.endTime}` : slot.startTime)}
                                    </p>
                                    <button
                                        onClick={() => onUnblockSlot(slot.id)}
                                        className="px-3 py-1 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-colors text-sm"
                                    >
                                        Desbloquear
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <DateTimePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onConfirm={handleDateSelectAndBlock}
                showBlockDayToggle={true}
                blockedSlots={blockedSlots}
            />
        </>
    );
};

const DataManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7l8 5 8-5M12 22V12" />
    </svg>
);

const DataManagement: React.FC<{
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ onExport, onImport }) => {
    const importInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="border-t-2 border-pink-200 pt-8 mt-8">
            <h2 className="text-2xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                Gerenciar Dados
                <DataManagementIcon />
            </h2>
            <div className="space-y-3 text-center">
                <button
                    onClick={onExport}
                    className="w-full py-3 px-4 bg-blue-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
                >
                    Exportar (Salvar Backup)
                </button>
                <input
                    type="file"
                    ref={importInputRef}
                    onChange={onImport}
                    accept=".json"
                    className="hidden"
                    id="import-file-input"
                />
                <button
                    onClick={() => importInputRef.current?.click()}
                    className="w-full py-3 px-4 bg-green-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105"
                >
                    Importar (Carregar Backup)
                </button>
                <p className="text-sm text-pink-600 italic pt-2">
                    Salve seus dados em um arquivo para não perdê-los ao atualizar o app.
                </p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>(() => {
        try {
            const savedAppointments = localStorage.getItem(APP_STORAGE_KEY);
            if (savedAppointments) {
                const parsedAppointments = JSON.parse(savedAppointments) as (Omit<Appointment, 'datetime'> & { datetime: string })[];
                return parsedAppointments.map(appt => ({
                    ...appt,
                    datetime: new Date(appt.datetime),
                }));
            }
        } catch (error) {
            console.error("Failed to load appointments from local storage", error);
        }
        return [];
    });
    
     const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() => {
        try {
            const savedBlockedSlots = localStorage.getItem(BLOCKED_SLOTS_STORAGE_KEY);
            if (savedBlockedSlots) {
                const parsedSlots = JSON.parse(savedBlockedSlots) as any[];
                 return parsedSlots.map(slot => ({
                    id: slot.id,
                    date: new Date(slot.date),
                    isFullDay: slot.isFullDay,
                    startTime: slot.startTime || slot.time, 
                    endTime: slot.endTime,
                }));
            }
        } catch (error) {
            console.error("Failed to load blocked slots from local storage", error);
        }
        return [];
    });

    const [modalInfo, setModalInfo] = useState<ModalInfo>({
        isOpen: false,
        title: '',
        message: '',
    });

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [activeView, setActiveView] = useState<'appointments' | 'clients'>('appointments');
    const [notificationAppointments, setNotificationAppointments] = useState<Appointment[]>([]);
    const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
    const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<number | null>(null);
    const [removingAppointmentId, setRemovingAppointmentId] = useState<number | null>(null);


    useEffect(() => {
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appointments));
        } catch (error) {
            console.error("Failed to save appointments to local storage", error);
        }
    }, [appointments]);
    
    useEffect(() => {
        try {
            localStorage.setItem(BLOCKED_SLOTS_STORAGE_KEY, JSON.stringify(blockedSlots));
        } catch (error) {
            console.error("Failed to save blocked slots to local storage", error);
        }
    }, [blockedSlots]);

     useEffect(() => {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const upcoming = appointments.filter(appt => 
            appt.status === 'scheduled' &&
            appt.datetime > now &&
            appt.datetime <= twentyFourHoursFromNow
        );
        setNotificationAppointments(upcoming);
    }, [appointments]);

    useEffect(() => {
        if (highlightedAppointmentId) {
            const timer = setTimeout(() => {
                setHighlightedAppointmentId(null);
            }, 2000); // Highlight for 2 seconds
            return () => clearTimeout(timer);
        }
    }, [highlightedAppointmentId]);

    const handleToggleNotificationPopover = useCallback(() => {
        setIsNotificationPopoverOpen(prev => !prev);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const notificationBell = document.getElementById('notification-bell');
            if (isNotificationPopoverOpen && notificationBell && !notificationBell.contains(event.target as Node)) {
                setIsNotificationPopoverOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationPopoverOpen]);

    const showModal = (title: string, message: string) => {
        setModalInfo({ isOpen: true, title, message });
    };

    const closeModal = () => {
        setModalInfo({ isOpen: false, title: '', message: '' });
    };
    
    const handleBlockSlot = useCallback((data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => {
        const { date, isFullDay, startTime, endTime } = data;
        const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const timeToMins = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + (m || 0);
        };

        const newStartMins = startTime ? timeToMins(startTime) : 0;
        const newEndMins = endTime ? timeToMins(endTime) : (startTime ? newStartMins + 60 : 1440);

        const conflict = blockedSlots.some(s => {
            const sameDay = s.date.toDateString() === slotDate.toDateString();
            if (!sameDay) return false;

            if (s.isFullDay || isFullDay) return true;
            
            if (!s.startTime && !startTime) return false;

            const existingStartMins = s.startTime ? timeToMins(s.startTime) : 0;
            const existingEndMins = s.endTime ? timeToMins(s.endTime) : (s.startTime ? existingStartMins + 60 : 1440);

            return newStartMins < existingEndMins && newEndMins > existingStartMins;
        });


        if (conflict) {
            showModal("Aviso", "Este período de tempo entra em conflito com um bloqueio existente.");
            return;
        }

        const newSlot: BlockedSlot = {
            id: Date.now(),
            date: slotDate,
            isFullDay,
            startTime,
            endTime
        };

        setBlockedSlots(prev => {
            const updated = [...prev, newSlot];
            updated.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || ""));
            return updated;
        });

        const dateStr = slotDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        let message: string;
        if (isFullDay) {
            message = `O dia ${dateStr} foi bloqueado.`;
        } else if (endTime) {
            message = `O período das ${startTime} às ${endTime} do dia ${dateStr} foi bloqueado.`;
        } else {
            message = `O horário das ${startTime} do dia ${dateStr} foi bloqueado.`;
        }
        showModal("Sucesso", message);

    }, [blockedSlots]);

    const handleUnblockSlot = useCallback((id: number) => {
        const slotToUnblock = blockedSlots.find(s => s.id === id);
        if (slotToUnblock) {
            setBlockedSlots(prev => prev.filter(s => s.id !== id));
            const dateStr = slotToUnblock.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
             let message: string;
            if (slotToUnblock.isFullDay) {
                message = `O dia ${dateStr} foi desbloqueado.`;
            } else if (slotToUnblock.endTime) {
                message = `O período das ${slotToUnblock.startTime} às ${slotToUnblock.endTime} do dia ${dateStr} foi desbloqueado.`;
            } else {
                message = `O horário das ${slotToUnblock.startTime} do dia ${dateStr} foi desbloqueado.`;
            }
            showModal("Sucesso", message);
        }
    }, [blockedSlots]);


    const handleScheduleAppointment = useCallback((newAppointmentData: Omit<Appointment, 'id' | 'status'>): boolean => {
        if (newAppointmentData.datetime < new Date()) {
            showModal("Erro", "Não é possível agendar um horário no passado.");
            return false;
        }

        const appointmentDay = newAppointmentData.datetime.toDateString();
        const isDayBlocked = blockedSlots.some(s => s.isFullDay && s.date.toDateString() === appointmentDay);
        if (isDayBlocked) {
            showModal("Erro", "Não é possível agendar neste dia, pois ele está bloqueado.");
            return false;
        }
        
        const timeToMins = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + (m || 0);
        };
        const appointmentTimeStr = `${String(newAppointmentData.datetime.getHours()).padStart(2, '0')}:00`;
        const appointmentMins = timeToMins(appointmentTimeStr);

        const isTimeBlocked = blockedSlots.some(s => {
            if (s.isFullDay || s.date.toDateString() !== appointmentDay || !s.startTime) return false;
            
            const startMins = timeToMins(s.startTime);
            const endMins = s.endTime ? timeToMins(s.endTime) : startMins + 60;
            
            return appointmentMins >= startMins && appointmentMins < endMins;
        });

        if (isTimeBlocked) {
            showModal("Erro", "Este horário está bloqueado.");
            return false;
        }

        const newAppointment: Appointment = {
            ...newAppointmentData,
            id: Date.now(),
            status: 'scheduled',
            reminderSent: false,
        };

        setAppointments(prevAppointments => {
            const updatedAppointments = [...prevAppointments, newAppointment];
            updatedAppointments.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
            return updatedAppointments;
        });
        
        setHighlightedAppointmentId(newAppointment.id);
        
        const dateStr = newAppointment.datetime.toLocaleDateString('pt-BR');
        const timeStr = newAppointment.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        showModal(
            "Sucesso",
            `Agendamento para ${newAppointment.service} para a cliente ${newAppointment.clientName} marcado para ${dateStr} às ${timeStr}.`
        );
        
        const sanitizedClientPhone = newAppointment.clientPhone.replace(/\D/g, '');
        let fullPhoneNumberForApi = sanitizedClientPhone;

        if (!fullPhoneNumberForApi.startsWith('55')) {
            fullPhoneNumberForApi = `55${fullPhoneNumberForApi}`;
        }

        const clientMessage = `Olá, ${newAppointment.clientName}! ✨\n\nSeu agendamento no salão foi confirmado com sucesso!\n\n*Serviço:* ${newAppointment.service}\n*Valor:* R$ ${newAppointment.value.toFixed(2)}\n*Data:* ${newAppointment.datetime.toLocaleDateString('pt-BR')}\n*Hora:* ${newAppointment.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\nMal podemos esperar para te ver! 🌸`;
        const encodedClientMessage = encodeURIComponent(clientMessage);
        const clientWhatsappUrl = `https://wa.me/${fullPhoneNumberForApi}?text=${encodedClientMessage}`;
        window.open(clientWhatsappUrl, '_blank');
        
        return true;

    }, [blockedSlots]);

    const handleCancelAppointment = useCallback((appointmentId: number) => {
        const appointmentToCancel = appointments.find(appt => appt.id === appointmentId);
        if (appointmentToCancel) {
            setRemovingAppointmentId(appointmentId);
            setTimeout(() => {
                setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
                setRemovingAppointmentId(null);
                showModal(
                    "Cancelado",
                    `O agendamento para ${appointmentToCancel.service} de ${appointmentToCancel.clientName} foi cancelado.`
                );
            }, 500); // Match animation duration
        }
    }, [appointments]);

    const handleStartEdit = useCallback((appointment: Appointment) => {
        setEditingAppointment(appointment);
        setActiveView('appointments'); 
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingAppointment(null);
    }, []);

    const handleUpdateAppointment = useCallback((updatedAppointment: Appointment): boolean => {
        const appointmentDay = updatedAppointment.datetime.toDateString();
        const isDayBlocked = blockedSlots.some(s => s.isFullDay && s.date.toDateString() === appointmentDay);

        if (isDayBlocked) {
            showModal("Erro", "Não é possível mover o agendamento para este dia, pois ele está bloqueado.");
            return false;
        }

        const timeToMins = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + (m || 0);
        };
        const appointmentTimeStr = `${String(updatedAppointment.datetime.getHours()).padStart(2, '0')}:00`;
        const appointmentMins = timeToMins(appointmentTimeStr);

        const isTimeBlocked = blockedSlots.some(s => {
            if (s.isFullDay || s.date.toDateString() !== appointmentDay || !s.startTime) return false;
            
            const startMins = timeToMins(s.startTime);
            const endMins = s.endTime ? timeToMins(s.endTime) : startMins + 60;
            
            return appointmentMins >= startMins && appointmentMins < endMins;
        });
        
        if (isTimeBlocked) {
            showModal("Erro", "Este horário está bloqueado.");
            return false;
        }

        setAppointments(prevAppointments => {
            const updatedList = prevAppointments.map(appt =>
                appt.id === updatedAppointment.id ? updatedAppointment : appt
            );
            updatedList.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
            return updatedList;
        });
        setEditingAppointment(null);
        setHighlightedAppointmentId(updatedAppointment.id);
        showModal("Sucesso", "Agendamento atualizado com sucesso!");
        return true;
    }, [blockedSlots]);


    const handleCompleteAppointment = useCallback((appointmentId: number) => {
        const completedAppt = appointments.find(a => a.id === appointmentId);
        if(completedAppt) {
            setRemovingAppointmentId(appointmentId);
            setTimeout(() => {
                setAppointments(prev => 
                    prev.map(appt => 
                        appt.id === appointmentId ? { ...appt, status: 'completed' } : appt
                    )
                );
                setRemovingAppointmentId(null);
                showModal("Finalizado", `O agendamento de ${completedAppt.service} para ${completedAppt.clientName} foi marcado como finalizado.`);
            }, 500); // Match animation duration
        }
    }, [appointments]);

    const handleSendReminder = useCallback((appointmentId: number) => {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const sanitizedClientPhone = appointment.clientPhone.replace(/\D/g, '');
        let fullPhoneNumberForApi = sanitizedClientPhone;
        if (!fullPhoneNumberForApi.startsWith('55')) {
            fullPhoneNumberForApi = `55${fullPhoneNumberForApi}`;
        }
        
        const timeStr = appointment.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const reminderMessage = `Olá, ${appointment.clientName}! 🌸 Só para lembrar do seu agendamento de ${appointment.service} hoje às ${timeStr}. Te esperamos! ✨`;
        const encodedReminderMessage = encodeURIComponent(reminderMessage);
        const whatsappUrl = `https://wa.me/${fullPhoneNumberForApi}?text=${encodedReminderMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
        setAppointments(prev => 
            prev.map(appt => 
                appt.id === appointmentId ? { ...appt, reminderSent: true } : appt
            )
        );

    }, [appointments]);


    const handleExportData = useCallback(() => {
        try {
            const dataToExport = {
                appointments,
                blockedSlots,
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
            const link = document.createElement('a');
            link.href = jsonString;
            const date = new Date().toISOString().slice(0, 10);
            link.download = `spaco-delas-backup-${date}.json`;
            link.click();
            showModal("Sucesso", "Seu backup foi salvo com sucesso!");
        } catch (error) {
            console.error("Failed to export data", error);
            showModal("Erro", "Ocorreu um erro ao tentar exportar seus dados.");
        }
    }, [appointments, blockedSlots]);

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
    
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File content is not readable text.");
                }
                const data = JSON.parse(text);
    
                if (!data.appointments || !data.blockedSlots || !Array.isArray(data.appointments) || !Array.isArray(data.blockedSlots)) {
                    throw new Error("Arquivo de backup inválido ou corrompido.");
                }
                
                setConfirmation({
                    isOpen: true,
                    title: "Confirmar Importação",
                    message: "Todos os dados atuais serão substituídos pelos dados do arquivo. Esta ação não pode ser desfeita. Deseja continuar?",
                    onConfirm: () => {
                        const importedAppointments = data.appointments.map((appt: any) => ({
                            ...appt,
                            datetime: new Date(appt.datetime),
                        }));
                        const importedBlockedSlots = data.blockedSlots.map((slot: any) => ({
                            ...slot,
                            date: new Date(slot.date),
                        }));
                        
                        setAppointments(importedAppointments);
                        setBlockedSlots(importedBlockedSlots);
                        showModal("Sucesso", "Dados importados com sucesso!");
                        setConfirmation(null);
                    }
                });
    
            } catch (error) {
                console.error("Failed to import data", error);
                showModal("Erro", `Ocorreu um erro ao importar: ${error instanceof Error ? error.message : 'Erro desconhecido.'}`);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const upcomingAppointments = useMemo(() => {
        return appointments.filter(appt => appt.status === 'scheduled');
    }, [appointments]);

    const projectedRevenue = useMemo(() => {
        return upcomingAppointments.reduce((total, appt) => total + appt.value, 0);
    }, [upcomingAppointments]);

    const monthlyRevenue = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return appointments.reduce((total, appt) => {
            if (
                appt.status === 'completed' &&
                appt.datetime.getMonth() === currentMonth &&
                appt.datetime.getFullYear() === currentYear
            ) {
                return total + appt.value;
            }
            return total;
        }, 0);
    }, [appointments]);

    const clients = useMemo(() => {
        const clientData: { [phone: string]: { name: string; totalSpent: number; lastVisit: Date | null } } = {};

        appointments.forEach(appt => {
            if (!clientData[appt.clientPhone]) {
                clientData[appt.clientPhone] = {
                    name: appt.clientName,
                    totalSpent: 0,
                    lastVisit: null
                };
            }
            clientData[appt.clientPhone].name = appt.clientName;

            if (appt.status === 'completed') {
                clientData[appt.clientPhone].totalSpent += appt.value;
                const currentLastVisit = clientData[appt.clientPhone].lastVisit;
                if (!currentLastVisit || appt.datetime > currentLastVisit) {
                    clientData[appt.clientPhone].lastVisit = appt.datetime;
                }
            }
        });

        const clientList: Client[] = Object.entries(clientData).map(([phone, data]) => {
            let daysSinceLastVisit: number | null = null;
            if (data.lastVisit) {
                const diffTime = Math.abs(new Date().getTime() - data.lastVisit.getTime());
                daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return {
                phone,
                name: data.name,
                totalSpent: data.totalSpent,
                daysSinceLastVisit,
            };
        });

        clientList.sort((a, b) => a.name.localeCompare(b.name));
        return clientList;
    }, [appointments]);

    const TabButton: React.FC<{ label: string; viewName: 'appointments' | 'clients' }> = ({ label, viewName }) => (
        <button
            onClick={() => setActiveView(viewName)}
            className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-colors duration-300 focus:outline-none ${
                activeView === viewName
                    ? 'bg-white/80 text-pink-600 shadow-inner'
                    : 'bg-transparent text-pink-800 hover:bg-white/40'
            }`}
        >
            {label}
        </button>
    );

    const sparkleSvg = `<svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 L55.9 44.1 L100 50 L55.9 55.9 L50 100 L44.1 55.9 L0 50 L44.1 44.1 Z" fill="rgba(236, 72, 153, 0.08)" /></svg>`;
    const bgStyle = { backgroundImage: `url('data:image/svg+xml;base64,${btoa(sparkleSvg)}')` };


    return (
        <div className="min-h-screen bg-pink-50 text-pink-900 font-sans p-4 sm:p-6 md:p-8" style={bgStyle}>
            <div className="max-w-7xl mx-auto relative">
                <Header 
                    notificationAppointments={notificationAppointments}
                    isNotificationPopoverOpen={isNotificationPopoverOpen}
                    onToggleNotificationPopover={handleToggleNotificationPopover}
                />
                
                <div className="mt-8 flex justify-center border-b-2 border-pink-200">
                    <TabButton label="Agendamentos" viewName="appointments" />
                    <TabButton label="Clientes" viewName="clients" />
                </div>

                <main className="mt-2">
                    {activeView === 'appointments' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100">
                                <AppointmentForm 
                                    onSchedule={handleScheduleAppointment}
                                    appointmentToEdit={editingAppointment}
                                    onUpdate={handleUpdateAppointment}
                                    onCancelEdit={handleCancelEdit}
                                    blockedSlots={blockedSlots}
                                />
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100">
                                <AppointmentList 
                                    appointments={upcomingAppointments} 
                                    onCancel={handleCancelAppointment}
                                    onComplete={handleCompleteAppointment}
                                    onEdit={handleStartEdit}
                                    onSendReminder={handleSendReminder}
                                    highlightedAppointmentId={highlightedAppointmentId}
                                    removingAppointmentId={removingAppointmentId}
                                />
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100">
                                <RevenueDashboard
                                    projectedRevenue={projectedRevenue}
                                    monthlyRevenue={monthlyRevenue}
                                />
                                 <AgendaManagement
                                    blockedSlots={blockedSlots}
                                    onBlockSlot={handleBlockSlot}
                                    onUnblockSlot={handleUnblockSlot}
                                />
                                 <DataManagement 
                                    onExport={handleExportData}
                                    onImport={handleImportData}
                                />
                            </div>
                        </div>
                    )}
                     {activeView === 'clients' && (
                        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100 mt-6">
                            <ClientList clients={clients} />
                        </div>
                    )}
                </main>
            </div>
            <Modal
                isOpen={modalInfo.isOpen}
                title={modalInfo.title}
                message={modalInfo.message}
                onClose={closeModal}
            />
            {confirmation && (
                <Modal
                    isOpen={confirmation.isOpen}
                    title={confirmation.title}
                    message={confirmation.message}
                    onClose={() => setConfirmation(null)}
                    onConfirm={confirmation.onConfirm}
                />
            )}
        </div>
    );
};

export default App;