import React from 'react';
import { Client } from '../types';

interface ClientItemProps {
    client: Client;
}

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.485 2.495c.646-1.113 2.384-1.113 3.03 0l6.28 10.875c.646 1.113-.23 2.505-1.515 2.505H3.72c-1.285 0-2.16-1.392-1.515-2.505L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);


const ClientItem: React.FC<ClientItemProps> = ({ client }) => {
    const formattedTotalSpent = client.totalSpent.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const needsAttention = client.daysSinceLastVisit !== null && client.daysSinceLastVisit > 30;

    const cardClasses = `p-5 rounded-lg shadow-md border flex flex-col justify-between transition-all hover:shadow-lg hover:scale-105 ${
        needsAttention 
        ? 'bg-amber-50 border-amber-300 hover:border-amber-400' 
        : 'bg-white border-pink-200 hover:border-pink-300'
    }`;

    return (
        <div className={cardClasses}>
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

            {needsAttention && (
                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center text-sm text-amber-800 font-semibold">
                    <WarningIcon />
                    <span>Requer atenção: inativa.</span>
                </div>
            )}
        </div>
    );
};

export default ClientItem;