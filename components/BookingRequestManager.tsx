import React from 'react';
import { Appointment, Professional } from '../types';

interface BookingRequestManagerProps {
    isOpen: boolean;
    onClose: () => void;
    requests: Appointment[];
    professionals: Professional[];
    onApprove: (request: Appointment) => void;
    onReject: (requestId: number) => void;
}

const BookingRequestManager: React.FC<BookingRequestManagerProps> = ({ isOpen, onClose, requests, professionals, onApprove, onReject }) => {
    if (!isOpen) return null;

    const sortedRequests = [...requests].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70 animate-backdrop-in"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--surface-opaque)] rounded-2xl shadow-2xl p-6 m-4 max-w-2xl w-full animate-modal-in flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-[var(--text-dark)]">Solicitações de Agendamento</h3>
                     <button type="button" onClick={onClose} className="p-2 -mt-2 -mr-2 text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto max-h-[70vh] space-y-3 pr-2 -mr-2">
                    {sortedRequests.length > 0 ? (
                        sortedRequests.map(request => {
                            const professional = professionals.find(p => p.username === request.professionalUsername);
                            return (
                                <div key={request.id} className="bg-white p-4 rounded-lg shadow-sm border border-[var(--border)]">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                        <div className="flex-grow">
                                            <p className="font-bold text-lg text-[var(--text-dark)]">{request.clientName}</p>
                                            <p className="text-sm text-[var(--primary)] font-medium">{request.clientPhone}</p>
                                            <div className="mt-2 text-sm text-[var(--text-body)]">
                                                <p><span className="font-semibold">Serviços:</span> {request.services.map(s => s.name).join(', ')}</p>
                                                <p><span className="font-semibold">Data:</span> {new Date(request.datetime).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                                <p><span className="font-semibold">Profissional:</span> {professional?.name || request.professionalUsername}</p>
                                                {request.observations && <p className="mt-1 italic"><span className="font-semibold">Obs:</span> "{request.observations}"</p>}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">
                                            <button 
                                                onClick={() => onApprove(request)}
                                                className="w-full px-4 py-2 bg-[var(--success)] text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-all text-sm active:scale-95"
                                            >
                                                Aprovar
                                            </button>
                                            <button 
                                                onClick={() => onReject(request.id)}
                                                className="w-full px-4 py-2 bg-[var(--danger)] text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-all text-sm active:scale-95"
                                            >
                                                Rejeitar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-[var(--secondary)] italic">Nenhuma solicitação pendente no momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingRequestManager;