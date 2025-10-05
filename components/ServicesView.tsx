import React, { useState, useMemo, useEffect } from 'react';
import { Service, MonthlyPackage } from '../types';

const ServicesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const PackageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const SaveIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


interface ServicesViewProps {
    services: Service[];
    onUpdateService: (service: Service) => void;
    monthlyPackage: MonthlyPackage;
    onUpdatePackage: (pkg: MonthlyPackage) => void;
}

const ServicesView: React.FC<ServicesViewProps> = ({ services, onUpdateService, monthlyPackage, onUpdatePackage }) => {
    const [editingServiceName, setEditingServiceName] = useState<string | null>(null);
    const [editedService, setEditedService] = useState<Service | null>(null);
    const [isEditingPackage, setIsEditingPackage] = useState(false);
    const [editedPackagePrice, setEditedPackagePrice] = useState(monthlyPackage.price);

    useEffect(() => {
        if (!isEditingPackage) {
            setEditedPackagePrice(monthlyPackage.price);
        }
    }, [monthlyPackage, isEditingPackage]);

    const handleEditClick = (service: Service) => {
        setEditingServiceName(service.name);
        setEditedService({ ...service });
    };

    const handleCancel = () => {
        setEditingServiceName(null);
        setEditedService(null);
    };

    const handleSave = () => {
        if (editedService) {
            onUpdateService(editedService);
            handleCancel();
        }
    };
    
    const handleFieldChange = (field: 'value' | 'duration', value: string) => {
        if (editedService) {
            const numericValue = field === 'value' ? parseFloat(value) : parseInt(value, 10);
            setEditedService({ ...editedService, [field]: isNaN(numericValue) ? 0 : numericValue });
        }
    };

    const handlePackageEditClick = () => {
        setIsEditingPackage(true);
    };

    const handlePackageCancel = () => {
        setIsEditingPackage(false);
        setEditedPackagePrice(monthlyPackage.price);
    };

    const handlePackageSave = () => {
        if (editedPackagePrice >= 0) {
            onUpdatePackage({ ...monthlyPackage, price: editedPackagePrice });
            setIsEditingPackage(false);
        }
    };

    const servicesByCategory = useMemo(() => {
        return services.reduce((acc, service) => {
            const category = service.category || 'Outros';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {} as Record<string, typeof services>);
    }, [services]);
    
    const categoryOrder = ['Unhas', 'Pés', 'Design', 'Pacotes', 'Outros'];
    const sortedCategories = Object.keys(servicesByCategory).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const inputClasses = "px-2 py-1 bg-white border border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

    return (
        <div className="space-y-10">
            {/* Price Table Section */}
            <div>
                <h2 className="text-3xl font-bold text-[var(--text-dark)] text-center mb-6 flex items-center justify-center">
                    Tabela de Preços
                    <ServicesIcon />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedCategories.map(category => (
                        servicesByCategory[category].length > 0 &&
                        <div key={category} className="bg-white/80 p-5 rounded-xl shadow-md border border-[var(--border)]">
                            <h3 className="text-2xl font-bold text-[var(--primary)] font-brand mb-4">{category}</h3>
                            <ul className="space-y-3">
                                {servicesByCategory[category].map(service => (
                                    <li key={service.name} className="flex justify-between items-center border-b border-dashed border-[var(--border)] pb-3 last:border-b-0 min-h-[60px]">
                                        {editingServiceName === service.name ? (
                                            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-lg text-[var(--text-dark)]">{service.name}</p>
                                                     <div className="flex items-baseline gap-1 text-sm text-[var(--secondary)]">
                                                        <input type="number" value={editedService?.duration} onChange={(e) => handleFieldChange('duration', e.target.value)} step="5" min="0" className={`${inputClasses} w-16`} />
                                                        <span>minutos</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm text-[var(--secondary)]">R$</span>
                                                        <input type="number" value={editedService?.value} onChange={(e) => handleFieldChange('value', e.target.value)} step="0.01" min="0" className={`${inputClasses} w-20 font-bold`} />
                                                    </div>
                                                    <button onClick={handleSave} className="p-2 text-[var(--success)] hover:bg-green-100 rounded-full transition-transform active:scale-90" aria-label="Salvar"><SaveIcon /></button>
                                                    <button onClick={handleCancel} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-transform active:scale-90" aria-label="Cancelar">
                                                        <CancelIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="font-semibold text-lg text-[var(--text-dark)]">{service.name}</p>
                                                    <p className="text-sm text-[var(--secondary)]">{service.duration} minutos</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-xl text-[var(--success)]">
                                                        {service.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                    <button onClick={() => handleEditClick(service)} className="p-2 text-gray-400 hover:text-[var(--primary)] rounded-full hover:bg-[var(--highlight)] transition-all" aria-label={`Editar ${service.name}`}>
                                                        <PencilIcon />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Packages Section */}
            <div>
                 <h2 className="text-3xl font-bold text-[var(--text-dark)] text-center mb-6 flex items-center justify-center">
                    Pacotes Mensais
                    <PackageIcon />
                </h2>
                <div className="bg-white/80 p-6 rounded-xl shadow-md border border-[var(--border)]">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h4 className="font-bold text-xl text-[var(--text-dark)]">Pacote Pé+Mão Mensal</h4>
                            <p className="text-[var(--text-body)]">4 sessões por mês com agendamento semanal.</p>
                        </div>
                        {isEditingPackage ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-[var(--secondary)]">R$</span>
                                    <input 
                                        type="number" 
                                        value={editedPackagePrice} 
                                        onChange={(e) => setEditedPackagePrice(parseFloat(e.target.value) || 0)} 
                                        className={`${inputClasses} w-24 font-bold text-lg`}
                                        step="5"
                                        min="0"
                                        autoFocus
                                    />
                                </div>
                                <button onClick={handlePackageSave} className="p-2 text-[var(--success)] hover:bg-green-100 rounded-full transition-transform active:scale-90" aria-label="Salvar preço do pacote"><SaveIcon /></button>
                                <button onClick={handlePackageCancel} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-transform active:scale-90" aria-label="Cancelar edição do pacote">
                                    <CancelIcon />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <p className="font-bold text-2xl text-[var(--success)]">
                                    {monthlyPackage.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <button onClick={handlePackageEditClick} className="p-2 text-gray-400 hover:text-[var(--primary)] rounded-full hover:bg-[var(--highlight)] transition-all" aria-label="Editar preço do pacote">
                                    <PencilIcon />
                                </button>
                            </div>
                        )}
                    </div>
                     <p className="text-sm text-[var(--text-body)] italic mt-4 pt-4 border-t border-dashed border-[var(--border)] text-center sm:text-left">
                        <strong>Regra:</strong> sessões não realizadas na semana agendada são automaticamente canceladas e não podem ser reagendadas, garantindo sua previsibilidade.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ServicesView;