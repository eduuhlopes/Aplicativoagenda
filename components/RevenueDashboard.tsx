import React from 'react';

interface RevenueDashboardProps {
    projectedRevenue: number;
    monthlyRevenue: number;
}

const RevenueCard: React.FC<{ title: string; amount: number; colorClass: string }> = ({ title, amount, colorClass }) => {
    const formattedAmount = amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${colorClass}`}>
            <h3 className="text-lg font-semibold text-purple-700 mb-2">{title}</h3>
            <p className="text-4xl font-extrabold text-purple-900">{formattedAmount}</p>
        </div>
    );
};

const NailPolishIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1a1 1 0 00-1-1V5.5a.5.5 0 00-1 0V10a1 1 0 001 1h.5a.5.5 0 010 1H10a.5.5 0 010-1H11a1 1 0 001-1V5.5a1.5 1.5 0 01-3 0V10a1 1 0 001 1h.5a.5.5 0 010 1H7a.5.5 0 010-1H8a1 1 0 001-1V5.5A1.5 1.5 0 0110 3.5zM5 11.5a1.5 1.5 0 013 0V13a1 1 0 001 1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1a1 1 0 00-1-1v-1.5a.5.5 0 00-1 0V17a1 1 0 001 1h.5a.5.5 0 010 1H5.5a.5.5 0 010-1H6a1 1 0 001-1v-1.5a1.5 1.5 0 01-3 0V10a1 1 0 00-1-1H3a1 1 0 01-1-1V7a1 1 0 011-1h1a1 1 0 001 1v1.5z" />
    </svg>
);


const RevenueDashboard: React.FC<RevenueDashboardProps> = ({ projectedRevenue, monthlyRevenue }) => {
    return (
        <div className="flex flex-col h-full">
             <h2 className="text-2xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                Painel Financeiro
                <NailPolishIcon />
            </h2>
            <div className="space-y-6">
                <RevenueCard
                    title="Faturamento Projetado"
                    amount={projectedRevenue}
                    colorClass="border-blue-400"
                />
                <RevenueCard
                    title="Faturamento do Mês"
                    amount={monthlyRevenue}
                    colorClass="border-green-400"
                />
            </div>
             <div className="mt-6 text-center text-sm text-pink-600 italic">
                <p>Projetado: soma dos serviços agendados e não finalizados.</p>
                <p>Do Mês: soma dos serviços finalizados no mês atual.</p>
            </div>
        </div>
    );
};

export default RevenueDashboard;