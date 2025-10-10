import React, { useMemo, useState } from 'react';
import { Appointment, Client, PaymentLink, PaymentProof, ModalButton } from '../types';
import CollapsibleSection from './CollapsibleSection';

interface PaymentsViewProps {
    appointments: Appointment[];
    clients: Client[];
    onMarkAsPaid: (appointmentId: number) => void;
    paymentLinks: Record<string, PaymentLink>;
    onUpdatePaymentLinks: React.Dispatch<React.SetStateAction<Record<string, PaymentLink>>>;
    paymentProofs: PaymentProof[];
    onUpdatePaymentProofs: React.Dispatch<React.SetStateAction<PaymentProof[]>>;
    showToast: (message: string, type?: 'success' | 'error') => void;
    showModal: (title: string, message: string, onConfirm?: () => void, buttons?: ModalButton[]) => void;
    closeModal: () => void;
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const PaymentsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block ml-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const WhatsAppIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
      <path d="M5.5 2A2.5 2.5 0 003 4.5v11A2.5 2.5 0 005.5 18h9a2.5 2.5 0 002.5-2.5v-11A2.5 2.5 0 0014.5 2h-9zM8 6a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H9z"/>
    </svg>
);

const LinkIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0m-4.242 6.828a2 2 0 01-2.828 0l-3-3a2 2 0 112.828-2.828l3 3a2 2 0 010 2.828zM9 11a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" />
    </svg>
);

const ProofsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);



const PaymentsView: React.FC<PaymentsViewProps> = ({ appointments, clients, onMarkAsPaid, paymentLinks, onUpdatePaymentLinks, paymentProofs, onUpdatePaymentProofs, showToast, showModal, closeModal, setAppointments }) => {
    const [reviewingProof, setReviewingProof] = useState<PaymentProof | null>(null);
    const [partialAmount, setPartialAmount] = useState('');

    const debtsByClient = useMemo(() => {
        const pendingAppointments = appointments.filter(a => a.status === 'completed' && a.paymentStatus === 'pending');
        
        const debts: Record<string, { client: Client | undefined, debts: Appointment[], total: number }> = {};

        pendingAppointments.forEach(appt => {
            const clientPhone = appt.clientPhone;
            if (!debts[clientPhone]) {
                debts[clientPhone] = {
                    client: clients.find(c => c.phone === clientPhone),
                    debts: [],
                    total: 0
                };
            }
            debts[clientPhone].debts.push(appt);
            debts[clientPhone].total += appt.services.reduce((sum, s) => sum + s.value, 0);
        });

        return Object.values(debts).sort((a,b) => b.total - a.total);

    }, [appointments, clients]);

    const totalDebt = useMemo(() => debtsByClient.reduce((sum, client) => sum + client.total, 0), [debtsByClient]);
    
    const pendingProofs = useMemo(() => {
        return paymentProofs
            .filter(p => p.status === 'rejected' || p.status === 'manual_approval' || p.status === 'pending_validation')
            .sort((a, b) => (a.validatedAt?.getTime() || Date.now()) - (b.validatedAt?.getTime() || Date.now()));
    }, [paymentProofs]);

    // --- Proof Review Handlers ---

    const handleConfirmTotal = (proof: PaymentProof) => {
        onUpdatePaymentProofs(prev => prev.map(p => p.id === proof.id ? {...p, status: 'validated', validatedAt: new Date()} : p));
        setAppointments(prev =>
            prev.map(a => proof.appointmentIds.includes(a.id) ? { ...a, paymentStatus: 'paid' } : a)
        );
        showToast('Pagamento total confirmado!', 'success');
        setReviewingProof(null);
    };

    const handleConfirmPartial = (proof: PaymentProof) => {
        const amountPaid = parseFloat(partialAmount.replace(',', '.'));
        if (isNaN(amountPaid) || amountPaid <= 0 || amountPaid >= proof.totalDue) {
            showToast('Valor parcial inválido. Deve ser maior que zero e menor que o total devido.', 'error');
            return;
        }

        onUpdatePaymentProofs(prev => prev.map(p => p.id === proof.id ? {...p, status: 'validated', validatedAt: new Date()} : p));
        setAppointments(prev => prev.map(a => proof.appointmentIds.includes(a.id) ? { ...a, paymentStatus: 'paid' } : a));

        const remainingDebt = proof.totalDue - amountPaid;
        const client = clients.find(c => c.id === proof.clientId);
        const originalAppointments = appointments.filter(a => proof.appointmentIds.includes(a.id));

        if (client && originalAppointments.length > 0) {
            const newDebtAppointment: Appointment = {
                id: Date.now(),
                clientName: client.name,
                clientPhone: client.phone,
                clientEmail: client.email,
                services: [{ name: 'Saldo Remanescente', value: remainingDebt, duration: 0, category: 'Ajuste' }],
                datetime: new Date(),
                endTime: new Date(),
                status: 'completed',
                professionalUsername: originalAppointments[0].professionalUsername,
                paymentStatus: 'pending',
            };
            setAppointments(prev => [...prev, newDebtAppointment]);
            showToast('Pagamento parcial registrado com sucesso!', 'success');
        } else {
            showToast('Erro ao criar débito remanescente.', 'error');
        }

        setReviewingProof(null);
        setPartialAmount('');
    };

    const handleRejectProof = (proof: PaymentProof) => {
        onUpdatePaymentProofs(prev => prev.map(p => p.id === proof.id ? { ...p, status: 'rejected' } : p));
        setReviewingProof(null);
        const link = `${window.location.origin}/pagar/${proof.id}`;
        showModal(
            'Comprovante Rejeitado',
            `O comprovante foi marcado como rejeitado. Você pode reenviar o link de pagamento para a cliente:\n\n${link}`,
            undefined,
            [
                { text: 'Fechar', style: 'secondary', onClick: closeModal },
                { text: 'Copiar Link', style: 'primary', onClick: () => {
                    navigator.clipboard.writeText(link);
                    showToast('Link copiado!', 'success');
                    closeModal();
                }}
            ]
        );
    };

    // --- Other Handlers ---

    const handleSendWhatsAppReminder = (client: Client, total: number) => {
        const phone = client.phone.replace(/\D/g, '');
        const message = `Olá ${client.name}! 😊 Passando para lembrar sobre o valor pendente de ${total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} referente aos seus agendamentos. Agradecemos a sua atenção! ✨`;
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleGeneratePaymentLink = (client: Client, debts: Appointment[], total: number) => {
        const linkId = `pagamento-${client.id}-${Date.now()}`;
        const newLink: PaymentLink = {
            id: linkId,
            clientId: client.id,
            appointmentIds: debts.map(d => d.id),
            totalDue: total,
            createdAt: new Date()
        };
        onUpdatePaymentLinks(prev => ({ ...prev, [linkId]: newLink }));
        
        const fullUrl = `${window.location.origin}/pagar/${linkId}`;
        
        showModal(
            "Link de Pagamento Gerado!",
            `Compartilhe este link com ${client.name}:\n\n${fullUrl}`,
            undefined,
            [
                { text: 'Fechar', style: 'secondary', onClick: closeModal },
                {
                    text: 'Copiar Link',
                    style: 'primary',
                    onClick: () => {
                        navigator.clipboard.writeText(fullUrl);
                        showToast('Link copiado para a área de transferência!', 'success');
                        closeModal();
                    }
                }
            ]
        );
    };

    const renderProofReviewModal = () => {
        if (!reviewingProof) return null;

        const client = clients.find(c => c.id === reviewingProof.clientId);
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70 animate-backdrop-in" onClick={() => setReviewingProof(null)}>
                <div className="bg-[var(--surface-opaque)] rounded-2xl shadow-2xl p-6 m-4 max-w-lg w-full animate-modal-in" onClick={e => e.stopPropagation()}>
                    <h3 className="text-2xl font-bold text-[var(--text-dark)] mb-4">Revisar Comprovante</h3>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <a href={reviewingProof.imageDataUrl} target="_blank" rel="noopener noreferrer">
                            <img src={reviewingProof.imageDataUrl} alt="Comprovante" className="w-full md:w-40 h-auto object-cover rounded-md shadow-md" />
                        </a>
                        <div className="space-y-1 text-sm">
                            <p><strong>Cliente:</strong> {client?.name || 'Não encontrada'}</p>
                            <p><strong>Total Devido:</strong> <span className="font-bold">{reviewingProof.totalDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                            <p><strong>Valor Informado:</strong> <span className="font-bold text-blue-600">{reviewingProof.clientEnteredValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</span></p>
                            <p><strong>IA Detectou:</strong> <span className="font-bold text-purple-600">{(reviewingProof.extractedValue ?? 0) > 0 ? reviewingProof.extractedValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '...'}</span></p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Ação 1: Pagamento Parcial */}
                        <div className="p-3 bg-[var(--highlight)] border border-dashed rounded-lg">
                            <label htmlFor="partial-amount" className="block text-sm font-semibold text-[var(--text-dark)] mb-2">Registrar Pagamento Parcial:</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    id="partial-amount"
                                    value={partialAmount}
                                    onChange={e => setPartialAmount(e.target.value)}
                                    placeholder="Ex: 50,00"
                                    className="w-full h-10 px-3 bg-white border border-[var(--border)] rounded-lg"
                                />
                                <button onClick={() => handleConfirmPartial(reviewingProof)} className="px-4 py-2 bg-[var(--info)] text-white text-sm font-bold rounded-lg shadow-sm whitespace-nowrap">Registrar Parcial</button>
                            </div>
                        </div>
                        {/* Ação 2: Outras Ações */}
                        <div className="flex flex-col sm:flex-row gap-2 justify-between">
                             <button onClick={() => handleRejectProof(reviewingProof)} className="px-4 py-2 bg-[var(--danger)] text-white font-bold rounded-lg shadow-sm">Rejeitar Comprovante</button>
                            <button onClick={() => handleConfirmTotal(reviewingProof)} className="px-4 py-2 bg-[var(--success)] text-white font-bold rounded-lg shadow-sm">Confirmar Pagamento Total</button>
                        </div>
                    </div>

                </div>
            </div>
        );
    };


    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--text-dark)] text-center mb-2 flex items-center justify-center">
                Controle de Pagamentos
                <PaymentsIcon />
            </h2>
             <p className="text-center text-lg text-[var(--text-body)] mb-6">
                Total pendente: <span className="font-bold text-[var(--danger)]">{totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
             </p>
            
            {/* Pending Proofs Section */}
            {pendingProofs.length > 0 && (
                 <div className="mb-8">
                    <CollapsibleSection
                        title={`Comprovantes para Revisão (${pendingProofs.length})`}
                        icon={<ProofsIcon className="h-6 w-6" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-3 pt-3">
                             {pendingProofs.map(proof => {
                                const client = clients.find(c => c.id === proof.clientId);
                                const statusInfo = {
                                    rejected: { text: "Rejeitado pela IA", color: "border-red-400" },
                                    pending_validation: { text: "Aguardando Validação da IA...", color: "border-yellow-400" },
                                    manual_approval: { text: "Aprovação Manual Necessária", color: "border-blue-400" }
                                }[proof.status];
                                 return (
                                    <div key={proof.id} className={`flex flex-col sm:flex-row justify-between items-start gap-3 p-3 bg-white rounded-md border-l-4 ${statusInfo?.color || 'border-gray-400'}`}>
                                        <img src={proof.imageDataUrl} alt="Comprovante" className="w-16 h-16 object-cover rounded-md cursor-pointer" onClick={() => window.open(proof.imageDataUrl)}/>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-md text-[var(--text-dark)]">{client?.name || 'Cliente desconhecida'}</p>
                                            <p className="font-bold text-sm text-[var(--secondary)]">Devido: {proof.totalDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            {proof.clientEnteredValue && <p className="font-bold text-sm text-blue-600">Informado: {proof.clientEnteredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                                            {proof.status === 'rejected' && <p className="text-xs font-bold text-red-600">IA detectou: {(proof.extractedValue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                                            <p className="text-xs text-gray-500 italic">{statusInfo?.text}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setReviewingProof(proof); setPartialAmount(''); }} className="px-3 py-1 bg-[var(--primary)] text-white text-sm font-bold rounded-lg shadow-sm">Revisar</button>
                                        </div>
                                    </div>
                                );
                             })}
                        </div>
                    </CollapsibleSection>
                </div>
            )}
            
            {/* Debts by Client Section */}
            <div className="space-y-4">
                {debtsByClient.length > 0 ? (
                    debtsByClient.map(({ client, debts, total }) => {
                        if (!client) return null;
                        const isOverdue = debts.some(d => (new Date().getTime() - d.datetime.getTime()) > 24 * 60 * 60 * 1000);
                        return (
                            <div key={client.id} className="bg-white p-4 rounded-lg shadow-sm border border-[var(--border)]">
                                <CollapsibleSection
                                    title={client.name}
                                    defaultOpen={debts.length < 4}
                                    icon={
                                        <div className="text-right">
                                            <p className="font-semibold text-lg text-[var(--danger)]">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                    }
                                >
                                    <div className="space-y-3 pt-3">
                                        {debts.map(debt => (
                                            <div key={debt.id} className="flex justify-between items-center gap-2 p-3 bg-[var(--highlight)] rounded-md border-l-4 border-[var(--warning)]">
                                                <p className="flex-grow font-semibold text-[var(--text-dark)] truncate" title={debt.services.map(s => s.name).join(' + ')}>
                                                    {debt.services.map(s => s.name).join(' + ')}
                                                </p>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <p className="font-bold text-md text-[var(--text-dark)]">
                                                        {debt.services.reduce((s,i)=>s+i.value,0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                                    </p>
                                                    <button
                                                        onClick={() => onMarkAsPaid(debt.id)}
                                                        className="px-3 py-1 bg-[var(--success)] text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-95"
                                                    >
                                                        Pago
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-dashed">
                                            {isOverdue && (
                                                <button onClick={() => handleSendWhatsAppReminder(client, total)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white text-sm font-bold rounded-lg shadow-sm">
                                                    <WhatsAppIcon /> Lembrar via WhatsApp
                                                </button>
                                            )}
                                            <button onClick={() => handleGeneratePaymentLink(client, debts, total)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg shadow-sm">
                                               <LinkIcon /> Gerar Link de Pagamento
                                            </button>
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg border border-dashed border-[var(--border)]">
                        <p className="text-lg text-[var(--secondary)] italic">Nenhuma pendência de pagamento encontrada. Tudo em dia! 🎉</p>
                    </div>
                )}
            </div>
            {renderProofReviewModal()}
        </div>
    );
};

export default PaymentsView;