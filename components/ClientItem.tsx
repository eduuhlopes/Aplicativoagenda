import React from 'react';
import { Client } from '../types';

interface ClientItemProps {
    client: Client;
}

const ClientItem: React.FC<ClientItemProps> = ({ client }) => {
    const formattedTotalSpent = client.totalSpent.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div className="bg-white p-5 rounded-lg shadow-md border border-pink-200 flex flex-col justify-between transition-all hover:shadow-xl hover:border-pink-300 hover:scale-105">
            <div>
                <p className="font-extrabold text-xl text-purple-900 truncate">{client.name}</p>
                <p className="text-sm text-pink-700 font-medium mb-4">{client.phone}</p>
            </div>
            
            <div className="space-y-3 mt-2 text-right">
                <div>
                    <p className="text-xs text-purple-600 uppercase font-semibold">Total Gasto</p>
                    <p className="font-bold text-2xl text-green-600">{formattedTotalSpent}</p>
                </div>
                <div>
                    <p className="text-xs text-purple-600 uppercase font-semibold">Última Visita</p>
                    {client.daysSinceLastVisit !== null ? (
                         <p className="font-bold text-lg text-purple-800">
                           {client.daysSinceLastVisit === 0 ? "Hoje" : `há ${client.daysSinceLastVisit} dia(s)`}
                         </p>
                    ) : (
                        <p className="text-sm text-purple-800 italic">Nenhuma visita finalizada</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientItem;