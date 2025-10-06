import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
}

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ErrorIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const Toast: React.FC<ToastProps> = ({ message, type }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // The parent component unmounts this after 3000ms.
        // We start the exit animation shortly before that.
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 2500);

        return () => {
            clearTimeout(exitTimer);
        };
    }, []);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const animationClass = isExiting ? 'toast-exit' : 'toast-enter';

    return (
        <div className={`toast ${animationClass} flex items-center gap-4 ${bgColor} text-white font-bold py-3 px-5 rounded-full shadow-lg`}>
            {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
            <span>{message}</span>
        </div>
    );
};

export default Toast;