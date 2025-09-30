import React, { useState, useMemo, useEffect } from 'react';
import { TIMES, MONTHS } from '../constants';
import { BlockedSlot } from '../types';

interface DateTimePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { date: Date, isFullDay: boolean, startTime?: string, endTime?: string }) => void;
    initialDate?: Date | null;
    blockedSlots?: BlockedSlot[];
    showBlockDayToggle?: boolean;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({ isOpen, onClose, onConfirm, initialDate, blockedSlots = [], showBlockDayToggle = false }) => {
    const [viewDate, setViewDate] = useState(initialDate || new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(initialDate || null);
    
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
    const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);

    const [blockFullDay, setBlockFullDay] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const initial = initialDate || new Date();
            const initialHour = initialDate ? `${String(initialDate.getHours()).padStart(2, '0')}:00` : null;
            setViewDate(initial);
            setSelectedDay(initialDate || null);
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
            const isBlocked = blockedSlots.some(slot => slot.isFullDay && slot.date.toDateString() === fullDate.toDateString());
            
            const baseClasses = "w-10 h-10 flex items-center justify-center rounded-full transition-colors";
            let dayClasses = isPast || isBlocked ? `${baseClasses} text-gray-400 cursor-not-allowed` : `${baseClasses} cursor-pointer hover:bg-pink-200`;
            
            if (isBlocked) {
                dayClasses += ' bg-red-200 line-through';
            }
            if (isSelected) {
                dayClasses = `${baseClasses} bg-pink-500 text-white font-bold`;
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

        let finalDate = new Date(selectedDay);
        let finalIsFullDay = blockFullDay;
        let finalStartTime: string | undefined = undefined;
        let finalEndTime: string | undefined = undefined;

        if (showBlockDayToggle) { // Blocking logic
            if (!finalIsFullDay) {
                if (!selectedStartTime) {
                    alert("Por favor, selecione um horário de início.");
                    return;
                }
                if (selectedStartTime && selectedEndTime && selectedEndTime <= selectedStartTime) {
                    alert("A hora de fim deve ser depois da hora de início.");
                    return;
                }
                finalStartTime = selectedStartTime;
                finalEndTime = selectedEndTime || undefined;
            }
        } else { // Scheduling logic
            if (!selectedTime) {
                alert("Por favor, selecione um horário.");
                return;
            }
            finalStartTime = selectedTime;
            finalIsFullDay = false;
        }
        
        if (finalStartTime) {
            const [hour] = finalStartTime.split(':').map(Number);
            finalDate.setHours(hour, 0, 0, 0);
        }
        
        onConfirm({ date: finalDate, isFullDay: finalIsFullDay, startTime: finalStartTime, endTime: finalEndTime });
    };

    const filteredEndTimes = useMemo(() => {
        if (!selectedStartTime) return TIMES;
        return TIMES.filter(t => t > selectedStartTime);
    }, [selectedStartTime]);


    if (!isOpen) return null;

    const today = new Date();
    const isTodaySelected = selectedDay?.toDateString() === today.toDateString();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-pink-50 rounded-2xl shadow-2xl p-6 m-4 max-w-lg w-full transform transition-transform" onClick={e => e.stopPropagation()}>
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-pink-200 transition">&lt;</button>
                        <h4 className="text-lg font-bold text-purple-800">{`${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}</h4>
                        <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-pink-200 transition">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm text-pink-800 mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d}>{d}</div>)}
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
                            className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <label htmlFor="fullDayBlock" className="ml-2 text-md text-purple-800">
                            Bloquear o dia inteiro
                        </label>
                    </div>
                )}
                
                {showBlockDayToggle && !blockFullDay && (
                    <div className="border-t border-pink-200 pt-4">
                        <h4 className="text-lg font-bold text-purple-800 mb-2 text-center">Selecione o Período</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <div className="flex-1">
                                <label htmlFor="start-time" className="block text-sm font-medium text-purple-800 mb-1">Início</label>
                                <select 
                                    id="start-time" 
                                    value={selectedStartTime || ''} 
                                    onChange={(e) => {
                                        setSelectedStartTime(e.target.value);
                                        if (selectedEndTime && e.target.value >= selectedEndTime) {
                                            setSelectedEndTime(null);
                                        }
                                    }}
                                    className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                                >
                                    <option value="">--:--</option>
                                    {TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                             <div className="flex-1">
                                <label htmlFor="end-time" className="block text-sm font-medium text-purple-800 mb-1">Fim (opcional)</label>
                                <select 
                                    id="end-time" 
                                    value={selectedEndTime || ''} 
                                    onChange={(e) => setSelectedEndTime(e.target.value)}
                                    className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                                    disabled={!selectedStartTime}
                                >
                                    <option value="">--:--</option>
                                    {filteredEndTimes.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {!showBlockDayToggle && (
                    <div className="border-t border-pink-200 pt-4">
                        <h4 className="text-lg font-bold text-purple-800 mb-2 text-center">Selecione o Horário</h4>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                            {TIMES.map(time => {
                                const [hour] = time.split(':').map(Number);
                                const isPast = isTodaySelected && hour < today.getHours();
                                const isSelected = time === selectedTime;
                                const isBlockedTime = selectedDay && blockedSlots.some(
                                    s => !s.isFullDay && s.date.toDateString() === selectedDay.toDateString() && s.startTime === time && !s.endTime
                                );
                                
                                const baseClasses = "p-2 rounded-lg text-center transition-colors";
                                let timeClasses = isPast || isBlockedTime ? `${baseClasses} bg-gray-200 text-gray-400 cursor-not-allowed` : `${baseClasses} bg-pink-100 cursor-pointer hover:bg-pink-200`;
                                if (isBlockedTime) {
                                    timeClasses += ' line-through';
                                }
                                if (isSelected) {
                                    timeClasses = `${baseClasses} bg-pink-500 text-white font-bold`;
                                }

                                return (
                                    <div key={time} className={timeClasses} onClick={() => !(isPast || isBlockedTime) && setSelectedTime(time)}>
                                        {time}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 transition">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg shadow-md hover:bg-pink-600 transition">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateTimePickerModal;