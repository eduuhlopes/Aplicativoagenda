import React, { useState, useEffect, useMemo } from 'react';
import { Appointment } from '../types';
import { SERVICES, TIMES } from '../constants';

interface AppointmentFormProps {
    onSchedule: (appointment: Omit<Appointment, 'id' | 'status'>) => Promise<boolean>;
    appointmentToEdit?: Appointment | null;
    onUpdate?: (appointment: Appointment) => Promise<boolean>;
    onCancelEdit?: () => void;
}

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatTimeForInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSchedule, appointmentToEdit, onUpdate, onCancelEdit }) => {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [selectedServices, setSelectedServices] = useState<{ name: string; value: number; duration: number }[]>([]);
    const [serviceToAdd, setServiceToAdd] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [observations, setObservations] = useState('');
    
    useEffect(() => {
        if (appointmentToEdit) {
            setClientName(appointmentToEdit.clientName);
            setClientPhone(appointmentToEdit.clientPhone);
            setSelectedServices(appointmentToEdit.services);
            setSelectedDate(formatDateForInput(appointmentToEdit.datetime));
            setStartTime(formatTimeForInput(appointmentToEdit.datetime));
            setEndTime(formatTimeForInput(appointmentToEdit.endTime));
            setObservations(appointmentToEdit.observations || '');
        } else {
            resetForm();
        }
    }, [appointmentToEdit]);

    const resetForm = () => {
        setClientName('');
        setClientPhone('');
        setSelectedServices([]);
        setServiceToAdd('');
        setSelectedDate('');
        setStartTime('');
        setEndTime('');
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

    const handleAddService = () => {
        if (serviceToAdd && !selectedServices.some(s => s.name === serviceToAdd)) {
            const serviceData = SERVICES.find(s => s.name === serviceToAdd);
            if (serviceData) {
                setSelectedServices(prev => [...prev, { ...serviceData }]);
            }
        }
        setServiceToAdd('');
    };

    const handleRemoveService = (index: number) => {
        setSelectedServices(prev => prev.filter((_, i) => i !== index));
    };

    const handleServiceValueChange = (index: number, newValue: string) => {
        const value = parseFloat(newValue);
        setSelectedServices(prev => prev.map((service, i) => i === index ? { ...service, value: isNaN(value) ? 0 : value } : service));
    };

    const totalValue = useMemo(() => {
        return selectedServices.reduce((sum, service) => sum + service.value, 0);
    }, [selectedServices]);

    const filteredEndTimes = useMemo(() => {
        if (!startTime) return TIMES;
        return TIMES.filter(time => time > startTime);
    }, [startTime]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !clientPhone || selectedServices.length === 0 || !selectedDate || !startTime || !endTime) {
            alert("Por favor, preencha todos os detalhes do agendamento, incluindo data e horários.");
            return;
        }
        
        if (startTime >= endTime) {
            alert("O horário de término deve ser maior que o horário de início.");
            return;
        }

        const [year, month, day] = selectedDate.split('-').map(Number);
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const finalDateTime = new Date(year, month - 1, day, startHour, startMinute);
        const finalEndTime = new Date(year, month - 1, day, endHour, endMinute);

        let success = false;
        if (appointmentToEdit && onUpdate) {
            success = await onUpdate({
                ...appointmentToEdit,
                clientName,
                clientPhone,
                services: selectedServices,
                datetime: finalDateTime,
                endTime: finalEndTime,
                observations,
            });
        } else {
            success = await onSchedule({
                clientName,
                clientPhone,
                services: selectedServices,
                datetime: finalDateTime,
                endTime: finalEndTime,
                observations,
            });
        }
        
        if (success) {
            resetForm();
        }
    };

    const inputClasses = "w-full h-11 px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-3xl font-bold text-purple-800 text-center mb-4">{appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            
            <div>
                <label htmlFor="client-name" className="block text-md font-medium text-purple-800 mb-1">
                    Nome da Cliente:
                </label>
                <input type="text" id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Digite o nome da cliente" className={inputClasses} required />
            </div>

            <div>
                <label htmlFor="client-phone" className="block text-md font-medium text-purple-800 mb-1">
                    Telefone (WhatsApp):
                </label>
                <input type="tel" id="client-phone" value={clientPhone} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX" maxLength={15} className={inputClasses} required />
            </div>
            
            {/* Services Section */}
            <div>
                <label htmlFor="service-select" className="block text-md font-medium text-purple-800 mb-1">Serviços:</label>
                <div className="flex gap-2">
                    <select id="service-select" value={serviceToAdd} onChange={(e) => setServiceToAdd(e.target.value)} className={inputClasses}>
                        <option value="">Selecione um serviço</option>
                        {SERVICES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                    <button type="button" onClick={handleAddService} className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg shadow-sm hover:bg-purple-600 transition-colors" disabled={!serviceToAdd || selectedServices.some(s => s.name === serviceToAdd)}>
                        Adicionar
                    </button>
                </div>
            </div>

            {selectedServices.length > 0 && (
                <div className="space-y-3 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    {selectedServices.map((service, index) => (
                        <div key={index} className="flex items-center gap-2 justify-between">
                            <span className="text-purple-800 font-medium flex-grow">{service.name}</span>
                            <div className="flex items-center gap-1">
                                <span className="text-purple-800">R$</span>
                                <input type="number" value={service.value} onChange={(e) => handleServiceValueChange(index, e.target.value)} step="0.01" min="0" className="w-20 px-2 py-1 bg-white border border-pink-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-pink-400" />
                            </div>
                            <button type="button" onClick={() => handleRemoveService(index)} className="p-1 text-rose-500 hover:bg-rose-100 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    ))}
                     <div className="border-t border-pink-200 pt-2 mt-2 flex justify-end items-center">
                         <div className="text-right">
                             <span className="text-lg font-bold text-purple-800">Total:</span>
                             <span className="text-2xl font-extrabold text-green-600 ml-2">
                                 {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </span>
                         </div>
                     </div>
                </div>
            )}
             
             <div>
                <label htmlFor="observations" className="block text-md font-medium text-purple-800 mb-1">
                    Observações:
                </label>
                <textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Alergias, preferências, etc." rows={2} className="w-full px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition" />
            </div>

            <div>
                <label htmlFor="appointment-date" className="block text-md font-medium text-purple-800 mb-1">
                    Data:
                </label>
                <input type="date" id="appointment-date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={inputClasses} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-time" className="block text-md font-medium text-purple-800 mb-1">
                        Das:
                    </label>
                    <select id="start-time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClasses} required>
                        <option value="">--:--</option>
                        {TIMES.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="end-time" className="block text-md font-medium text-purple-800 mb-1">
                        Até:
                    </label>
                     <select id="end-time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClasses} required disabled={!startTime}>
                        <option value="">--:--</option>
                        {filteredEndTimes.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
    );
};

export default AppointmentForm;
