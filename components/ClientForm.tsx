import React, { useState, useEffect } from 'react';
import { Client } from '../types';

// Define types for the experimental Contact Picker API to resolve TypeScript errors.
interface ContactInfo {
    name?: string[];
    tel?: string[];
}

interface ContactsManager {
    select(properties: Array<'name' | 'tel'>, options?: { multiple: boolean }): Promise<ContactInfo[]>;
}

interface NavigatorWithContacts extends Navigator {
    contacts?: ContactsManager;
}

interface ClientFormProps {
    onSave: (clientData: Omit<Client, 'id'> | Client) => void;
    clientToEdit: Client | null;
    onCancel: () => void;
    existingClients: Client[];
}

const AddressBookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H7z" clipRule="evenodd" />
      <path d="M15 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" />
    </svg>
);

const ClientForm: React.FC<ClientFormProps> = ({ onSave, clientToEdit, onCancel, existingClients }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [observations, setObservations] = useState('');
    const [error, setError] = useState('');
    const [isContactPickerSupported, setIsContactPickerSupported] = useState(false);

    useEffect(() => {
        // Check for Contact Picker API support, but disable it in iframes to prevent errors.
        const nav = navigator as NavigatorWithContacts;
        const isNotInIframe = window.self === window.top;
        if (nav.contacts && 'select' in nav.contacts && isNotInIframe) {
            setIsContactPickerSupported(true);
        }
    }, []);

    useEffect(() => {
        if (clientToEdit) {
            setName(clientToEdit.name);
            setPhone(clientToEdit.phone);
            setObservations(clientToEdit.observations || '');
        } else {
            setName('');
            setPhone('');
            setObservations('');
        }
        setError('');
    }, [clientToEdit]);

    const formatPhone = (value: string) => {
        let digits = value.replace(/\D/g, '');
        if (digits.length > 11) {
            digits = digits.slice(0, 11);
        }
        const length = digits.length;
        if (length > 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        } else if (length > 6) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        } else if (length > 2) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        }
        return digits;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhone(e.target.value));
    };

    const handleSelectContact = async () => {
        try {
            // Use type assertion to call the Contact Picker API.
            const contacts = await (navigator as NavigatorWithContacts).contacts!.select(['name', 'tel'], { multiple: false });
            if (contacts.length === 0) {
                return; // User cancelled
            }
            const contact = contacts[0];
            if (contact.name && contact.name.length > 0) {
                setName(contact.name[0]);
            }
            if (contact.tel && contact.tel.length > 0) {
                let rawPhone = contact.tel[0];
                let digits = rawPhone.replace(/\D/g, '');
                // Check for Brazilian country code (+55) and remove it if present
                if (digits.startsWith('55') && digits.length > 11) {
                    digits = digits.substring(2);
                }
                setPhone(formatPhone(digits));
            }
        } catch (ex) {
            console.error('Error selecting contact:', ex);
            setError("Não foi possível acessar os contatos. Verifique as permissões do navegador.");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !phone.trim()) {
            setError("Nome e telefone são obrigatórios.");
            return;
        }
        
        const sanitizedPhone = phone.replace(/\D/g, '');
        if (sanitizedPhone.length < 10) {
             setError("O formato do telefone parece inválido.");
             return;
        }

        const clientData = {
            name: name.trim(),
            phone,
            observations: observations.trim()
        };
        
        if (clientToEdit) {
            onSave({ ...clientToEdit, ...clientData });
        } else {
            onSave(clientData);
        }
    };
    
    const inputClasses = "w-full h-11 px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-start">
                <h2 className="text-3xl font-bold text-[var(--text-dark)] mb-4">{clientToEdit ? 'Editar Cliente' : 'Nova Cliente'}</h2>
                <button type="button" onClick={onCancel} className="p-2 -mt-2 -mr-2 text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {error && <p className="text-center text-sm font-semibold text-[var(--danger)] bg-red-100 p-2 rounded-md">{error}</p>}
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="client-name-form" className="block text-md font-medium text-[var(--text-dark)]">
                            Nome da Cliente:
                        </label>
                        {isContactPickerSupported && !clientToEdit && (
                            <button type="button" onClick={handleSelectContact} className="flex items-center gap-1.5 text-sm text-[var(--primary)] font-semibold hover:underline" title="Importar da sua agenda de contatos">
                                <AddressBookIcon />
                                Importar da Agenda
                            </button>
                        )}
                    </div>
                    <input type="text" id="client-name-form" value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite o nome da cliente" className={inputClasses} required />
                </div>

                <div>
                    <label htmlFor="client-phone-form" className="block text-md font-medium text-[var(--text-dark)] mb-1">
                        Telefone (WhatsApp):
                    </label>
                    <input type="tel" id="client-phone-form" value={phone} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX" maxLength={15} className={inputClasses} required />
                </div>
            </div>
             
             <div>
                <label htmlFor="client-observations" className="block text-md font-medium text-[var(--text-dark)] mb-1">
                    Observações:
                </label>
                <textarea id="client-observations" value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Alergias, preferências, histórico, etc." rows={3} className="w-full px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition" />
            </div>

            <div className="mt-6 flex flex-col items-center">
                <button type="submit" className="w-full py-3 px-4 bg-[var(--primary)] text-white font-bold text-lg rounded-lg shadow-md hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-50" disabled={!name || !phone}>
                    {clientToEdit ? 'Salvar Alterações' : 'Adicionar Cliente'}
                </button>
            </div>
        </form>
    );
};

export default ClientForm;