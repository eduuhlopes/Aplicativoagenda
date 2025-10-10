import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Client, Service, Professional, BlockedSlot } from '../types';
import { SERVICES, TIMES } from '../constants'; // Assuming constants file exists
import DateTimePickerModal from './DateTimePickerModal';
import SmartSchedulerModal from './SmartSchedulerModal';

interface AppointmentFormProps {
    onSave: (appointment: Omit<Appointment, 'id'> | Appointment) => void;
    onCancel: () => void;
    appointmentToEdit: Appointment | null;
    services: Service[];
    clients: Client[];
    professionals: Professional[];
    currentUser: Professional;
    blockedSlots: BlockedSlot[];
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
    onSave,
    onCancel,
    appointmentToEdit,
    services,
    clients,
    professionals,
    currentUser,
    blockedSlots,
}) => {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [professionalUsername, setProfessionalUsername] = useState(currentUser.username);
    const [datetime, setDatetime] = useState<Date | null>(null);
    const [observations, setObservations] = useState('');
    const [status, setStatus] = useState<Appointment['status']>('scheduled');

    const [isDateTimePickerOpen, setDateTimePickerOpen] = useState(false);

    useEffect(() => {
        if (appointmentToEdit) {
            setClientName(appointmentToEdit.clientName);
            setClientPhone(appointmentToEdit.clientPhone);
            setSelectedServices(appointmentToEdit.services);
            setProfessionalUsername(appointmentToEdit.professionalUsername);
            setDatetime(appointmentToEdit.datetime);
            setObservations(appointmentToEdit.observations || '');
            setStatus(appointmentToEdit.status);
        } else {
            // Reset form for new appointment
            setClientName('');
            setClientPhone('');
            setSelectedServices([]);
            setProfessionalUsername(currentUser.username);
            setDatetime(null);
            setObservations('');
            setStatus('scheduled');
        }
    }, [appointmentToEdit, currentUser.username]);

    const totalDuration = useMemo(() => {
        return selectedServices.reduce((total, service) => total + service.duration, 0);
    }, [selectedServices]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !clientPhone || selectedServices.length === 0 || !datetime) {
            alert('Please fill all required fields.');
            return;
        }

        const endTime = new Date(datetime.getTime() + totalDuration * 60000);

        const appointmentData = {
            clientName,
            clientPhone,
            services: selectedServices,
            professionalUsername,
            datetime,
            endTime,
            status,
            observations,
        };
        
        if (appointmentToEdit) {
            onSave({ ...appointmentToEdit, ...appointmentData });
        } else {
            onSave(appointmentData);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-4">
            <h2 className="text-2xl font-bold mb-4">{appointmentToEdit ? 'Edit Appointment' : 'New Appointment'}</h2>
            
            {/* Client Info */}
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" required />
            <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Client Phone" required />

            {/* Services */}
            <div>
                <label>Services:</label>
                {/* Replace with a better multi-select component */}
                <div>
                    {services.map(service => (
                        <div key={service.name}>
                            <input
                                type="checkbox"
                                checked={selectedServices.some(s => s.name === service.name)}
                                onChange={() => {
                                    setSelectedServices(prev => 
                                        prev.some(s => s.name === service.name)
                                        ? prev.filter(s => s.name !== service.name)
                                        : [...prev, service]
                                    );
                                }}
                            />
                            <label>{service.name}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Professional */}
            {currentUser.role === 'admin' && (
                <select value={professionalUsername} onChange={e => setProfessionalUsername(e.target.value)}>
                    {professionals.map(p => <option key={p.username} value={p.username}>{p.name}</option>)}
                </select>
            )}

            {/* Date Time */}
            <button type="button" onClick={() => setDateTimePickerOpen(true)}>
                {datetime ? datetime.toLocaleString() : 'Select Date & Time'}
            </button>
            <DateTimePickerModal 
                isOpen={isDateTimePickerOpen}
                onClose={() => setDateTimePickerOpen(false)}
                onConfirm={({ date }) => {
                    setDatetime(date);
                    setDateTimePickerOpen(false);
                }}
                initialDate={datetime}
                appointments={[]} // pass existing appointments
                blockedSlots={blockedSlots}
                totalDuration={totalDuration}
                professionals={professionals}
                professionalUsername={professionalUsername}
            />

            {/* Observations */}
            <textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Observations..." />
            
            {/* Status */}
             <select value={status} onChange={e => setStatus(e.target.value as Appointment['status'])}>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="delayed">Delayed</option>
             </select>

            <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onCancel}>Cancel</button>
                <button type="submit">Save</button>
            </div>
        </form>
    );
};

export default AppointmentForm;
