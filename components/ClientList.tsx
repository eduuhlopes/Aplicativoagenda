import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import ClientItem from './ClientItem';

const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-3 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11h1v6h-1.07zM4.5 12A5 5 0 019 7h1a5 5 0 014.5 5v2h-2a3 3 0 00-3-3H9a3 3 0 00-3 3H4v-2z" />
    </svg>
);


interface ClientListProps {
    clients: Client[];
}

const ClientList: React.FC<ClientListProps> = ({ clients }) => {
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
            <h2 className="text-3xl font-bold text-purple-800 text-center mb-6 flex items-center justify-center">
                Minhas Clientes
                 <UserGroupIcon />
            </h2>
            
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Buscar cliente por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 px-4 py-2 bg-pink-50 border-2 border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition text-lg"
                    aria-label="Buscar cliente"
                />
                 <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                {clients.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10">
                        <p className="text-purple-600 text-center italic">Nenhuma cliente registrada ainda. Os dados aparecerão aqui após a finalização de um agendamento.</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10">
                        <p className="text-purple-600 text-center italic">Nenhuma cliente encontrada com o nome "{searchTerm}".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClients.map(client => (
                            <ClientItem key={client.phone} client={client} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientList;