import React from 'react';
import { Appointment } from '../types';
import AppointmentItem from './AppointmentItem';

const NailPolishIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-2 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1a1 1 0 00-1-1V5.5a.5.5 0 00-1 0V10a1 1 0 001 1h.5a.5.5 0 010 1H10a.5.5 0 010-1H11a1 1 0 001-1V5.5a1.5 1.5 0 01-3 0V10a1 1 0 001 1h.5a.5.5 0 010 1H7a.5.5 0 010-1H8a1 1 0 001-1V5.5A1.5 1.5 0 0110 3.5zM5 11.5a1.5 1.5 0 013 0V13a1 1 0 001 1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1a1 1 0 00-1-1v-1.5a.5.5 0 00-1 0V17a1 1 0 001 1h.5a.5.5 0 010 1H5.5a.5.5 0 010-1H6a1 1 0 001-1v-1.5a1.5 1.5 0 01-3 0V10a1 1 0 00-1-1H3a1 1 0 01-1-1V7a1 1 0 011-1h1a1 1 0 001 1v1.5z" />
    </svg>
);


interface AppointmentListProps {
    appointments: Appointment[];
    onCancel: (id: number) => void;
    onComplete: (id: number) => void;
    onEdit: (appointment: Appointment) => void;
    onSendReminder: (id: number) => void;
    highlightedAppointmentId: number | null;
    removingAppointmentId: number | null;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, onCancel, onComplete, onEdit, onSendReminder, highlightedAppointmentId, removingAppointmentId }) => {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-3xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                Próximos Agendamentos
                <NailPolishIcon />
            </h2>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
                {appointments.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-purple-600 text-center italic">Nenhum agendamento próximo.</p>
                    </div>
                ) : (
                    appointments.map(appt => (
                        <AppointmentItem 
                            key={appt.id} 
                            appointment={appt} 
                            onCancel={onCancel}
                            onComplete={onComplete}
                            onEdit={onEdit}
                            onSendReminder={onSendReminder}
                            isHighlighted={appt.id === highlightedAppointmentId}
                            isRemoving={appt.id === removingAppointmentId}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default AppointmentList;