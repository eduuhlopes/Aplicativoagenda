import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, BlockedSlot, Professional } from '../types';
import { TIMES, MONTHS } from '../constants';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarViewProps {
    appointments: Appointment[];
    blockedSlots: BlockedSlot[];
    onEditAppointment: (appointment: Appointment) => void;
    newlyAddedAppointmentId?: number | null;
    professionals: Professional[];
    currentUser: Professional;
}

const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useEffect(() => {
        const updateSize = () => {
            setSize([window.innerWidth, window.innerHeight]);
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
};

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return name.substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, blockedSlots, onEditAppointment, newlyAddedAppointmentId, professionals, currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [width] = useWindowSize();
    const isMobile = width < 640; // sm breakpoint

    const [view, setView] = useState<ViewType>(isMobile ? 'agenda' : 'month');
    const [professionalFilter, setProfessionalFilter] = useState<string>(currentUser.role === 'admin' ? 'all' : currentUser.username);

     useEffect(() => {
        setView(isMobile ? 'agenda' : 'month');
    }, [isMobile]);

    const filteredAppointments = useMemo(() => {
        if (professionalFilter === 'all') {
            return appointments;
        }
        return appointments.filter(a => a.professionalUsername === professionalFilter);
    }, [appointments, professionalFilter]);

    const changeDate = (amount: number, unit: 'day' | 'week' | 'month') => {
        let newDate = new Date(currentDate);
        if (unit === 'day') newDate.setDate(newDate.getDate() + amount);
        if (unit === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
        if (unit === 'month') newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const headerText = useMemo(() => {
        if (view === 'month') {
            return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        if (view === 'week' || view === 'agenda') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        }
        return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }, [currentDate, view]);

    const handleDayClick = (day: Date) => {
        setCurrentDate(day);
        setView(isMobile ? 'agenda' : 'day');
    };
    
    const renderView = () => {
        // Using a key that changes with the view ensures the animation re-triggers.
        const animationKey = `${view}-${currentDate.getTime()}-${professionalFilter}`;
        const commonViewProps = {
            date: currentDate,
            appointments: filteredAppointments,
            blockedSlots,
            onEditAppointment,
            newlyAddedAppointmentId,
            professionals,
        };

        switch (view) {
            case 'month':
                return <div key={animationKey} className="animate-view-in"><MonthView {...commonViewProps} onDayClick={handleDayClick} /></div>;
            case 'week':
                return <div key={animationKey} className="animate-view-in"><WeekView {...commonViewProps} /></div>;
            case 'day':
                return <div key={animationKey} className="animate-view-in"><DayView {...commonViewProps} /></div>;
            case 'agenda':
                 return <div key={animationKey} className="animate-view-in"><AgendaListView {...commonViewProps} /></div>;
            default:
                return null;
        }
    };

    const viewChangeButtons: { label: string, value: ViewType }[] = isMobile 
        ? [{ label: 'Agenda', value: 'agenda' }, { label: 'Mês', value: 'month' }]
        : [{ label: 'Mês', value: 'month' }, { label: 'Semana', value: 'week' }, { label: 'Dia', value: 'day' }];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                    <button onClick={goToToday} className="px-4 py-2 text-sm font-semibold bg-white border border-[var(--border)] rounded-md hover:bg-[var(--highlight)] transition-all active:scale-95">Hoje</button>
                    <button onClick={() => changeDate(-1, view === 'agenda' ? 'week' : view)} className="p-2 bg-white border border-[var(--border)] rounded-md hover:bg-[var(--highlight)] transition-all active:scale-95">‹</button>
                    <button onClick={() => changeDate(1, view === 'agenda' ? 'week' : view)} className="p-2 bg-white border border-[var(--border)] rounded-md hover:bg-[var(--highlight)] transition-all active:scale-95">›</button>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-dark)] text-center">{headerText}</h2>
                <div className="flex items-center bg-gray-200 rounded-md p-1">
                    {viewChangeButtons.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setView(value)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${view === value ? 'bg-[var(--primary)] text-white shadow' : 'text-[var(--text-body)] hover:bg-white'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
             {/* Professional Filter - Only for Admins */}
             {currentUser.role === 'admin' && professionals.length > 1 && (
                <div className="mb-4 flex justify-center sm:justify-end">
                    <select
                        value={professionalFilter}
                        onChange={(e) => setProfessionalFilter(e.target.value)}
                        className="h-10 px-3 py-2 bg-white border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                        <option value="all">Todas as Profissionais</option>
                        {professionals.map(p => (
                            <option key={p.username} value={p.username}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}
            {/* Calendar Body */}
            <div className="flex-grow overflow-y-auto">{renderView()}</div>
        </div>
    );
};


// #region Sub-Components (Month, Week, Day, Agenda Views)

interface ViewProps {
    date: Date;
    appointments: Appointment[];
    blockedSlots: BlockedSlot[];
    onEditAppointment: (a: Appointment) => void;
    newlyAddedAppointmentId?: number | null;
    professionals: Professional[];
}


const AgendaListView: React.FC<ViewProps> = ({ date, appointments, blockedSlots, onEditAppointment, newlyAddedAppointmentId, professionals }) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekDays = Array.from({ length: 7 }).map((_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));

    const eventsByDay = useMemo(() => {
        const events: { [key: string]: (Appointment | { type: 'blocked'; slot: BlockedSlot })[] } = {};
        weekDays.forEach(day => {
            const dayString = day.toDateString();
            const dayAppointments = appointments.filter(a => new Date(a.datetime).toDateString() === dayString && !['completed', 'cancelled'].includes(a.status));
            const dayBlocked = blockedSlots
                .filter(s => new Date(s.date).toDateString() === dayString)
                .map(slot => ({ type: 'blocked' as const, slot }));

            const combined = [...dayAppointments, ...dayBlocked].sort((a, b) => {
                const timeA = 'datetime' in a ? a.datetime.getTime() : new Date(a.slot.date).setHours(...(a.slot.startTime?.split(':').map(Number) ?? [0, 0]) as [number, number]);
                const timeB = 'datetime' in b ? b.datetime.getTime() : new Date(b.slot.date).setHours(...(b.slot.startTime?.split(':').map(Number) ?? [0, 0]) as [number, number]);
                return timeA - timeB;
            });
            if (combined.length > 0) {
                 events[dayString] = combined;
            }
        });
        return events;
    }, [weekDays, appointments, blockedSlots]);
    
    const hasEvents = Object.keys(eventsByDay).length > 0;

    return (
         <div className="space-y-4">
            {!hasEvents && (
                <div className="text-center py-10">
                    <p className="text-lg text-[var(--secondary)]">Nenhum agendamento ou bloqueio nesta semana.</p>
                </div>
            )}
            {weekDays.map(day => {
                const dayString = day.toDateString();
                const dayEvents = eventsByDay[dayString];
                if (!dayEvents) return null;

                const isToday = day.toDateString() === new Date().toDateString();
                return (
                    <div key={dayString}>
                        <h3 className={`font-bold text-lg text-[var(--text-dark)] p-2 sticky top-0 bg-[var(--surface-opaque)] z-10 ${isToday ? 'text-[var(--primary)]' : ''}`}>
                             {day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                         <div className="space-y-2">
                            {dayEvents.map((event, index) => {
                                if ('type' in event && event.type === 'blocked') {
                                    return (
                                        <div key={`block-${event.slot.id}`} className="flex items-center gap-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                            <div className="font-semibold text-red-700 w-20 text-center">
                                                {event.slot.isFullDay ? 'Dia Inteiro' : `${event.slot.startTime} - ${event.slot.endTime || ''}`}
                                            </div>
                                            <div className="text-red-800 font-medium">Horário Bloqueado</div>
                                        </div>
                                    );
                                }
                                const appt = event as Appointment;
                                const professional = professionals.find(p => p.username === appt.professionalUsername);
                                const isNew = appt.id === newlyAddedAppointmentId;
                                const borderColor = appt.status === 'delayed' ? 'border-[var(--warning)]' : 'border-[var(--primary)]';
                                return (
                                    <div 
                                        key={appt.id} 
                                        onClick={() => onEditAppointment(appt)} 
                                        className={`flex items-center gap-4 p-3 bg-white hover:bg-[var(--highlight)] cursor-pointer border-l-4 ${borderColor} rounded-r-lg shadow-sm ${isNew ? 'animate-new-item' : ''}`}
                                    >
                                        <div className="font-semibold text-[var(--text-dark)] w-20 text-center">
                                             {appt.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-[var(--text-dark)]">{appt.clientName}</p>
                                            <p className="text-sm text-[var(--secondary)]">{appt.services.map(s => s.name).join(', ')}</p>
                                        </div>
                                        {professional && (
                                            <div className="w-8 h-8 flex-shrink-0 bg-[var(--secondary)] text-white text-xs font-bold rounded-full flex items-center justify-center" title={professional.name}>
                                                {getInitials(professional.name)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
};


const MonthView: React.FC<ViewProps & { onDayClick: (day: Date) => void }> = ({ date, appointments, blockedSlots, onDayClick, onEditAppointment, newlyAddedAppointmentId, professionals }) => {
    const calendarDays = useMemo(() => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) days.push({ date: null });
        for (let day = 1; day <= daysInMonth; day++) days.push({ date: new Date(year, month, day) });

        return days;
    }, [date]);
    
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div>
             <div className="calendar-grid text-center font-semibold text-[var(--secondary)] mb-2">
                {weekDays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="calendar-grid">
                {calendarDays.map((dayInfo, i) => {
                    if (!dayInfo.date) return <div key={`empty-${i}`} className="calendar-day-cell other-month border border-[var(--border)] rounded-md"></div>;

                    const dayAppointments = appointments.filter(a => new Date(a.datetime).toDateString() === dayInfo.date!.toDateString() && !['completed', 'cancelled'].includes(a.status));
                    const isBlocked = blockedSlots.some(s => s.isFullDay && new Date(s.date).toDateString() === dayInfo.date!.toDateString());
                    const isToday = dayInfo.date.toDateString() === new Date().toDateString();

                    return (
                        <div key={i} className={`calendar-day-cell p-2 border border-[var(--border)] rounded-md ${isToday ? 'is-today' : ''} ${isBlocked ? 'bg-red-100' : 'cursor-pointer'}`} onClick={() => !isBlocked && onDayClick(dayInfo.date!)}>
                            <span className={`font-bold ${isToday ? 'text-[var(--primary)]' : ''}`}>{dayInfo.date.getDate()}</span>
                            {isBlocked && <div className="text-xs text-red-600 font-bold mt-1">Bloqueado</div>}
                            <div className="mt-1 space-y-1">
                                {dayAppointments.slice(0, 3).map(a => {
                                     const isNew = a.id === newlyAddedAppointmentId;
                                     const professional = professionals.find(p => p.username === a.professionalUsername);
                                     const bgColor = a.status === 'delayed' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]';
                                     const hoverBgColor = a.status === 'delayed' ? 'hover:bg-amber-600' : 'hover:bg-[var(--primary-hover)]';
                                     return (
                                        <div key={a.id} onClick={(e) => { e.stopPropagation(); onEditAppointment(a); }} className={`flex items-center gap-1.5 appointment-pill ${bgColor} ${hoverBgColor} ${isNew ? 'animate-new-item' : ''}`}>
                                            {professional && <span className="text-xs font-bold opacity-75">{getInitials(professional.name)}</span>}
                                            <span className="truncate flex-grow">{a.clientName}</span>
                                        </div>
                                     );
                                })}
                                {dayAppointments.length > 3 && (
                                    <div className="text-xs text-[var(--secondary)] font-semibold">+{dayAppointments.length - 3} mais</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TimelineView: React.FC<ViewProps> = ({ date, appointments, blockedSlots, onEditAppointment, newlyAddedAppointmentId, professionals }) => {
    const dayAppointments = appointments
        .filter(a => new Date(a.datetime).toDateString() === date.toDateString() && !['completed', 'cancelled'].includes(a.status))
        .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

    const dayBlockedSlots = blockedSlots.filter(s => new Date(s.date).toDateString() === date.toDateString());

    const getPositionAndHeight = (startTime: Date, endTime: Date) => {
        const startOfDay = new Date(startTime);
        startOfDay.setHours(7, 0, 0, 0); // Timeline starts at 7am
        const top = ((startTime.getTime() - startOfDay.getTime()) / (1000 * 60)) * 1; // 1px per minute
        const height = ((endTime.getTime() - startTime.getTime()) / (1000 * 60)) * 1;
        return { top, height: Math.max(height, 15) }; // min height 15px
    };
    
    return (
        <div className="timeline-view">
             {TIMES.slice(0, -1).map(time => {
                if(time.endsWith('00')) {
                    const hour = parseInt(time.split(':')[0]);
                     return (
                        <div key={time} style={{ top: `${(hour - 7) * 60}px` }}>
                            <div className="timeline-hour-label">{time}</div>
                        </div>
                    );
                }
                return null;
            })}
            {dayBlockedSlots.map(slot => {
                if (slot.isFullDay) return <div key={`full-${slot.id}`} className="absolute bg-red-200 opacity-50 w-full h-full" />;
                
                const [startH, startM] = slot.startTime!.split(':').map(Number);
                const startTime = new Date(date);
                startTime.setHours(startH, startM);

                const endTime = new Date(startTime);
                if(slot.endTime) {
                    const [endH, endM] = slot.endTime.split(':').map(Number);
                    endTime.setHours(endH, endM);
                } else {
                    endTime.setMinutes(endTime.getMinutes() + 30);
                }

                const { top, height } = getPositionAndHeight(startTime, endTime);
                return <div key={slot.id} className="absolute w-full bg-red-200 opacity-70 z-0" style={{ top: `${top}px`, height: `${height}px` }} />;
            })}
            {dayAppointments.map(a => {
                const { top, height } = getPositionAndHeight(a.datetime, a.endTime);
                const professional = professionals.find(p => p.username === a.professionalUsername);
                const isNew = a.id === newlyAddedAppointmentId;
                const bgColor = a.status === 'delayed' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]';
                return (
                    <div
                        key={a.id}
                        onClick={() => onEditAppointment(a)}
                        className={`absolute w-[95%] left-[2.5%] p-2 rounded-md ${bgColor} text-white text-xs z-10 shadow-lg cursor-pointer opacity-90 hover:opacity-100 transition-opacity flex flex-col justify-start ${isNew ? 'animate-new-item' : ''}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${a.clientName} - ${a.services.map(s => s.name).join(', ')}`}
                    >
                        <div className="flex justify-between items-start">
                             <p className="font-bold flex-grow">{a.clientName}</p>
                             {professional && <span className="text-xs font-bold opacity-75 flex-shrink-0" title={professional.name}>{getInitials(professional.name)}</span>}
                        </div>
                        <p className="truncate">{a.services.map(s => s.name).join(', ')}</p>
                    </div>
                );
            })}
        </div>
    );
};

const DayView: React.FC<ViewProps> = ({ date, appointments, blockedSlots, onEditAppointment, newlyAddedAppointmentId, professionals }) => {
    return (
        <div className="pl-14 py-4">
             <TimelineView date={date} appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={onEditAppointment} newlyAddedAppointmentId={newlyAddedAppointmentId} professionals={professionals} />
        </div>
    );
};

const WeekView: React.FC<ViewProps> = ({ date, appointments, blockedSlots, onEditAppointment, newlyAddedAppointmentId, professionals }) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekDays = Array.from({ length: 7 }).map((_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-7 text-center font-bold text-[var(--text-dark)] sticky top-0 bg-[var(--surface-opaque)] z-10 py-2">
                 {weekDays.map(day => {
                    const isToday = day.toDateString() === new Date().toDateString();
                     return (
                        <div key={day.toISOString()}>
                            <span className="text-sm">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                            <div className={`mt-1 text-2xl ${isToday ? 'bg-[var(--primary)] text-white rounded-full w-10 h-10 mx-auto flex items-center justify-center' : ''}`}>
                                {day.getDate()}
                            </div>
                        </div>
                    );
                 })}
            </div>
            <div className="grid grid-cols-7 flex-grow">
                {weekDays.map(day => (
                    <div key={day.toISOString()} className="border-l border-[var(--border)] relative pl-14">
                        <TimelineView date={day} appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={onEditAppointment} newlyAddedAppointmentId={newlyAddedAppointmentId} professionals={professionals} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// #endregion

export default CalendarView;
