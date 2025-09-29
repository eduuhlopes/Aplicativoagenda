import React from 'react';
import { Appointment } from '../types';

interface AppointmentItemProps {
    appointment: Appointment;
    onCancel: (id: number) => void;
    onComplete: (id: number) => void;
}

const AppointmentItem: React.FC<AppointmentItemProps> = ({ appointment, onCancel, onComplete }) => {
    const formattedDate = appointment.datetime.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = appointment.datetime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const formattedValue = appointment.value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-pink-200 flex flex-col gap-3 transition-all hover:shadow-lg hover:border-pink-300">
            <div className="flex-grow">
                <p className="font-bold text-lg text-purple-900">{appointment.service}</p>
                <p className="text-md font-semibold text-purple-700">Cliente: {appointment.clientName}</p>
                {appointment.observations && (
                     <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded-md mt-2 italic">
                        <span className="font-semibold">Obs:</span> {appointment.observations}
                    </p>
                )}
                 <p className="font-bold text-lg text-green-600 mt-2">{formattedValue}</p>
                <p className="text-sm text-pink-700 mt-2">{formattedDate}</p>
                <p className="text-sm text-pink-700">{formattedTime}</p>
            </div>
            <div className="flex items-center justify-end gap-2">
                 <button
                    onClick={() => onComplete(appointment.id)}
                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors text-sm"
                >
                    Finalizar
                </button>
                <button
                    onClick={() => onCancel(appointment.id)}
                    className="px-4 py-2 bg-red-400 text-white font-semibold rounded-lg shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default AppointmentItem;