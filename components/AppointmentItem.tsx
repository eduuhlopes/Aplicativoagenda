import React from 'react';
import { Appointment } from '../types';

interface AppointmentItemProps {
    appointment: Appointment;
    onEdit: (appointment: Appointment) => void;
}

const AppointmentItem: React.FC<AppointmentItemProps> = ({ appointment, onEdit }) => {
    return (
        <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEdit(appointment)}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{appointment.clientName}</p>
                    <p className="text-sm text-gray-600">{appointment.services.map(s => s.name).join(', ')}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{appointment.datetime.toLocaleDateString()}</p>
                    <p className="text-sm">{appointment.datetime.toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
    );
};

export default AppointmentItem;
