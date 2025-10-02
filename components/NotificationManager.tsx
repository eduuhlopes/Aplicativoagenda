import React, { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = 'BPhgS40iL2bY5YV_uc2GSDs-Q2Un-s3-IM-SCrT5qJ_Y0oTR_7c-qO-d_9wQJ1z-qN_z1qK_vC-x2qJ4ZzJ5yYc';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);


const NotificationManager: React.FC = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        setPermissionStatus(Notification.permission);
        
        navigator.serviceWorker.ready.then(registration => {
            registration.pushManager.getSubscription().then(subscription => {
                if (subscription) {
                    setIsSubscribed(true);
                }
            });
        });
    }, []);

    const subscribeUser = async () => {
        if (!('serviceWorker' in navigator)) return;

        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission !== 'granted') {
                console.log('Permissão para notificações negada.');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            console.log('Usuário inscrito com sucesso:', JSON.stringify(subscription));
            // Em uma aplicação real, você enviaria a 'subscription' para o seu backend aqui.
            // Ex: await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(subscription), ... });

            setIsSubscribed(true);
        } catch (error) {
            console.error('Falha ao inscrever o usuário:', error);
        }
    };

    const unsubscribeUser = async () => {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                console.log('Inscrição removida com sucesso.');
                 // Em uma aplicação real, você também notificaria seu backend para remover a inscrição.
                setIsSubscribed(false);
            }
        } catch (error) {
            console.error('Falha ao remover inscrição:', error);
        }
    };
    
    const handleButtonClick = () => {
        if (isSubscribed) {
            unsubscribeUser();
        } else {
            subscribeUser();
        }
    };
    
    const isFeatureSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

    if (!isFeatureSupported) {
        return (
             <div>
                <p className="text-center text-sm text-[var(--secondary)] italic">Notificações push não são suportadas neste navegador.</p>
            </div>
        );
    }
    
    let buttonText = "Ativar Notificações";
    let statusText = "Receba lembretes de agendamentos futuros.";
    let buttonDisabled = false;

    if (permissionStatus === 'denied') {
        buttonText = "Permissão Bloqueada";
        statusText = "Você precisa habilitar as notificações nas configurações do navegador.";
        buttonDisabled = true;
    } else if (isSubscribed) {
        buttonText = "Desativar Notificações";
        statusText = "Você está recebendo notificações push.";
    }


    return (
        <div>
            <h2 className="text-2xl font-bold text-[var(--text-dark)] text-center mb-4 flex items-center justify-center">
                Notificações Push
                <BellIcon />
            </h2>
             <div className="flex flex-col items-center gap-4 text-center">
                <button
                    onClick={handleButtonClick}
                    disabled={buttonDisabled}
                    className={`w-full py-3 px-4 text-white font-bold text-lg rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform hover:scale-105 active:scale-95 ${
                        isSubscribed ? 'bg-[var(--danger)] hover:opacity-90 focus:ring-[var(--danger)]' 
                        : 'bg-[var(--info)] hover:opacity-90 focus:ring-[var(--info)]'}
                        ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {buttonText}
                </button>
                <p className="text-sm text-[var(--secondary)] italic">{statusText}</p>
            </div>
        </div>
    );
};

export default NotificationManager;