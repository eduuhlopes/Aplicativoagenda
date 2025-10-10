import React, { useState } from 'react';
// FIX: The correct class name is GoogleGenAI, not GoogleGenerativeAI.
import { GoogleGenAI, Type } from '@google/genai';
import { Appointment, Professional, Service } from '../types';

interface SmartSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (data: Partial<Appointment>) => void;
    services: Service[];
    professionals: Professional[];
    showToast: (message: string, type?: 'success' | 'error') => void;
    currentUser: Professional;
}

const SparklesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 12l-2.293-2.293a1 1 0 010-1.414L10 6m5 4l2.293-2.293a1 1 0 000-1.414L15 6m-5 4l-2.293 2.293a1 1 0 000 1.414L10 18l2.293-2.293a1 1 0 000-1.414L10 12z" />
    </svg>
);

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SmartSchedulerModal: React.FC<SmartSchedulerModalProps> = ({ isOpen, onClose, onSchedule, services, professionals, showToast, currentUser }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;
    
    // Function to parse flexible date/time strings (e.g., "amanhã", "sexta-feira")
    const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
        // This is a simplified parser. For production, a library like date-fns would be more robust.
        const now = new Date();
        let targetDate = new Date();

        // Handle relative dates
        const lowerDateStr = dateStr.toLowerCase();
        if (lowerDateStr.includes('hoje')) {
            // No date change needed
        } else if (lowerDateStr.includes('amanhã')) {
            targetDate.setDate(now.getDate() + 1);
        } else if (lowerDateStr.includes('depois de amanhã')) {
             targetDate.setDate(now.getDate() + 2);
        } else if (lowerDateStr.match(/\d{1,2}\/\d{1,2}/)) { // "DD/MM"
            const [day, month] = dateStr.split('/').map(Number);
            targetDate.setMonth(month - 1, day);
            if (targetDate < now) targetDate.setFullYear(now.getFullYear() + 1);
        } else {
             const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
             const dayIndex = weekdays.findIndex(day => lowerDateStr.includes(day));
             if (dayIndex !== -1) {
                 const currentDay = now.getDay();
                 let diff = dayIndex - currentDay;
                 if (diff <= 0) diff += 7; // Get the next occurrence of the day
                 targetDate.setDate(now.getDate() + diff);
             } else {
                 return null; // Can't parse date
             }
        }
        
        // Handle time
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;

        targetDate.setHours(hours, minutes, 0, 0);
        return targetDate;
    };


    const handleProcessRequest = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        
        const availableServices = services.map(s => s.name).join(', ');
        const availableProfessionals = professionals.map(p => p.name).join(', ');
        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });

        const systemInstruction = `
            Você é um assistente de agendamento para um salão de beleza. Sua tarefa é extrair informações de um texto em português e retorná-las em formato JSON.
            O usuário pode usar termos relativos como "hoje", "amanhã", "sexta-feira". Hoje é ${today}.
            Serviços disponíveis: ${availableServices}.
            Profissionais disponíveis: ${availableProfessionals}.
            Se o nome da profissional não for mencionado e houver apenas uma, associe a ela. Se houver mais de uma e nenhuma for mencionada, deixe o campo 'professionalName' como null.
            Assuma que os serviços mencionados são da lista de serviços disponíveis.
            Retorne a hora no formato "HH:MM".
        `;

        try {
            // FIX: The correct class name is GoogleGenAI, not GoogleGenerativeAI.
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            clientName: { type: Type.STRING, description: "Nome da cliente." },
                            services: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de nomes de serviços solicitados." },
                            professionalName: { type: Type.STRING, description: "Nome da profissional solicitada. Pode ser null." },
                            date: { type: Type.STRING, description: `A data do agendamento. Pode ser uma data relativa como "hoje", "amanhã", ou o nome de um dia da semana. Ex: "amanhã"` },
                            time: { type: Type.STRING, description: `A hora do agendamento no formato HH:MM. Ex: "15:30"` }
                        }
                    }
                }
            });
            
            const resultJsonStr = response.text;
            const result = JSON.parse(resultJsonStr);
            
            if (!result.clientName || !result.services || !result.date || !result.time) {
                 throw new Error("A IA não conseguiu extrair todas as informações necessárias.");
            }
            
            // --- Process the structured data ---
            const datetime = parseDateTime(result.date, result.time);
            if (!datetime) {
                showToast(`Não foi possível entender a data "${result.date} ${result.time}". Tente ser mais específico.`, 'error');
                setIsLoading(false);
                return;
            }

            const matchedServices = result.services
                .map((serviceName: string) => services.find(s => s.name.toLowerCase() === serviceName.toLowerCase()))
                .filter(Boolean);
            
            if (matchedServices.length !== result.services.length) {
                showToast("Um ou mais serviços não foram reconhecidos.", 'error');
                setIsLoading(false);
                return;
            }

            let professionalUsername: string | undefined;
            if (result.professionalName) {
                const matchedProf = professionals.find(p => p.name.toLowerCase() === result.professionalName.toLowerCase());
                if (!matchedProf) {
                     showToast(`Profissional "${result.professionalName}" não encontrada.`, 'error');
                     setIsLoading(false);
                     return;
                }
                professionalUsername = matchedProf.username;
            } else if (currentUser.role !== 'admin') {
                professionalUsername = currentUser.username; // Default to current user
            } else if (professionals.length === 1) {
                professionalUsername = professionals[0].username; // Default to the only professional
            } else {
                 showToast("Por favor, especifique uma profissional.", 'error');
                 setIsLoading(false);
                 return;
            }


            const partialAppointment: Partial<Appointment> = {
                clientName: result.clientName,
                services: matchedServices,
                professionalUsername,
                datetime,
            };

            onSchedule(partialAppointment);

        } catch (error) {
            console.error("Error processing AI request:", error);
            showToast("Ocorreu um erro ao processar la solicitação. Tente novamente.", "error");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70 animate-backdrop-in"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--surface-opaque)] rounded-2xl shadow-2xl p-6 m-4 max-w-lg w-full animate-modal-in flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-[var(--text-dark)] flex items-center gap-2"><SparklesIcon /> Agendamento Rápido com IA</h3>
                     <button type="button" onClick={onClose} className="p-2 -mt-2 -mr-2 text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <p className="text-[var(--text-body)] mb-4">
                    Digite os detalhes do agendamento em uma única frase. A IA irá preencher o formulário para você revisar.
                </p>
                
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Marcar pé e mão para a Julia com a Ana, sexta-feira às 15h"
                    rows={3}
                    className="w-full p-3 bg-[var(--highlight)] border-2 border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                    disabled={isLoading}
                />

                <p className="text-xs text-center text-[var(--secondary)] italic mt-2">
                    A IA irá tentar identificar o cliente, serviços, profissional e a data/hora.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 transition-all active:scale-95">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleProcessRequest} 
                        className="px-6 py-2 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-all active:scale-95 w-40 flex items-center justify-center"
                        disabled={isLoading || !prompt.trim()}
                    >
                        {isLoading ? <LoadingSpinner /> : 'Processar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartSchedulerModal;
