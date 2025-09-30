import React from 'react';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onClose, onConfirm, confirmText, cancelText }) => {
    if (!isOpen) return null;

    const handlePrimaryAction = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-pink-50 rounded-2xl shadow-2xl p-6 m-4 max-w-sm w-full transform transition-transform duration-300 scale-95"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-purple-800 mb-4">{title}</h3>
                <p className="text-md text-purple-700 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    {onConfirm && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                        >
                            {cancelText || 'Cancelar'}
                        </button>
                    )}
                    <button
                        onClick={handlePrimaryAction}
                        className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                    >
                        {onConfirm ? (confirmText || 'Confirmar') : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;