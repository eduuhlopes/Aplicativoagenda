import React from 'react';

const PaymentsView: React.FC = () => {
    return (
        <div>
            <h2 className="text-3xl font-bold text-[var(--text-dark)] text-center mb-6">
                Pagamentos
            </h2>
            <div className="text-center py-10 bg-white rounded-lg border border-dashed border-[var(--border)]">
                <p className="text-[var(--secondary)] italic">A funcionalidade de pagamentos está em desenvolvimento.</p>
            </div>
        </div>
    );
};

export default PaymentsView;
