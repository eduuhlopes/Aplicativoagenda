import React from 'react';
import { Appointment } from '../types';

interface AppointmentItemProps {
    appointment: Appointment;
    onCancel: (id: number) => void;
    onComplete: (id: number) => void;
    onEdit: (appointment: Appointment) => void;
    onSendReminder: (id: number) => void;
    isHighlighted: boolean;
    isRemoving: boolean;
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.474.854-1.217 4.459 4.525-1.187.82-.459z" />
    </svg>
);


const AppointmentItem: React.FC<AppointmentItemProps> = ({ appointment, onCancel, onComplete, onEdit, onSendReminder, isHighlighted, isRemoving }) => {
    const formattedDate = appointment.datetime.toLocaleDateString('pt-BR', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const formattedStartTime = appointment.datetime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const formattedEndTime = appointment.endTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const totalValue = appointment.services.reduce((sum, service) => sum + service.value, 0);
    const formattedValue = totalValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const now = new Date();
    const isFuture = appointment.datetime > now;


    return (
        <div className={`bg-white p-4 rounded-lg shadow-md border border-pink-200 flex flex-col gap-3 ${isRemoving ? 'animate-fade-out' : 'transition-all hover:shadow-lg hover:border-pink-300'} ${isHighlighted ? 'animate-highlight' : ''}`}>
            <div className="flex-grow">
                <p className="font-bold text-lg text-purple-900">{appointment.services.map(s => s.name).join(' + ')}</p>
                <p className="text-md font-semibold text-purple-700">Cliente: {appointment.clientName}</p>
                {appointment.observations && (
                     <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded-md mt-2 italic">
                        <span className="font-semibold">Obs:</span> {appointment.observations}
                    </p>
                )}
                 <p className="font-bold text-lg text-green-600 mt-2">{formattedValue}</p>
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-pink-700 font-medium">{formattedDate}</p>
                    <p className="text-sm text-pink-700 font-bold bg-pink-100 px-2 py-0.5 rounded">{formattedStartTime} - {formattedEndTime}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
                 {isFuture && (
                    <>
                        {appointment.reminderSent ? (
                             <div className="px-4 py-2 text-sm font-semibold text-gray-500 italic flex items-center bg-gray-100 rounded-lg">Lembrete Enviado ✔️</div>
                        ) : (
                            <button
                                onClick={() => onSendReminder(appointment.id)}
                                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors text-sm flex items-center"
                            >
                                <WhatsAppIcon /> Enviar Lembrete
                            </button>
                        )}
                    </>
                 )}
                 <button
                    onClick={() => onEdit(appointment)}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-sm"
                >
                    Editar
                </button>
                 <button
                    onClick={() => onComplete(appointment.id)}
                    className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors text-sm"
                >
                    Finalizar
                </button>
                <button
                    onClick={() => onCancel(appointment.id)}
                    className="px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg shadow-sm hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors text-sm"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default AppointmentItem;