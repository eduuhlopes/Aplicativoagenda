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
        </div>
    );
};

export default FinancialsView;
