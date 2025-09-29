
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onClose }) => {
    if (!isOpen) return null;

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
                <p className="text-md text-pink-800 mb-6">{message}</p>
                <div className="text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
