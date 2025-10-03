import React from 'react';
import { FinancialData } from '../types';
import MetricCard from './MetricCard';
import RevenueChart from './RevenueChart';

interface FinancialsViewProps {
    financialData: FinancialData;
}

const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block ml-3 text-[var(--accent)]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12 7a1 1 0 11-2 0 1 1 0 012 0zm-4 4a1 1 0 100 2h8a1 1 0 100-2H8z" clipRule="evenodd" />
      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
    </svg>
);

const BreakdownChart: React.FC<{data: {[key: string]: number}, title: string, colorClass: string}> = ({ data, title, colorClass }) => {
    // FIX: The value from Object.entries is inferred as 'unknown'. Cast to 'number' for sorting.
    const sortedData = Object.entries(data).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 10); // Top 10
    // FIX: The value from Object.entries is inferred as 'unknown'. Cast to 'number' for Math.max.
    const maxValue = sortedData.length > 0 ? Math.max(...sortedData.map(([, value]) => value as number)) : 0;
    
    if (sortedData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-[var(--border)]">
                 <h3 className="text-2xl font-bold text-[var(--text-dark)] mb-4">{title}</h3>
                 <p className="text-center text-[var(--secondary)] italic py-8">Nenhum dado de faturamento finalizado para exibir.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[var(--border)]">
            <h3 className="text-2xl font-bold text-[var(--text-dark)] mb-4">{title}</h3>
            <div className="space-y-3">
                {sortedData.map(([name, value]) => (
                    <div key={name} className="flex items-center gap-4">
                        <div className="w-1/3 text-sm font-semibold text-[var(--text-body)] truncate" title={name}>{name}</div>
                        <div className="w-2/3 flex items-center gap-2">
                            <div className="flex-grow bg-[var(--highlight)] rounded-full h-4">
                                <div
                                    className={`${colorClass} h-4 rounded-full transition-all duration-500 ease-out`}
                                    // FIX: The value from Object.entries is inferred as 'unknown'. Cast to 'number' for arithmetic operation.
                                    style={{ width: `${((value as number) / maxValue) * 100}%` }}
                                />
                            </div>
                            <div className="font-bold text-sm text-[var(--success)] w-24 text-right">
                                {/* FIX: The value from Object.entries is inferred as 'unknown'. Cast to 'number' to call its methods. */}
                                {(value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FinancialsView: React.FC<FinancialsViewProps> = ({ financialData }) => {
    return (
        <div className="space-y-8">
            <h2 className="text-4xl font-bold text-[var(--text-dark)] text-center flex items-center justify-center">
                Painel Financeiro
                <ChartBarIcon />
            </h2>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Faturamento do Mês" 
                    value={financialData.currentMonthRevenue}
                    tooltip="Soma de todos os agendamentos finalizados no mês corrente."
                />
                <MetricCard 
                    title="Projetado para o Mês" 
                    value={financialData.projectedRevenueCurrentMonth}
                    tooltip="Soma do faturamento atual com todos os agendamentos futuros do mês."
                />
                <MetricCard 
                    title="Média Mensal" 
                    value={financialData.averageMonthlyRevenue}
                    tooltip="Média de faturamento de todos os meses com registros finalizados."
                />
                <MetricCard 
                    title="Faturamento Anual" 
                    value={financialData.totalAnnualRevenue}
                    tooltip="Soma de todo o faturamento no ano corrente."
                />
            </div>
            
            {/* Comparative Chart Section */}
            <div>
                <RevenueChart monthlyRevenueData={financialData.monthlyRevenue} />
            </div>

            {/* Breakdown Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BreakdownChart data={financialData.revenueByService} title="Faturamento por Serviço" colorClass="bg-[var(--primary)]" />
                <BreakdownChart data={financialData.revenueByProfessional} title="Faturamento por Profissional" colorClass="bg-[var(--secondary)]" />
            </div>
        </div>
    );
};

export default FinancialsView;