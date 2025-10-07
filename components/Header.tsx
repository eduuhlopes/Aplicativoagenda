import React, { useState, useEffect } from 'react';
import { Appointment, Professional } from '../types';

interface HeaderProps {
    logoUrl: string;
    headerStyle: { background: string; color: string; notificationBg: string; } | null;
    notificationAppointments: Appointment[];
    bookingRequests: Appointment[];
    isNotificationPopoverOpen: boolean;
    onToggleNotificationPopover: () => void;
    onOpenBookingRequestModal: () => void;
    currentUser: Professional | null;
    onLogout: () => void;
}

const bibleVerses = [
    "O coração alegre é um bom remédio. - Provérbios 17:22",
    "Eu tenho força para todas as coisas, por meio daquele que me dá poder. - Filipenses 4:13",
    "A sua beleza não deve ser a exterior... mas a pessoa secreta do coração. - 1 Pedro 3:3, 4",
    "Lancem sobre ele toda a sua ansiedade, porque ele cuida de vocês. - 1 Pedro 5:7",
    "A alegria que vem de Jeová é a fortaleza de vocês. - Neemias 8:10",
    "Pois Deus 'enxugará dos seus olhos toda lágrima'. - Apocalipse 21:4",
    "O fruto do espírito é amor, alegria, paz... - Gálatas 5:22, 23",
    "Jeová é o meu pastor. Nada me faltará. - Salmo 23:1"
];

const formatRelativeDateTime = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const appointmentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (appointmentDay.getTime() === today.getTime()) {
        return `Hoje às ${time}`;
    }
    if (appointmentDay.getTime() === tomorrow.getTime()) {
        return `Amanhã às ${time}`;
    }
    return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const InboxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ logoUrl, headerStyle, notificationAppointments, bookingRequests, isNotificationPopoverOpen, onToggleNotificationPopover, onOpenBookingRequestModal, currentUser, onLogout }) => {
    const [quote, setQuote] = useState('');
    const [isQuoteVisible, setIsQuoteVisible] = useState(true);
    
    useEffect(() => {
        // Set initial quote
        setQuote(bibleVerses[Math.floor(Math.random() * bibleVerses.length)]);

        const quoteInterval = setInterval(() => {
            setIsQuoteVisible(false); // Start fade out
            setTimeout(() => {
                let nextQuote;
                do {
                    nextQuote = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
                } while (nextQuote === quote); // Avoid showing the same quote twice in a row
                setQuote(nextQuote);
                setIsQuoteVisible(true); // Start fade in
            }, 500); // Wait for fade out animation
        }, 10000); // 10 seconds

        return () => clearInterval(quoteInterval);
    }, [quote]); // Dependency on quote to avoid stale state in closure

    const headerDynamicStyle = headerStyle ? { background: headerStyle.background, color: headerStyle.color } : {};
    const textAndIconDynamicStyle = headerStyle ? { color: headerStyle.color, textShadow: '1px 1px 3px rgba(0,0,0,0.2)' } : {};
    const buttonDynamicStyle = headerStyle ? {
        backgroundColor: headerStyle.notificationBg,
        color: headerStyle.color,
    } : {
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    };
    
    return (
        <header 
            className="relative flex flex-col sm:flex-row items-center justify-between transition-all duration-500"
            style={headerDynamicStyle}
        >
            <div className="flex items-center gap-4 self-start">
                <img src={logoUrl} alt="Spaço Delas Logo" className="h-16 w-16 rounded-full object-cover border-2 border-white/50 shadow-lg" />
                <div className="text-left">
                    <h1 
                        className="font-brand text-4xl sm:text-5xl md:text-6xl font-bold animate-brand-glow"
                        style={textAndIconDynamicStyle}
                    >
                        Spaço Delas
                    </h1>
                    <p 
                        className="text-lg" 
                        style={textAndIconDynamicStyle}
                    >
                        Olá, {currentUser?.name || 'Usuário'}
                    </p>
                    <p 
                        className={`text-sm mt-1 transition-opacity duration-500 quote-text ${isQuoteVisible ? 'opacity-100' : 'opacity-0'}`}
                        style={textAndIconDynamicStyle}
                    >
                        <em>"{quote}"</em>
                    </p>
                </div>
            </div>
            
            <div className="flex w-full sm:w-auto justify-end items-center gap-2 mt-4 sm:mt-0">
                 <button 
                    onClick={onLogout}
                    className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white transition-all active:scale-95 notification-bell-button"
                    aria-label="Sair"
                    title="Sair"
                    style={buttonDynamicStyle}
                >
                    <LogoutIcon />
                </button>
                 <div className="relative">
                    <button 
                        onClick={onOpenBookingRequestModal}
                        className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white transition-all active:scale-95 notification-bell-button"
                        aria-label="Solicitações de Agendamento"
                        style={buttonDynamicStyle}
                    >
                       <InboxIcon />
                        {bookingRequests.length > 0 && (
                            <span className="absolute top-0 right-0 block h-5 w-5 text-xs flex items-center justify-center rounded-full bg-red-500 border-2 border-white ring-2 ring-white">
                                {bookingRequests.length}
                            </span>
                        )}
                    </button>
                </div>
                <div id="notification-bell" className="relative">
                    <button 
                        onClick={onToggleNotificationPopover}
                        className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white transition-all active:scale-95 notification-bell-button"
                        aria-label="Notificações"
                        style={buttonDynamicStyle}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {notificationAppointments.length > 0 && (
                            <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-white ring-2 ring-white"></span>
                        )}
                    </button>
                    {isNotificationPopoverOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-[var(--surface-opaque)] backdrop-blur-sm rounded-lg shadow-xl border border-[var(--border)] z-50 animate-popover-in origin-top-right">
                            <div className="p-4 font-bold text-[var(--text-dark)] border-b border-[var(--border)]">
                                Lembretes de Agendamento
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notificationAppointments.length > 0 ? (
                                    notificationAppointments.map(appt => (
                                        <div key={appt.id} className="p-4 border-b border-[var(--border)] last:border-b-0">
                                            <p className="font-semibold text-[var(--text-dark)]">{appt.clientName}</p>
                                            <p className="text-sm text-[var(--text-body)]">{appt.services.map(s => s.name).join(', ')}</p>
                                            <p className="text-sm text-[var(--primary)] font-medium mt-1">{formatRelativeDateTime(appt.datetime)}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-sm text-[var(--text-body)] italic">Nenhum agendamento nas próximas 24 horas.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;