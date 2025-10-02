import React, { useState, useMemo } from 'react';
import { EnrichedClient } from '../types';
import ClientItem from './ClientItem';

const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-3 text-[var(--accent)]" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11h1v6h-1.07zM4.5 12A5 5 0 019 7h1a5 5 0 014.5 5v2h-2a3 3 0 00-3-3H9a3 3 0 00-3 3H4v-2z" />
    </svg>
);


interface ClientListProps {
    clients: EnrichedClient[];
    onAddClient: () => void;
    onEditClient: (client: EnrichedClient) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onAddClient, onEditClient }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = useMemo(() => {
        if (!searchTerm) {
            return clients;
        }
        return clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-3xl font-bold text-[var(--text-dark)] text-center mb-6 flex items-center justify-center">
                Minhas Clientes
                 <UserGroupIcon />
            </h2>
            
            <div className="mb-6 flex items-center gap-4">
                 <div className="relative flex-grow">
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
                <button 
                    onClick={onAddClient} 
                    className="flex-shrink-0 px-4 h-12 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-transform transform hover:scale-105 active:scale-95"
                    aria-label="Adicionar nova cliente"
                >
                   + Adicionar
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                {clients.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10">
                        <p className="text-[var(--secondary)] text-center italic">Nenhuma cliente registrada. Clique em "+ Adicionar" para começar.</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10">
                        <p className="text-[var(--secondary)] text-center italic">Nenhuma cliente encontrada com o nome "{searchTerm}".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClients.map(client => (
                            <ClientItem key={client.id} client={client} onEdit={onEditClient} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientList;