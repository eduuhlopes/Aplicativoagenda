import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { PaymentProof, Client, Appointment } from '../types';

interface PaymentsViewProps {
    proofs: PaymentProof[];
    clients: Client[];
    appointments: Appointment[];
    onUpdateProof: (proof: PaymentProof) => void;
    onMarkAppointmentsAsPaid: (appointmentIds: number[]) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const LoadingSpinner: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin h-5 w-5 ${className || 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 12l-2.293-2.293a1 1 0 010-1.414L10 6m5 4l2.293-2.293a1 1 0 000-1.414L15 6m-5 4l-2.293 2.293a1 1 0 000 1.414L10 18l2.293-2.293a1 1 0 000-1.414L10 12z" />
    </svg>
);

const PaymentsView: React.FC<PaymentsViewProps> = ({ proofs, clients, appointments, onUpdateProof, onMarkAppointmentsAsPaid, showToast }) => {
    const [validatingProofId, setValidatingProofId] = useState<string | null>(null);
    const [viewingProof, setViewingProof] = useState<PaymentProof | null>(null);

    const pendingProofs = proofs.filter(p => p.status === 'pending_validation');
    const processedProofs = proofs.filter(p => p.status !== 'pending_validation').sort((a,b) => (b.validatedAt?.getTime() || 0) - (a.validatedAt?.getTime() || 0));

    const getClientName = (clientId: number) => clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido';

    const handleValidateWithAI = async (proof: PaymentProof) => {
        setValidatingProofId(proof.id);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64ImageData = proof.imageDataUrl.split(',')[1];
            
            if (!base64ImageData) throw new Error("Imagem inválida.");

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { 
                    parts: [
                        { text: "Extraia o valor numérico exato do pagamento principal deste comprovante. Responda apenas com o valor." },
                        { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            value: { type: Type.NUMBER, description: "O valor numérico do pagamento, por exemplo: 150.50" }
                        }
                    }
                }
            });
            
            const result = JSON.parse(response.text);
            const extractedValue = result.value;

            if (typeof extractedValue !== 'number') {
                throw new Error("A IA não retornou um valor numérico válido.");
            }
            
            onUpdateProof({ ...proof, extractedValue });
            showToast(`IA extraiu o valor de R$ ${extractedValue.toFixed(2)}`, 'success');

        } catch (error) {
            console.error("AI Validation Error:", error);
            showToast("Falha na validação com IA.", 'error');
        } finally {
            setValidatingProofId(null);
        }
    };

    const handleApproval = (proof: PaymentProof, status: 'validated' | 'manual_approval') => {
        onMarkAppointmentsAsPaid(proof.appointmentIds);
        onUpdateProof({ ...proof, status, validatedAt: new Date() });
        showToast(`Pagamento de ${getClientName(proof.clientId)} aprovado!`, 'success');
    };
    
    const handleRejection = (proof: PaymentProof) => {
        onUpdateProof({ ...proof, status: 'rejected', validatedAt: new Date() });
        showToast(`Pagamento de ${getClientName(proof.clientId)} rejeitado.`, 'error');
    };

    const renderProofCard = (proof: PaymentProof, isPending: boolean) => {
        const valueMatches = proof.extractedValue !== undefined && proof.clientEnteredValue !== undefined && proof.extractedValue === proof.clientEnteredValue;
        const valueClose = proof.extractedValue !== undefined && proof.clientEnteredValue !== undefined && Math.abs(proof.extractedValue - proof.clientEnteredValue) < 0.02; // Check for floating point issues
        const canAutoApprove = (valueMatches || valueClose) && proof.extractedValue === proof.totalDue;
        
        let statusBadge;
        switch(proof.status) {
            case 'validated':
            case 'manual_approval':
                statusBadge = <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aprovado</span>;
                break;
            case 'rejected':
                 statusBadge = <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejeitado</span>;
                break;
            default:
                statusBadge = <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>;
        }

        return (
            <div key={proof.id} className="bg-white p-4 rounded-lg shadow-sm border border-[var(--border)]">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    {/* Info Section */}
                    <div className="flex-grow space-y-2">
                        <div className="flex justify-between items-start">
                             <p className="font-bold text-lg text-[var(--text-dark)]">{getClientName(proof.clientId)}</p>
                             {statusBadge}
                        </div>
                        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 text-[var(--text-body)]">
                            <span className="font-semibold">Valor Devido:</span> <span className="font-mono text-right">{proof.totalDue.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}</span>
                            <span className="font-semibold">Valor Informado:</span> <span className="font-mono text-right">{proof.clientEnteredValue?.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}</span>
                            <span className="font-semibold">Valor (IA):</span> 
                            <span className={`font-mono text-right font-bold ${valueMatches ? 'text-green-600' : 'text-amber-600'}`}>
                                {proof.extractedValue !== undefined ? proof.extractedValue.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'}) : '-'}
                            </span>
                        </div>
                    </div>
                    {/* Actions Section */}
                    {isPending && (
                        <div className="flex-shrink-0 flex flex-col gap-2 w-full sm:w-40">
                             <button onClick={() => setViewingProof(proof)} className="w-full px-3 py-2 text-sm font-semibold text-[var(--primary)] bg-white border border-[var(--border)] rounded-md hover:bg-[var(--highlight)]">Ver Comprovante</button>
                             <button onClick={() => handleValidateWithAI(proof)} disabled={validatingProofId === proof.id} className="w-full px-3 py-2 text-sm font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                                {validatingProofId === proof.id ? <LoadingSpinner /> : <SparklesIcon />} Validar c/ IA
                            </button>
                            <button onClick={() => handleApproval(proof, 'validated')} disabled={!canAutoApprove} className="w-full px-3 py-2 text-sm font-semibold text-white bg-[var(--success)] rounded-md hover:opacity-90 disabled:opacity-50 disabled:grayscale">Aprovar Auto</button>
                            <div className="flex gap-2">
                               <button onClick={() => handleApproval(proof, 'manual_approval')} className="w-full px-3 py-2 text-sm font-semibold text-white bg-[var(--secondary)] rounded-md hover:opacity-90">Aprovar Manual</button>
                               <button onClick={() => handleRejection(proof)} className="w-full px-3 py-2 text-sm font-semibold text-white bg-[var(--danger)] rounded-md hover:opacity-90">Rejeitar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-[var(--text-dark)] text-center">Validação de Pagamentos</h2>
            
            {/* Pending Proofs */}
            <div>
                <h3 className="text-xl font-semibold text-[var(--text-dark)] mb-3">Pendentes de Validação</h3>
                <div className="space-y-3">
                    {pendingProofs.length > 0 ? (
                        pendingProofs.map(p => renderProofCard(p, true))
                    ) : (
                        <p className="text-center italic text-[var(--secondary)] py-4">Nenhum comprovante pendente.</p>
                    )}
                </div>
            </div>
            
            {/* Processed Proofs */}
            <div>
                 <h3 className="text-xl font-semibold text-[var(--text-dark)] mb-3">Histórico de Validações</h3>
                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                     {processedProofs.length > 0 ? (
                        processedProofs.map(p => renderProofCard(p, false))
                    ) : (
                        <p className="text-center italic text-[var(--secondary)] py-4">Nenhum comprovante processado.</p>
                    )}
                 </div>
            </div>

            {/* Image Viewer Modal */}
            {viewingProof && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-backdrop-in" onClick={() => setViewingProof(null)}>
                    <div className="p-4 bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold mb-2">Comprovante de {getClientName(viewingProof.clientId)}</h4>
                        <img src={viewingProof.imageDataUrl} alt="Comprovante" className="max-w-full max-h-[80vh] mx-auto" />
                        <button onClick={() => setViewingProof(null)} className="mt-4 w-full py-2 bg-[var(--primary)] text-white font-bold rounded-lg">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsView;
