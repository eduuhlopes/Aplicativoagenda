import React from 'react';
import { ModalButton } from '../types';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    buttons?: ModalButton[];
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onClose, onConfirm, buttons, confirmText, cancelText }) => {
    if (!isOpen) return null;

    const getButtonClass = (style: ModalButton['style']) => {
        switch (style) {
            case 'primary':
                return 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]';
            case 'secondary':
                return 'bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-400';
            case 'danger':
                return 'bg-[var(--danger)] text-white hover:opacity-90 focus:ring-[var(--danger)]';
            default:
                return 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]';
        }
    };

    const actionButtons: ModalButton[] = buttons || (
        onConfirm ? [
            { text: cancelText || 'Cancelar', onClick: onClose, style: 'secondary' },
            { text: confirmText || 'Confirmar', onClick: onConfirm, style: 'primary' },
        ] : [
            { text: 'OK', onClick: onClose, style: 'primary' },
        ]
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70 animate-backdrop-in"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--surface-opaque)] rounded-2xl shadow-2xl p-6 m-4 max-w-sm w-full animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-[var(--text-dark)] mb-4">{title}</h3>
                <p className="text-md text-[var(--text-body)] mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    {actionButtons.map((button, index) => (
                         <button
                            key={index}
                            onClick={button.onClick}
                            className={`px-6 py-2 font-bold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all active:scale-95 ${getButtonClass(button.style)}`}
                        >
                            {button.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Modal;