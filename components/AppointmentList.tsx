import React from 'react';
import { Appointment } from '../types';
import AppointmentItem from './AppointmentItem';

interface AppointmentListProps {
    appointments: Appointment[];
    onEdit: (appointment: Appointment) => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, onEdit }) => {
    if (appointments.length === 0) {
        return <p>No appointments found.</p>;
    }

    return (
        <div className="space-y-4">
            {appointments.map(appointment => (
                <AppointmentItem key={appointment.id} appointment={appointment} onEdit={onEdit} />
            ))}
        </div>
    );
};

export default AppointmentList;
