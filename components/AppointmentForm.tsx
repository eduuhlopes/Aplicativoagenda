import React, { useState, useEffect } from 'react';
import { Appointment, BlockedSlot } from '../types';
import { SERVICES } from '../constants';
import DateTimePickerModal from './DateTimePickerModal';

interface AppointmentFormProps {
    onSchedule: (appointment: Omit<Appointment, 'id' | 'status'>) => boolean;
    appointmentToEdit?: Appointment | null;
    onUpdate?: (appointment: Appointment) => boolean;
    onCancelEdit?: () => void;
    blockedSlots: BlockedSlot[];
}


const CustomSelect: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
}> = ({ id, label, value, onChange, options }) => (
    <div>
        <label htmlFor={id} className="block text-md font-medium text-purple-800 mb-1">
            {label}
        </label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSchedule, appointmentToEdit, onUpdate, onCancelEdit, blockedSlots }) => {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [service, setService] = useState('');
    const [value, setValue] = useState('');
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [observations, setObservations] = useState('');
    
    useEffect(() => {
        if (appointmentToEdit) {
            setClientName(appointmentToEdit.clientName);
            setClientPhone(appointmentToEdit.clientPhone);
            setService(appointmentToEdit.service);
            setValue(String(appointmentToEdit.value));
            setSelectedDateTime(appointmentToEdit.datetime);
            setObservations(appointmentToEdit.observations || '');
        } else {
            resetForm();
        }
    }, [appointmentToEdit]);

    const resetForm = () => {
        setClientName('');
        setClientPhone('');
        setService('');
        setValue('');
        setSelectedDateTime(null);
        setObservations('');
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        const length = value.length;
        if (length > 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else if (length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        setClientPhone(value);
    };

    const handleDateTimeConfirm = (data: { date: Date }) => {
        setSelectedDateTime(data.date);
        setIsPickerOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !clientPhone || !service || !value || !selectedDateTime) {
            alert("Por favor, preencha todos os detalhes do agendamento, incluindo o valor.");
            return;
        }

        let success = false;
        if (appointmentToEdit && onUpdate) {
            success = onUpdate({
                ...appointmentToEdit,
                clientName,
                clientPhone,
                service,
                datetime: selectedDateTime,
                value: parseFloat(value),
                observations,
            });
        } else {
            success = onSchedule({
                clientName,
                clientPhone,
                service,
                datetime: selectedDateTime,
                value: parseFloat(value),
                observations,
            });
        }
        
        if (success) {
            resetForm();
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-purple-800 text-center mb-4">{appointmentToEdit ? 'Editar Agendamento' : 'Agendar um Horário'}</h2>
                
                <div>
                    <label htmlFor="client-name" className="block text-md font-medium text-purple-800 mb-1">
                        Nome da Cliente:
                    </label>
                    <input
                        type="text"
                        id="client-name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Digite o nome da cliente"
                        className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
                    />
                </div>

                <div>
                    <label htmlFor="client-phone" className="block text-md font-medium text-purple-800 mb-1">
                        Telefone da Cliente (WhatsApp):
                    </label>
                    <input
                        type="tel"
                        id="client-phone"
                        value={clientPhone}
                        onChange={handlePhoneChange}
                        placeholder="(XX) XXXXX-XXXX"
                        maxLength={15}
                        className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
                    />
                </div>

                <CustomSelect 
                    id="service-spinner"
                    label="Selecione o Serviço:"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    options={[
                        { value: '', label: 'Escolha um serviço' },
                        ...SERVICES.map(s => ({ value: s, label: s }))
                    ]}
                />

                <div>
                    <label htmlFor="service-value" className="block text-md font-medium text-purple-800 mb-1">
                        Valor do Serviço (R$):
                    </label>
                    <input
                        type="number"
                        id="service-value"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Ex: 50,00"
                        step="0.01"
                        min="0"
                        className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
                    />
                </div>
                 <div>
                    <label htmlFor="observations" className="block text-md font-medium text-purple-800 mb-1">
                        Observações:
                    </label>
                    <textarea
                        id="observations"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Alergias, preferências, etc."
                        rows={3}
                        className="w-full px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
                    />
                </div>

                <div>
                    <label htmlFor="datetime-picker" className="block text-md font-medium text-purple-800 mb-1">
                        Data e Hora:
                    </label>
                    <button
                        type="button"
                        id="datetime-picker"
                        onClick={() => setIsPickerOpen(true)}
                        className="w-full h-11 text-left px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition text-gray-700"
                    >
                        {selectedDateTime
                            ? selectedDateTime.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Selecione uma data e hora'}
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {appointmentToEdit && (
                        <button type="button" onClick={onCancelEdit} className="w-full py-3 px-4 bg-gray-400 text-white font-bold text-lg rounded-lg shadow-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-transform transform hover:scale-105">
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="w-full py-3 px-4 bg-pink-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-transform transform hover:scale-105">
                        {appointmentToEdit ? 'Salvar Alterações' : 'Agendar Horário'}
                    </button>
                </div>


            </form>
            <DateTimePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onConfirm={handleDateTimeConfirm}
                initialDate={selectedDateTime}
                blockedSlots={blockedSlots}
            />
        </>
    );
};

export default AppointmentForm;