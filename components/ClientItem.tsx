import React from 'react';
import { EnrichedClient } from '../types';

interface ClientItemProps {
    client: EnrichedClient;
    onEdit: (client: EnrichedClient) => void;
}

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.485 2.495c.646-1.113 2.384-1.113 3.03 0l6.28 10.875c.646 1.113-.23 2.505-1.515 2.505H3.72c-1.285 0-2.16-1.392-1.515-2.505L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);


const ClientItem: React.FC<ClientItemProps> = ({ client, onEdit }) => {
    const formattedTotalSpent = client.totalSpent.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const CANCELLATION_THRESHOLD = 2;
    const INACTIVITY_THRESHOLD_DAYS = 90;

    const isFrequentCanceller = client.cancellationCount > CANCELLATION_THRESHOLD;
    const isInactive = client.daysSinceLastVisit !== null && client.daysSinceLastVisit > INACTIVITY_THRESHOLD_DAYS;

    const cardClasses = `p-5 rounded-lg shadow-md border flex flex-col justify-between transition-all hover:shadow-lg hover:scale-[1.03] ${
        isFrequentCanceller
        ? 'bg-rose-50 border-rose-300 hover:border-rose-400'
        : isInactive 
        ? 'bg-amber-50 border-amber-300 hover:border-amber-400' 
        : 'bg-white border-[var(--border)] hover:border-[var(--accent)]'
    }`;

    return (
        <div className={`${cardClasses} relative group`}>
             <button
                onClick={() => onEdit(client)}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-[var(--primary)] rounded-full hover:bg-[var(--highlight)] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Editar ${client.name}`}
             >
                <PencilIcon />
            </button>
            <div>
                <p className="font-extrabold text-xl text-[var(--text-dark)] truncate pr-8">{client.name}</p>
                <p className="text-sm text-[var(--primary)] font-medium mb-4">{client.phone}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div>
                    <p className="text-xs text-[var(--secondary)] uppercase font-semibold">Total Gasto</p>
                    <p className="font-bold text-lg text-[var(--success)]">{formattedTotalSpent}</p>
                </div>
                 <div>
                    <p className="text-xs text-[var(--secondary)] uppercase font-semibold">Última Visita</p>
                    {client.daysSinceLastVisit !== null ? (
                         <p className="font-bold text-md text-[var(--text-dark)]">
                           {client.daysSinceLastVisit === 0 ? "Hoje" : `há ${client.daysSinceLastVisit} d` }
                         </p>
                    ) : (
                        <p className="text-sm text-[var(--text-dark)] italic">-</p>
                    )}
                </div>
                <div>
                    <p className="text-xs text-[var(--secondary)] uppercase font-semibold">Cancelou</p>
                    <p className={`font-bold text-lg ${client.cancellationCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-dark)]'}`}>
                        {client.cancellationCount}x
                    </p>
                </div>
            </div>

            {isFrequentCanceller && (
                <div className="mt-4 pt-3 border-t border-rose-200 flex items-center text-sm text-rose-800 font-semibold">
                    <WarningIcon />
                    <span>Cliente cancela com frequência.</span>
                </div>
            )}
             {isInactive && !isFrequentCanceller && (
                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center text-sm text-amber-800 font-semibold">
                    <WarningIcon />
                    <span>Cliente inativa.</span>
                </div>
            )}
        </div>
    );
};

export default ClientItem;