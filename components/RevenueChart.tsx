import React, { useState, useMemo } from 'react';
import { MONTHS } from '../constants';

interface RevenueChartProps {
    monthlyRevenueData: { [key: string]: number }; // e.g., {'2024-06': 1500}
}

const RevenueChart: React.FC<RevenueChartProps> = ({ monthlyRevenueData }) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Find the most recent previous month with data to be the default comparison
    const getDefaultComparison = () => {
        const sortedKeys = Object.keys(monthlyRevenueData).sort().reverse();
        const previousMonthKey = sortedKeys.find(key => key < currentMonthKey);
        if (previousMonthKey) {
            const [year, month] = previousMonthKey.split('-').map(Number);
            return new Date(year, month, 1);
        }
        // Fallback to last month if no data
        return new Date(currentYear, currentMonth - 1, 1);
    };

    const [comparisonDate, setComparisonDate] = useState(getDefaultComparison);

    const availableDates = useMemo(() => {
        const dates = Object.keys(monthlyRevenueData).map(key => {
            const [year, month] = key.split('-').map(Number);
            return new Date(year, month, 1);
        });
        // Sort descending
        return dates.sort((a, b) => b.getTime() - a.getTime());
    }, [monthlyRevenueData]);

    const handleComparisonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setComparisonDate(new Date(year, month, 1));
    };

    const currentMonthRevenue = monthlyRevenueData[currentMonthKey] || 0;
    const comparisonMonthKey = `${comparisonDate.getFullYear()}-${String(comparisonDate.getMonth()).padStart(2, '0')}`;
    const comparisonMonthRevenue = monthlyRevenueData[comparisonMonthKey] || 0;
    
    const maxValue = Math.max(currentMonthRevenue, comparisonMonthRevenue, 1); // Use 1 to avoid division by zero

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const Bar = ({ value, maxValue, colorClass, label }: { value: number, maxValue: number, colorClass: string, label: string }) => {
        const heightPercentage = (value / maxValue) * 100;
        return (
            <div className="flex flex-col items-center h-full justify-end w-20">
                <div className="text-sm font-bold text-[var(--text-dark)] mb-1">{formatCurrency(value)}</div>
                <div 
                    className={`${colorClass} w-full rounded-t-lg transition-all duration-500 ease-out`} 
                    style={{ height: `${heightPercentage}%` }}
                ></div>
                <div className="text-center font-semibold text-[var(--secondary)] mt-2">{label}</div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[var(--border)]">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[var(--text-dark)]">Análise Comparativa</h3>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <span className="font-semibold text-[var(--text-body)]">Comparar com:</span>
                    <select
                        value={`${comparisonDate.getFullYear()}-${comparisonDate.getMonth()}`}
                        onChange={handleComparisonChange}
                        className="h-10 px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                        {availableDates.map(date => {
                             const year = date.getFullYear();
                             const month = date.getMonth();
                             return (
                                <option key={date.toISOString()} value={`${year}-${month}`}>
                                    {MONTHS[month]} de {year}
                                </option>
                             )
                        })}
                    </select>
                </div>
            </div>

            <div className="h-72 w-full flex justify-center items-end gap-12 md:gap-24 p-4 border-t border-[var(--border)]">
                <Bar 
                    value={comparisonMonthRevenue} 
                    maxValue={maxValue} 
                    colorClass="bg-[var(--secondary)] opacity-80" 
                    label={`${MONTHS[comparisonDate.getMonth()]}`}
                />
                <Bar 
                    value={currentMonthRevenue} 
                    maxValue={maxValue} 
                    colorClass="bg-[var(--primary)]"
                    label="Mês Atual"
                />
            </div>
        </div>
    );
};

export default RevenueChart;
