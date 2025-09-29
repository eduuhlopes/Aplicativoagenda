import React, { useState, useMemo, useEffect } from 'react';
import { TIMES, MONTHS } from '../constants';

interface DateTimePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: Date) => void;
    initialDate?: Date | null;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({ isOpen, onClose, onConfirm, initialDate }) => {
    const [viewDate, setViewDate] = useState(initialDate || new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(initialDate || null);
    const [selectedTime, setSelectedTime] = useState<string | null>(initialDate ? `${String(initialDate.getHours()).padStart(2, '0')}:00` : null);

    useEffect(() => {
        if (isOpen) {
            const initial = initialDate || new Date();
            setViewDate(initial);
            setSelectedDay(initialDate || null);
            setSelectedTime(initialDate ? `${String(initialDate.getHours()).padStart(2, '0')}:00` : null);
        }
    }, [isOpen, initialDate]);

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
            
            const baseClasses = "w-10 h-10 flex items-center justify-center rounded-full transition-colors";
            let dayClasses = isPast ? `${baseClasses} text-gray-400 cursor-not-allowed` : `${baseClasses} cursor-pointer hover:bg-pink-200`;
            if (isSelected) {
                dayClasses = `${baseClasses} bg-pink-500 text-white font-bold`;
            }

            grid.push(
                <div
                    key={day}
                    className={dayClasses}
                    onClick={() => !isPast && setSelectedDay(fullDate)}
                >
                    {day}
                </div>
            );
        }
        return grid;
    }, [viewDate, selectedDay]);

    const handleConfirm = () => {
        if (selectedDay && selectedTime) {
            const [hour] = selectedTime.split(':').map(Number);
            const finalDate = new Date(selectedDay);
            finalDate.setHours(hour, 0, 0, 0);
            onConfirm(finalDate);
        } else {
            alert("Por favor, selecione um dia e um horário.");
        }
    };

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

                <div className="border-t border-pink-200 pt-4">
                    <h4 className="text-lg font-bold text-purple-800 mb-2 text-center">Selecione o Horário</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                        {TIMES.map(time => {
                            const [hour] = time.split(':').map(Number);
                            const isPast = isTodaySelected && hour < today.getHours();
                            const isSelected = time === selectedTime;
                            
                            const baseClasses = "p-2 rounded-lg text-center transition-colors";
                            let timeClasses = isPast ? `${baseClasses} bg-gray-200 text-gray-400 cursor-not-allowed` : `${baseClasses} bg-pink-100 cursor-pointer hover:bg-pink-200`;
                            if (isSelected) {
                                timeClasses = `${baseClasses} bg-pink-500 text-white font-bold`;
                            }

                            return (
                                <div key={time} className={timeClasses} onClick={() => !isPast && setSelectedTime(time)}>
                                    {time}
                                </div>
                            );
                        })}
                    </div>
                </div>

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