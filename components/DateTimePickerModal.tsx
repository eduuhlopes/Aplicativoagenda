import React, { useState, useMemo, useEffect } from 'react';
import { TIMES, MONTHS } from '../constants';
import { BlockedSlot, Appointment, Professional } from '../types';

interface DateTimePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { date: Date, isFullDay?: boolean, startTime?: string, endTime?: string }) => void;
    initialDate?: Date | null;
    blockedSlots?: BlockedSlot[];
    showBlockDayToggle?: boolean;
    appointments?: Appointment[];
    editingAppointmentId?: number | null;
    totalDuration?: number;
    professionals?: Professional[];
    professionalUsername?: string;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({ isOpen, onClose, onConfirm, initialDate, blockedSlots = [], showBlockDayToggle = false, appointments = [], editingAppointmentId = null, totalDuration = 30, professionals = [], professionalUsername = '' }) => {
    const [viewDate, setViewDate] = useState(initialDate || new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(initialDate || new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
    const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
    const [blockFullDay, setBlockFullDay] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const initial = initialDate || new Date();
            const initialHour = initialDate ? `${String(initialDate.getHours()).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}` : null;
            setViewDate(initial);
            setSelectedDay(initialDate || new Date());
            setBlockFullDay(false);
            if (showBlockDayToggle) {
                setSelectedStartTime(initialHour);
                setSelectedEndTime(null);
            } else {
                setSelectedTime(initialHour);
            }
        }
    }, [isOpen, initialDate, showBlockDayToggle]);
    
    const handleMonthChange = (offset: number) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const grid = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const fullDate = new Date(year, month, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isPast = fullDate < today;
            const isSelected = selectedDay?.toDateString() === fullDate.toDateString();
            const isBlocked = blockedSlots.some(slot => slot.isFullDay && new Date(slot.date).toDateString() === fullDate.toDateString());
            
            const baseClasses = "w-10 h-10 flex items-center justify-center rounded-full transition-all";
            let dayClasses = isPast || isBlocked ? `${baseClasses} text-gray-400 cursor-not-allowed` : `${baseClasses} cursor-pointer hover:bg-[var(--border)] active:scale-95`;
            
            if (isBlocked) {
                dayClasses += ' bg-rose-200 line-through';
            }
            if (isSelected) {
                dayClasses = `${baseClasses} bg-[var(--primary)] text-white font-bold`;
            }

            grid.push(
                <div
                    key={day}
                    className={dayClasses}
                    onClick={() => !(isPast || isBlocked) && setSelectedDay(fullDate)}
                >
                    {day}
                </div>
            );
        }
        return grid;
    }, [viewDate, selectedDay, blockedSlots]);

    const handleConfirm = () => {
        if (!selectedDay) {
            alert("Por favor, selecione um dia.");
            return;
        }

        if (showBlockDayToggle) { // Blocking logic
            let finalStartTime: string | undefined = undefined;
            if (!blockFullDay) {
                if (!selectedStartTime) {
                    alert("Por favor, selecione um horário de início para o bloqueio.");
                    return;
                }
                if (selectedStartTime && selectedEndTime && selectedEndTime <= selectedStartTime) {
                    alert("A hora de fim deve ser depois da hora de início.");
                    return;
                }
                finalStartTime = selectedStartTime;
            }
             onConfirm({ date: selectedDay, isFullDay: blockFullDay, startTime: finalStartTime, endTime: selectedEndTime || undefined });
        } else { // Scheduling logic
            if (!selectedTime) {
                alert("Por favor, selecione um horário.");
                return;
            }
             const [hour, minute] = selectedTime.split(':').map(Number);
             const finalDate = new Date(selectedDay);
             finalDate.setHours(hour, minute, 0, 0);
             onConfirm({ date: finalDate });
        }
    };
    
    const suggestedTimes = useMemo(() => {
        if (!selectedDay) return [];
    
        const selectedProfessional = professionals.find(p => p.username === professionalUsername);
        const dayOfWeek = selectedDay.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

        // Determine if a schedule is configured. It's configured if it's not undefined and has keys.
        const schedule = selectedProfessional?.workSchedule;
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

        // Mark busy slots from blocked periods
        blockedSlots.forEach(slot => {
            if (new Date(slot.date).toDateString() !== dayStr) return;
            if (slot.isFullDay) {
                TIMES.forEach(time => busySlots.add(time));
                return;
            }
            if (slot.startTime) {
                const start = slot.startTime;
                const end = slot.endTime || TIMES[TIMES.indexOf(start) + 1] || start;
                TIMES.forEach(time => {
                    if (time >= start && time < end) {
                        busySlots.add(time);
                    }
                });
            }
        });

        // Mark busy slots from appointments
        appointments.forEach(appt => {
            if (appt.id === editingAppointmentId) return;
            // Consider appointments of the selected professional
            if (appt.professionalUsername !== professionalUsername) return;
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
        const slotsNeeded = Math.ceil((totalDuration || 30) / 30);
        
        const today = new Date();
        const isTodaySelected = selectedDay.toDateString() === today.toDateString();

        for (let i = 0; i <= TIMES.length - slotsNeeded; i++) {
            const startTimeCandidate = TIMES[i];
            
            // Check if within working hours
            const endTimeCandidate = TIMES[i + slotsNeeded -1];
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

            if (isSequenceAvailable) {
                availableStartTimes.push(startTimeCandidate);
            }
        }

        return availableStartTimes;
    }, [selectedDay, blockedSlots, appointments, totalDuration, editingAppointmentId, professionals, professionalUsername]);

    if (!isOpen) return null;

    const selectClasses = "w-full h-11 px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-backdrop-in" onClick={onClose}>
            <div className="bg-[var(--surface-opaque)] rounded-2xl shadow-2xl p-6 m-4 max-w-lg w-full animate-modal-in" onClick={e => e.stopPropagation()}>
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-[var(--highlight)] transition active:scale-95">&lt;</button>
                        <h4 className="text-lg font-bold text-[var(--text-dark)]">{`${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}</h4>
                        <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-[var(--highlight)] transition active:scale-95">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-[var(--primary)] font-bold mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {calendarGrid}
                    </div>
                </div>

                {showBlockDayToggle && (
                     <div className="flex items-center justify-center my-3">
                        <input
                            type="checkbox"
                            id="fullDayBlock"
                            checked={blockFullDay}
                            onChange={(e) => setBlockFullDay(e.target.checked)}
                            className="h-4 w-4 text-[var(--primary)] border-gray-300 rounded focus:ring-[var(--primary-hover)]"
                        />
                        <label htmlFor="fullDayBlock" className="ml-2 text-md text-[var(--text-dark)]">
                            Bloquear o dia inteiro
                        </label>
                    </div>
                )}
                
                {showBlockDayToggle && !blockFullDay && (
                    <div className="border-t border-[var(--border)] pt-4">
                        <h4 className="text-lg font-bold text-[var(--text-dark)] mb-2 text-center">Selecione o Período</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <div className="flex-1">
                                <label htmlFor="start-time" className="block text-sm font-medium text-[var(--text-dark)] mb-1">Início</label>
                                <select 
                                    id="start-time" 
                                    value={selectedStartTime || ''} 
                                    onChange={(e) => {
                                        setSelectedStartTime(e.target.value);
                                        if (selectedEndTime && e.target.value >= selectedEndTime) {
                                            setSelectedEndTime(null);
                                        }
                                    }}
                                    className={selectClasses}
                                >
                                    <option value="">--:--</option>
                                    {TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                             <div className="flex-1">
                                <label htmlFor="end-time" className="block text-sm font-medium text-[var(--text-dark)] mb-1">Fim (opcional)</label>
                                <select 
                                    id="end-time" 
                                    value={selectedEndTime || ''} 
                                    onChange={(e) => setSelectedEndTime(e.target.value)}
                                    className={selectClasses}
                                    disabled={!selectedStartTime}
                                >
                                    <option value="">--:--</option>
                                    {TIMES.filter(t => !selectedStartTime || t > selectedStartTime).map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {!showBlockDayToggle && (
                    <div className="border-t border-[var(--border)] pt-4">
                        <h4 className="text-lg font-bold text-[var(--text-dark)] mb-2 text-center">
                            Horários Disponíveis ({totalDuration} min)
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
                           {suggestedTimes.length > 0 ? (
                                suggestedTimes.map(time => {
                                    const isSelected = time === selectedTime;
                                    const timeClasses = `p-2 rounded-lg text-center transition-all cursor-pointer hover:bg-[var(--border)] active:scale-95 ${
                                        isSelected ? 'bg-[var(--primary)] text-white font-bold' : 'bg-[var(--highlight)]'
                                    }`;

                                    return (
                                        <div key={time} className={timeClasses} onClick={() => setSelectedTime(time)}>
                                            {time}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="col-span-full text-center text-[var(--secondary)] italic py-4">
                                    Nenhum horário disponível para a duração selecionada neste dia.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 transition-all active:scale-95">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="px-6 py-2 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-all active:scale-95">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateTimePickerModal;