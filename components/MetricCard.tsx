import React from 'react';

interface MetricCardProps {
    title: string;
    value: number;
    tooltip: string;
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

const MetricCard: React.FC<MetricCardProps> = ({ title, value, tooltip }) => {
    const formattedValue = value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-[var(--primary)] transform hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-[var(--text-body)]">{title}</h3>
                <div className="relative group">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {tooltip}
                        <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                </div>
            </div>
            <p className="text-4xl font-extrabold text-[var(--text-dark)]">{formattedValue}</p>
        </div>
    );
};

export default MetricCard;
