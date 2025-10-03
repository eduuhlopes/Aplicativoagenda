import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, BlockedSlot } from '../types';
import { TIMES, MONTHS } from '../constants';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarViewProps {
    appointments: Appointment[];
    blockedSlots: BlockedSlot[];
    onEditAppointment: (appointment: Appointment) => void;
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

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, blockedSlots, onEditAppointment }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [width] = useWindowSize();
    const isMobile = width < 640; // sm breakpoint

    const [view, setView] = useState<ViewType>(isMobile ? 'agenda' : 'month');
    
    useEffect(() => {
        setView(isMobile ? 'agenda' : 'month');
    }, [isMobile]);

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
        const animationKey = `${view}-${currentDate.getTime()}`;

        switch (view) {
            case 'month':
                return <div key={animationKey} className="animate-view-in"><MonthView date={currentDate} appointments={appointments} blockedSlots={blockedSlots} onDayClick={handleDayClick} onEditAppointment={onEditAppointment} /></div>;
            case 'week':
                return <div key={animationKey} className="animate-view-in"><WeekView date={currentDate} appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={onEditAppointment} /></div>;
            case 'day':
                return <div key={animationKey} className="animate-view-in"><DayView date={currentDate} appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={onEditAppointment} /></div>;
            case 'agenda':
                 return <div key={animationKey} className="animate-view-in"><AgendaListView date={currentDate} appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={onEditAppointment} /></div>;
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
            {/* Calendar Body */}
            <div className="flex-grow overflow-y-auto">{renderView()}</div>
        </div>
    );
};


// #region Sub-Components (Month, Week, Day, Agenda Views)

const AgendaListView: React.FC<{ date: Date, appointments: Appointment[], blockedSlots: BlockedSlot[], onEditAppointment: (a: Appointment) => void }> = ({ date, appointments, blockedSlots, onEditAppointment }) => {
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
                                const borderColor = appt.status === 'delayed' ? 'border-[var(--warning)]' : 'border-[var(--primary)]';
                                return (
                                    <div key={appt.id} onClick={() => onEditAppointment(appt)} className={`flex items-center gap-4 p-3 bg-white hover:bg-[var(--highlight)] cursor-pointer border-l-4 ${borderColor} rounded-r-lg shadow-sm`}>
                                        <div className="font-semibold text-[var(--text-dark)] w-20 text-center">
                                             {appt.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--text-dark)]">{appt.clientName}</p>
                                            <p className="text-sm text-[var(--secondary)]">{appt.services.map(s => s.name).join(', ')}</p>
                                        </div>
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


const MonthView: React.FC<{ date: Date, appointments: Appointment[], blockedSlots: BlockedSlot[], onDayClick: (day: Date) => void, onEditAppointment: (a: Appointment) => void }> = ({ date, appointments, blockedSlots, onDayClick, onEditAppointment }) => {
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
                                     const bgColor = a.status === 'delayed' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]';
                                     const hoverBgColor = a.status === 'delayed' ? 'hover:bg-amber-600' : 'hover:bg-[var(--primary-hover)]';
                                     return (
                                        <div key={a.id} onClick={(e) => { e.stopPropagation(); onEditAppointment(a); }} className={`appointment-pill ${bgColor} ${hoverBgColor}`}>
                                            {a.clientName}
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

const TimelineView: React.FC<{ date: Date, appointments: Appointment[], blockedSlots: BlockedSlot[], onEditAppointment: (a: Appointment) => void }> = ({ date, appointments, blockedSlots, onEditAppointment }) => {
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
                const bgColor = a.status === 'delayed' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]';
                return (
                    <div
                        key={a.id}
                        onClick={() => onEditAppointment(a)}
                        className={`absolute w-[95%] left-[2.5%] p-2 rounded-md ${bgColor} text-white text-xs z-10 shadow-lg cursor-pointer opacity-90 hover:opacity-100 transition-opacity`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${a.clientName} - ${a.services.map(s => s.name).join(', ')}`}
                    >
                        <p className="font-bold">{a.clientName}</p>
                        <p className="truncate">{a.services.map(s => s.name).join(', ')}</p>
                    </div>
                );
            })}
        </div>
    );
};

const DayView: React.FC<{ date: Date, appointments: Appointment[], blockedSlots: BlockedSlot[], onEditAppointment: (a: Appointment) => void }> = ({ date, appointments, blockedSlots, onEditAppointment }) => {
    return (
        <div className="pl-14 py-4">
             <TimelineView date={date} appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={onEditAppointment} />
        </div>
    );
};

const WeekView: React.FC<{ date: Date, appointments: Appointment[], blockedSlots: BlockedSlot[], onEditAppointment: (a: Appointment) => void }> = ({ date, appointments, blockedSlots, onEditAppointment }) => {
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
                        <TimelineView date={day} appointments={appointments} blockedSlots={blockedSlots} onEditAppointment={onEditAppointment} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// #endregion

export default CalendarView;