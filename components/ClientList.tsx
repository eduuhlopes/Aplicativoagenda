import React, { useState, useMemo } from 'react';
import { EnrichedClient, Appointment, AppointmentStatus, Client } from '../types';
import ClientItem from './ClientItem';

const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);
const ArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7 7" />
    </svg>
);


const getStatusChip = (status: AppointmentStatus) => {
    const statusStyles: { [key in AppointmentStatus]: { text: string; bg: string; textCol: string; } } = {
        // FIX: Add 'pending' status to satisfy the AppointmentStatus type.
        pending: { text: 'Pendente', bg: 'bg-yellow-100', textCol: 'text-yellow-800' },
        scheduled: { text: 'Agendado', bg: 'bg-blue-100', textCol: 'text-blue-800' },
        confirmed: { text: 'Confirmado', bg: 'bg-indigo-100', textCol: 'text-indigo-800' },
        completed: { text: 'Finalizado', bg: 'bg-green-100', textCol: 'text-green-800' },
        cancelled: { text: 'Cancelado', bg: 'bg-red-100', textCol: 'text-red-800' },
        delayed: { text: 'Atrasado', bg: 'bg-yellow-100', textCol: 'text-yellow-800' },
    };
    const style = statusStyles[status] || { text: status, bg: 'bg-gray-100', textCol: 'text-gray-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.textCol}`}>{style.text}</span>;
};


interface ClientHistoryDetailsProps {
    client: EnrichedClient;
    appointments: Appointment[];
    onEditClient: (client: EnrichedClient) => void;
}

const ClientHistoryDetails: React.FC<ClientHistoryDetailsProps> = ({ client, appointments, onEditClient }) => {
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const toggleSortOrder = () => {
        setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    };

    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => {
            if (sortOrder === 'desc') {
                return b.datetime.getTime() - a.datetime.getTime();
            }
            return a.datetime.getTime() - b.datetime.getTime();
        });
    }, [appointments, sortOrder]);


    return (
        <div>
            {/* Client Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-[var(--border)] mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h3 className="text-4xl font-extrabold text-[var(--text-dark)]">{client.name}</h3>
                        <p className="text-lg font-medium text-[var(--primary)] mt-1">{client.phone}</p>
                        {client.observations && <p className="text-sm mt-3 text-[var(--text-body)] bg-[var(--highlight)] p-2 rounded-md border border-dashed border-[var(--border)]">{client.observations}</p>}
                    </div>
                    <button
                        onClick={() => onEditClient(client)}
                        className="flex-shrink-0 flex items-center px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all active:scale-95 text-sm"
                    >
                        <PencilIcon /> Editar Cliente
                    </button>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-center border-t border-[var(--border)] pt-5">
                    <div>
                        <p className="text-sm text-[var(--secondary)] uppercase font-bold">Total Gasto</p>
                        <p className="font-extrabold text-2xl text-[var(--success)]">{client.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[var(--secondary)] uppercase font-bold">Última Visita</p>
                        {client.daysSinceLastVisit !== null ? (
                             <p className="font-extrabold text-xl text-[var(--text-dark)]">
                               {client.daysSinceLastVisit === 0 ? "Hoje" : `há ${client.daysSinceLastVisit} dias` }
                             </p>
                        ) : (
                            <p className="text-lg text-[var(--text-dark)] italic">-</p>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-[var(--secondary)] uppercase font-bold">Cancelamentos</p>
                        <p className={`font-extrabold text-2xl ${client.cancellationCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-dark)]'}`}>
                            {client.cancellationCount}
                        </p>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="flex justify-between items-center mb-4">
                 <h4 className="text-2xl font-bold text-[var(--text-dark)]">Histórico de Agendamentos</h4>
                 <button 
                    onClick={toggleSortOrder}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:underline focus:outline-none p-1"
                    title="Alterar ordem de exibição"
                 >
                    {sortOrder === 'desc' ? <ArrowDownIcon /> : <ArrowUpIcon />}
                    <span>{sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}</span>
                 </button>
            </div>
            <div className="space-y-3">
                {sortedAppointments.length > 0 ? (
                    sortedAppointments.map(appt => {
                        const totalValue = appt.services.reduce((sum, s) => sum + s.value, 0);
                        return (
                            <div key={appt.id} className="bg-white p-4 rounded-lg shadow-sm border border-[var(--border)]">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                    <div className="flex-grow">
                                        <p className="font-bold text-md text-[var(--text-dark)]">{appt.datetime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} - {appt.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-sm text-[var(--secondary)]">{appt.services.map(s => s.name).join(', ')}</p>
                                    </div>
                                    <div className="flex sm:flex-col items-end gap-2 sm:gap-1 w-full sm:w-auto text-right">
                                        {getStatusChip(appt.status)}
                                        <p className="font-bold text-lg text-[var(--success)]">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-8 bg-white rounded-lg border border-dashed border-[var(--border)]">
                        <p className="text-[var(--secondary)] italic">Nenhum agendamento encontrado para esta cliente.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


interface ClientListProps {
    clients: EnrichedClient[];
    appointments: Appointment[];
    onAddClient: () => void;
    onEditClient: (client: EnrichedClient) => void;
    viewingHistoryFor?: Client | null;
    onClearHistoryView: () => void;
}

type SortOption = 'spent' | 'recent' | 'inactive';

const ClientList: React.FC<ClientListProps> = ({ clients, appointments, onAddClient, onEditClient, viewingHistoryFor, onClearHistoryView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('spent');

    if (viewingHistoryFor) {
        const clientData = clients.find(c => c.id === viewingHistoryFor.id);
        const clientAppointments = appointments.filter(a => a.clientPhone === viewingHistoryFor.phone);

        if (!clientData) {
            return (
                <div className="text-center">
                    <button onClick={onClearHistoryView} className="flex items-center gap-2 mb-4 font-semibold text-[var(--primary)] hover:underline">
                        <BackArrowIcon />
                        Voltar para Todas as Clientes
                    </button>
                    <p className="text-[var(--secondary)] italic mt-8">Cliente não encontrada.</p>
                </div>
            );
        }
        
        return (
            <div className="animate-view-in">
                 <button onClick={onClearHistoryView} className="flex items-center gap-2 mb-4 font-semibold text-[var(--primary)] hover:underline">
                    <BackArrowIcon />
                    Voltar para Todas as Clientes
                </button>
                <ClientHistoryDetails client={clientData} appointments={clientAppointments} onEditClient={onEditClient} />
            </div>
        );
    }

    const sortedAndFilteredClients = useMemo(() => {
        let processedClients = [...clients];

        if (searchTerm) {
            processedClients = processedClients.filter(client =>
                client.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        switch (sortOption) {
            case 'spent':
                processedClients.sort((a, b) => b.totalSpent - a.totalSpent);
                break;
            case 'recent':
                processedClients.sort((a, b) => (a.daysSinceLastVisit ?? Infinity) - (b.daysSinceLastVisit ?? Infinity));
                break;
            case 'inactive':
                 processedClients.sort((a, b) => (b.daysSinceLastVisit ?? -1) - (a.daysSinceLastVisit ?? -1));
                break;
        }

        return processedClients;
    }, [clients, searchTerm, sortOption]);

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-3xl font-bold text-[var(--text-dark)] text-center mb-6 flex items-center justify-center">
                Minhas Clientes
                 <UserGroupIcon />
            </h2>
            
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                 <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        placeholder="Buscar cliente por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 px-4 py-2 bg-[var(--highlight)] border-2 border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition text-lg"
                        aria-label="Buscar cliente"
                    />
                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--secondary)] opacity-75 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="h-12 px-3 py-2 bg-white border-2 border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex-grow"
                    >
                        <option value="spent">Mais Gastam</option>
                        <option value="recent">Mais Recentes</option>
                        <option value="inactive">Inativas</option>
                    </select>
                    <button 
                        onClick={onAddClient} 
                        className="flex-shrink-0 px-4 h-12 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-transform transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        aria-label="Adicionar nova cliente"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                       Adicionar
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                {clients.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10">
                        <p className="text-[var(--secondary)] text-center italic">Nenhuma cliente registrada. Clique em "+ Adicionar" para começar.</p>
                    </div>
                ) : sortedAndFilteredClients.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10">
                        <p className="text-[var(--secondary)] text-center italic">Nenhuma cliente encontrada com o nome "{searchTerm}".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedAndFilteredClients.map(client => (
                            <ClientItem key={client.id} client={client} onEdit={onEditClient} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientList;