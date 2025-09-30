import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Appointment, ModalInfo, Client, BlockedSlot } from './types';
import Header from './components/Header';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import Modal from './components/Modal';
import RevenueDashboard from './components/RevenueDashboard';
import ClientList from './components/ClientList';
import DateTimePickerModal from './components/DateTimePickerModal';
import BackupRestore from './components/BackupRestore';

const AgendaManagementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM7 16h.01M12 16h.01M17 16h.01" />
    </svg>
);

const AgendaManagement: React.FC<{
    blockedSlots: BlockedSlot[];
    onBlockSlot: (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => void;
    onUnblockSlot: (id: number) => void;
    appointments: Appointment[];
}> = ({ blockedSlots, onBlockSlot, onUnblockSlot, appointments }) => {
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
                                        {new Date(slot.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                appointments={appointments}
            />
        </>
    );
};


const ReminderBanner: React.FC<{ reminders: Appointment[]; onSend: () => void; onClose: () => void; }> = ({ reminders, onSend, onClose }) => {
    if (reminders.length === 0) return null;

    return (
        <div className="bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md my-4 relative" role="alert">
            <div className="flex items-center">
                <div className="py-1"><svg className="fill-current h-6 w-6 text-teal-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8h2v2H9v-2z"/></svg></div>
                <div>
                    <p className="font-bold">Lembretes Automáticos Prontos</p>
                    <p className="text-sm">Você tem {reminders.length} agendamento(s) que precisam de um lembrete.</p>
                </div>
                <div className="ml-auto">
                    <button 
                        onClick={onSend}
                        className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Enviar Agora
                    </button>
                </div>
            </div>
             <button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg className="fill-current h-6 w-6 text-teal-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
        </div>
    );
};


const App: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [modalInfo, setModalInfo] = useState<ModalInfo>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: undefined,
    });
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [activeView, setActiveView] = useState<'appointments' | 'clients'>('appointments');
    const [notificationAppointments, setNotificationAppointments] = useState<Appointment[]>([]);
    const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
    const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<number | null>(null);
    const [removingAppointmentId, setRemovingAppointmentId] = useState<number | null>(null);
    const [remindersToSend, setRemindersToSend] = useState<Appointment[]>([]);

    const nextId = useRef(Date.now());
    const backupTimeoutRef = useRef<number | null>(null);

    const showModal = (title: string, message: string, onConfirm?: () => void) => {
        setModalInfo({ isOpen: true, title, message, onConfirm });
    };

    const closeModal = () => {
        setModalInfo({ isOpen: false, title: '', message: '', onConfirm: undefined });
    };
    
    // Load data from localStorage on initial render
    useEffect(() => {
        try {
            const storedAppointments = localStorage.getItem('spa-appointments');
            if (storedAppointments) {
                const parsed = JSON.parse(storedAppointments).map((a: any) => ({ ...a, id: Number(a.id), datetime: new Date(a.datetime) }));
                setAppointments(parsed);
            }

            const storedBlockedSlots = localStorage.getItem('spa-blocked-slots');
            if (storedBlockedSlots) {
                const parsed = JSON.parse(storedBlockedSlots).map((s: any) => ({ ...s, id: Number(s.id), date: new Date(s.date) }));
                setBlockedSlots(parsed);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            showModal("Erro", "Não foi possível carregar os dados salvos.");
        }
    }, []);

    // Save appointments to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('spa-appointments', JSON.stringify(appointments));
        } catch (error) {
            console.error("Failed to save appointments to localStorage", error);
        }
    }, [appointments]);

    // Save blocked slots to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('spa-blocked-slots', JSON.stringify(blockedSlots));
        } catch (error) {
            console.error("Failed to save blocked slots to localStorage", error);
        }
    }, [blockedSlots]);
    
    // Automatic backup logic
    useEffect(() => {
        if (backupTimeoutRef.current) {
            clearTimeout(backupTimeoutRef.current);
        }

        backupTimeoutRef.current = window.setTimeout(() => {
            if (appointments.length === 0 && blockedSlots.length === 0) {
                return; // Don't backup empty state
            }

            try {
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const backupKey = `spa-autobackup-${todayString}`;

                const backupData = { appointments, blockedSlots };
                localStorage.setItem(backupKey, JSON.stringify(backupData));
                
                // Clean up old backups, keeping the last 7
                const allBackupKeys = Object.keys(localStorage)
                    .filter(key => key.startsWith('spa-autobackup-'))
                    .sort() // Sorts YYYY-MM-DD strings correctly
                    .reverse(); // Newest first

                if (allBackupKeys.length > 7) {
                    const keysToRemove = allBackupKeys.slice(7);
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                }
            } catch (error) {
                console.error("Failed to create automatic backup", error);
            }
        }, 2000); // Debounce backup for 2 seconds after data change

        return () => {
            if (backupTimeoutRef.current) {
                clearTimeout(backupTimeoutRef.current);
            }
        };
    }, [appointments, blockedSlots]);


     useEffect(() => {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const upcoming = appointments.filter(appt => 
            appt.status === 'scheduled' &&
            new Date(appt.datetime) > now &&
            new Date(appt.datetime) <= twentyFourHoursFromNow
        );
        setNotificationAppointments(upcoming);
    }, [appointments]);

     // Automatic reminder checking
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const lowerBound = new Date(now.getTime() + 23 * 60 * 60 * 1000);
            const upperBound = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const dueForReminder = appointments.filter(appt => {
                if (appt.status !== 'scheduled' || appt.reminderSent) {
                    return false;
                }
                const apptTime = new Date(appt.datetime);
                return apptTime > lowerBound && apptTime <= upperBound;
            });
            
            setRemindersToSend(prev => {
                const existingIds = new Set(prev.map(r => r.id));
                const newReminders = dueForReminder.filter(r => !existingIds.has(r.id));
                return [...prev, ...newReminders];
            });
        };

        const intervalId = setInterval(checkReminders, 60 * 1000); // Check every minute

        return () => clearInterval(intervalId);
    }, [appointments]);


    useEffect(() => {
        if (highlightedAppointmentId) {
            const timer = setTimeout(() => setHighlightedAppointmentId(null), 2000);
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotificationPopoverOpen]);
    
     const checkAppointmentConflict = useCallback((datetime: Date, appointmentIdToIgnore: number | null = null): string | null => {
        const now = new Date();
        if (datetime < now && (!appointmentIdToIgnore || (now.getTime() - datetime.getTime()) > 60000)) {
            return "Não é possível agendar horários no passado.";
        }

        const appointmentTime = `${String(datetime.getHours()).padStart(2, '0')}:${String(datetime.getMinutes()).padStart(2, '0')}`;
        const appointmentDateStr = datetime.toDateString();

        for (const slot of blockedSlots) {
            if (new Date(slot.date).toDateString() !== appointmentDateStr) continue;
            if (slot.isFullDay) return "Este dia está totalmente bloqueado.";
            if (slot.endTime) {
                if (appointmentTime >= slot.startTime! && appointmentTime < slot.endTime) {
                    return `Este horário está indisponível (bloqueado de ${slot.startTime} às ${slot.endTime}).`;
                }
            } else if (appointmentTime === slot.startTime) {
                return `O horário das ${slot.startTime} está bloqueado.`;
            }
        }
        
        for (const appt of appointments) {
            if (appt.id === appointmentIdToIgnore) continue;
            if (appt.datetime.getTime() === datetime.getTime()) {
                 return `Já existe um agendamento para ${appt.clientName} neste mesmo horário.`;
            }
        }

        return null;
    }, [blockedSlots, appointments]);

    const handleBlockSlot = useCallback(async (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => {
        const newSlotDateStr = data.date.toDateString();
        const conflict = blockedSlots.some(s => {
            if (new Date(s.date).toDateString() !== newSlotDateStr) return false;
            if (s.isFullDay || data.isFullDay) return true;
            if (data.startTime && s.startTime) {
                const newStart = data.startTime;
                const newEnd = data.endTime || newStart;
                const existingStart = s.startTime;
                const existingEnd = s.endTime || existingStart;
                return newStart <= existingEnd && newEnd >= existingStart;
            }
            return false;
        });

        if (conflict) {
            showModal("Conflito de Horário", "O período selecionado entra em conflito com um bloqueio já existente.");
            return;
        }

        const newSlot: BlockedSlot = {
            ...data,
            id: nextId.current++,
        };
    
        setBlockedSlots(prev => [...prev, newSlot].sort((a,b) => a.date.getTime() - b.date.getTime()));
        showModal("Sucesso", "Horário bloqueado com sucesso.");
    }, [blockedSlots]);

    const handleUnblockSlot = useCallback(async (id: number) => {
        const slotToUnblock = blockedSlots.find(s => s.id === id);
        setBlockedSlots(prev => prev.filter(s => s.id !== id));
        showModal("Sucesso", `O bloqueio para ${slotToUnblock ? new Date(slotToUnblock.date).toLocaleDateString('pt-BR') : ''} foi removido.`);
    }, [blockedSlots]);

    const handleScheduleAppointment = useCallback(async (newAppointmentData: Omit<Appointment, 'id' | 'status'>): Promise<boolean> => {
        const conflictMessage = checkAppointmentConflict(newAppointmentData.datetime);
        if (conflictMessage) {
            showModal("Horário Indisponível", conflictMessage);
            return false;
        }
        
        const newAppointment: Appointment = {
            ...newAppointmentData,
            id: nextId.current++,
            status: 'scheduled',
        };

        setAppointments(prev => [...prev, newAppointment].sort((a, b) => a.datetime.getTime() - b.datetime.getTime()));
        setHighlightedAppointmentId(newAppointment.id);
        showModal("Sucesso", `Agendamento para ${newAppointment.clientName} marcado com sucesso.`);
        
        const sanitizedClientPhone = newAppointment.clientPhone.replace(/\D/g, '');
        const servicesText = newAppointment.services.map(s => s.name).join(', ');
        const totalValue = newAppointment.services.reduce((sum, s) => sum + s.value, 0);
        const clientMessage = `Olá, ${newAppointment.clientName}! ✨\n\nSeu agendamento no salão foi confirmado com sucesso!\n\n*Serviço(s):* ${servicesText}\n*Valor Total:* R$ ${totalValue.toFixed(2)}\n*Data:* ${new Date(newAppointment.datetime).toLocaleDateString('pt-BR')}\n*Hora:* ${new Date(newAppointment.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\nMal podemos esperar para te ver! 🌸`;
        window.open(`https://wa.me/55${sanitizedClientPhone}?text=${encodeURIComponent(clientMessage)}`, '_blank');
        return true;
    }, [checkAppointmentConflict, appointments, blockedSlots]);

    const handleCancelAppointment = useCallback(async (appointmentId: number) => {
        const appointmentToCancel = appointments.find(appt => appt.id === appointmentId);
        if (appointmentToCancel) {
            setRemovingAppointmentId(appointmentId);
            setTimeout(() => {
                setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
                setRemovingAppointmentId(null);
                showModal("Cancelado", `O agendamento de ${appointmentToCancel.clientName} foi cancelado.`);
            }, 500);
        }
    }, [appointments]);

    const handleStartEdit = useCallback((appointment: Appointment) => {
        setEditingAppointment(appointment);
        setActiveView('appointments'); 
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingAppointment(null);
    }, []);

    const handleUpdateAppointment = useCallback(async (updatedAppointment: Appointment): Promise<boolean> => {
        const conflictMessage = checkAppointmentConflict(updatedAppointment.datetime, updatedAppointment.id);
        if (conflictMessage) {
            showModal("Horário Indisponível", conflictMessage);
            return false;
        }

        setAppointments(prev => prev.map(appt => appt.id === updatedAppointment.id ? updatedAppointment : appt).sort((a, b) => a.datetime.getTime() - b.datetime.getTime()));
        setEditingAppointment(null);
        setHighlightedAppointmentId(updatedAppointment.id);
        showModal("Sucesso", "Agendamento atualizado com sucesso!");
        return true;
    }, [checkAppointmentConflict, appointments, blockedSlots]);


    const handleCompleteAppointment = useCallback(async (appointmentId: number) => {
        const completedAppt = appointments.find(a => a.id === appointmentId);
        if (completedAppt) {
            setRemovingAppointmentId(appointmentId);
            const updatedAppointment = { ...completedAppt, status: 'completed' as 'completed' };
            
            setTimeout(() => {
                 setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedAppointment : a));
                setRemovingAppointmentId(null);
                showModal("Finalizado", `O agendamento de ${completedAppt.clientName} foi marcado como finalizado.`);
            }, 500);
        }
    }, [appointments]);

    const sendWhatsAppMessage = (appointment: Appointment) => {
        const sanitizedClientPhone = appointment.clientPhone.replace(/\D/g, '');
        const servicesText = appointment.services.map(s => s.name).join(', ');
        const reminderMessage = `Olá, ${appointment.clientName}! 🌸 Passando para te lembrar do seu horário amanhã!\n\n*Serviço(s):* ${servicesText}\n*Data:* ${new Date(appointment.datetime).toLocaleDateString('pt-BR')}\n*Hora:* ${new Date(appointment.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\nQualquer imprevisto, por favor, nos avise com antecedência. Estamos te esperando! ✨`;
        window.open(`https://wa.me/55${sanitizedClientPhone}?text=${encodeURIComponent(reminderMessage)}`, '_blank');
    };

    const handleSendAllReminders = useCallback(() => {
        if (remindersToSend.length === 0) return;

        const sentIds = new Set<number>();
        remindersToSend.forEach(appt => {
            sendWhatsAppMessage(appt);
            sentIds.add(appt.id);
        });

        setAppointments(prev =>
            prev.map(appt =>
                sentIds.has(appt.id) ? { ...appt, reminderSent: true } : appt
            )
        );

        showModal("Sucesso", `${remindersToSend.length} lembrete(s) foram enviados.`);
        setRemindersToSend([]);
    }, [remindersToSend, appointments]);

    const handleSendReminder = useCallback(async (appointmentId: number) => {
        const apptToSendReminder = appointments.find(a => a.id === appointmentId);
        if (!apptToSendReminder) return;

        sendWhatsAppMessage(apptToSendReminder);
    
        const updatedAppointment = { ...apptToSendReminder, reminderSent: true };

        setAppointments(prev => prev.map(appt => appt.id === appointmentId ? updatedAppointment : appt));
        showModal("Lembrete Enviado", `O lembrete para ${apptToSendReminder.clientName} foi enviado.`);
    }, [appointments]);

     const handleExportData = useCallback(() => {
        try {
            const dataToExport = {
                appointments: appointments,
                blockedSlots: blockedSlots,
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(dataToExport, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            const date = new Date().toISOString().slice(0, 10);
            link.download = `backup-spaco-delas-${date}.json`;
            link.click();
            showModal("Sucesso", "Backup dos dados exportado com sucesso!");
        } catch (error) {
            console.error("Failed to export data", error);
            showModal("Erro", "Ocorreu um erro ao exportar os dados.");
        }
    }, [appointments, blockedSlots]);

    const handleImportData = useCallback((data: any) => {
        try {
            if (!data || !Array.isArray(data.appointments) || !Array.isArray(data.blockedSlots)) {
                throw new Error("Formato de arquivo inválido.");
            }

            const importedAppointments = data.appointments.map((a: any) => {
                const appointmentData: any = {
                    ...a,
                    id: Number(a.id),
                    datetime: new Date(a.datetime),
                };
    
                // Backward compatibility for old backup format
                if (a.service && typeof a.value !== 'undefined' && !a.services) {
                    appointmentData.services = [{ name: a.service, value: Number(a.value) }];
                    delete appointmentData.service;
                    delete appointmentData.value;
                } else if (!Array.isArray(a.services)) {
                    // Handle cases where services might be malformed
                    appointmentData.services = [];
                }
    
                return appointmentData;
            });

            const importedBlockedSlots = data.blockedSlots.map((s: any) => ({
                ...s,
                id: Number(s.id),
                date: new Date(s.date),
            }));

            setAppointments(importedAppointments);
            setBlockedSlots(importedBlockedSlots);
            
            const maxApptId = Math.max(0, ...importedAppointments.map((a: Appointment) => a.id));
            const maxSlotId = Math.max(0, ...importedBlockedSlots.map((s: BlockedSlot) => s.id));
            nextId.current = Math.max(Date.now(), maxApptId, maxSlotId) + 1;

            showModal("Sucesso", "Dados importados e restaurados com sucesso!");
        } catch (error) {
            console.error("Failed to import data", error);
            showModal("Erro", `Não foi possível importar os dados. Verifique o arquivo de backup. Detalhe: ${(error as Error).message}`);
        }
    }, []);

    const handleRestoreFromBackup = useCallback((backupData: any) => {
        showModal(
            "Confirmar Restauração",
            "Você tem certeza que deseja restaurar este backup? Os dados atuais serão substituídos. Esta ação não pode ser desfeita.",
            () => {
                handleImportData(backupData);
                closeModal();
            }
        );
    }, [handleImportData]);

    const upcomingAppointments = useMemo(() => {
        return appointments.filter(appt => appt.status === 'scheduled');
    }, [appointments]);

    const projectedRevenue = useMemo(() => {
        return upcomingAppointments.reduce((total, appt) => total + appt.services.reduce((subtotal, s) => subtotal + s.value, 0), 0);
    }, [upcomingAppointments]);

    const monthlyRevenue = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return appointments.reduce((total, appt) => {
            const apptDate = new Date(appt.datetime);
            if (
                appt.status === 'completed' &&
                apptDate.getMonth() === currentMonth &&
                apptDate.getFullYear() === currentYear
            ) {
                return total + appt.services.reduce((subtotal, s) => subtotal + s.value, 0);
            }
            return total;
        }, 0);
    }, [appointments]);

    const clients = useMemo(() => {
        const clientData: { [phone: string]: { name: string; totalSpent: number; lastVisit: Date | null } } = {};

        appointments.forEach(appt => {
            if (!clientData[appt.clientPhone]) {
                clientData[appt.clientPhone] = { name: appt.clientName, totalSpent: 0, lastVisit: null };
            }
            clientData[appt.clientPhone].name = appt.clientName;

            if (appt.status === 'completed') {
                clientData[appt.clientPhone].totalSpent += appt.services.reduce((subtotal, s) => subtotal + s.value, 0);
                const apptDate = new Date(appt.datetime);
                const currentLastVisit = clientData[appt.clientPhone].lastVisit;
                if (!currentLastVisit || apptDate > currentLastVisit) {
                    clientData[appt.clientPhone].lastVisit = apptDate;
                }
            }
        });

        const clientList: Client[] = Object.entries(clientData).map(([phone, data]) => {
            let daysSinceLastVisit: number | null = null;
            if (data.lastVisit) {
                const diffTime = Math.abs(new Date().getTime() - data.lastVisit.getTime());
                daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return { phone, name: data.name, totalSpent: data.totalSpent, daysSinceLastVisit };
        });

        clientList.sort((a, b) => a.name.localeCompare(b.name));
        return clientList;
    }, [appointments]);

    const TabButton: React.FC<{ label: string; viewName: 'appointments' | 'clients' }> = ({ label, viewName }) => (
        <button
            onClick={() => setActiveView(viewName)}
            className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-colors duration-300 focus:outline-none border-b-4 ${
                activeView === viewName
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-purple-400 hover:border-pink-300 hover:text-pink-500'
            }`}
            style={{ fontFamily: "'Lato', sans-serif" }}
        >
            {label}
        </button>
    );

    const panelClasses = "bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100";

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto relative">
                <Header 
                    notificationAppointments={notificationAppointments}
                    isNotificationPopoverOpen={isNotificationPopoverOpen}
                    onToggleNotificationPopover={handleToggleNotificationPopover}
                />
                 <ReminderBanner 
                    reminders={remindersToSend}
                    onSend={handleSendAllReminders}
                    onClose={() => setRemindersToSend([])}
                />
                
                <div className="mt-8 flex justify-center border-b-2 border-pink-200">
                    <TabButton label="Agendamentos" viewName="appointments" />
                    <TabButton label="Clientes" viewName="clients" />
                </div>

                <main className="mt-2">
                    {activeView === 'appointments' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                            <div className={panelClasses}>
                                <AppointmentForm 
                                    onSchedule={handleScheduleAppointment}
                                    appointmentToEdit={editingAppointment}
                                    onUpdate={handleUpdateAppointment}
                                    onCancelEdit={handleCancelEdit}
                                    blockedSlots={blockedSlots}
                                    appointments={appointments}
                                />
                            </div>
                            <div className={panelClasses}>
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
                            <div className={panelClasses}>
                                <RevenueDashboard
                                    projectedRevenue={projectedRevenue}
                                    monthlyRevenue={monthlyRevenue}
                                />
                                 <AgendaManagement
                                    blockedSlots={blockedSlots}
                                    onBlockSlot={handleBlockSlot}
                                    onUnblockSlot={handleUnblockSlot}
                                    appointments={appointments}
                                />
                                <BackupRestore
                                    onExport={handleExportData}
                                    onImport={handleImportData}
                                    onRestore={handleRestoreFromBackup}
                                />
                            </div>
                        </div>
                    )}
                     {activeView === 'clients' && (
                        <div className={`${panelClasses} mt-6`}>
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
                onConfirm={modalInfo.onConfirm}
            />
        </div>
    );
};

export default App;