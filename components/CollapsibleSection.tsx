import React, { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="collapsible-section border-t-2 border-[var(--border)] pt-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-left text-2xl font-bold text-[var(--text-dark)] focus:outline-none"
                aria-expanded={isOpen}
            >
                <span className="flex items-center">
                    {icon && <span className="mr-3 text-[var(--accent)]">{icon}</span>}
                    {title}
                </span>
                <ChevronIcon isOpen={isOpen} />
            </button>
            <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
                <div className="pt-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CollapsibleSection;
