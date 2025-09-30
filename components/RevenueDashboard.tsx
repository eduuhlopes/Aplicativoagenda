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

const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-3 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12 7a1 1 0 11-2 0 1 1 0 012 0zm-4 4a1 1 0 100 2h8a1 1 0 100-2H8z" clipRule="evenodd" />
      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
    </svg>
);


const RevenueDashboard: React.FC<RevenueDashboardProps> = ({ projectedRevenue, monthlyRevenue }) => {
    return (
        <div className="flex flex-col h-full">
             <h2 className="text-3xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                Painel Financeiro
                <ChartBarIcon />
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