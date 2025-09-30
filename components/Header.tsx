import React from 'react';
import { Appointment } from '../types';

const logoBase64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUwIDEwIEMgMjAgMjAsIDIwIDgwLCA1MCA5MCBDIDgwIDgwLCA4MCAyMCwgNTAgMTAgWiBNIDUwIDI1IEMgMzUgMzUsIDM1IDY1LCA1MCA3NSBDIDY1IDY1LCA2NSAzNSwgNTAgMjUgWiIgZmlsbD0iI2MwODRmYyIvPjwvc3ZnPg==";

interface HeaderProps {
    notificationAppointments: Appointment[];
    isNotificationPopoverOpen: boolean;
    onToggleNotificationPopover: () => void;
}

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


const Header: React.FC<HeaderProps> = ({ notificationAppointments, isNotificationPopoverOpen, onToggleNotificationPopover }) => (
    <header className="relative flex flex-col sm:flex-row items-center justify-between py-4">
        <div className="flex items-center gap-4">
            <img src={logoBase64} alt="Spaço Delas Logo" className="h-14 w-14" />
            <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-purple-800 tracking-tight">
                    Spaço Delas
                </h1>
                <p className="text-lg text-pink-600">
                    Agendamento de Clientes
                </p>
            </div>
        </div>
        
        <div className="absolute top-4 right-0 sm:static flex items-center gap-4 mt-4 sm:mt-0">
            <div id="notification-bell" className="relative">
                <button 
                    onClick={onToggleNotificationPopover}
                    className="p-2 text-purple-700 hover:bg-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 transition-colors"
                    aria-label="Notificações"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notificationAppointments.length > 0 && (
                        <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-white ring-2 ring-red-500"></span>
                    )}
                </button>
                {isNotificationPopoverOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border border-pink-100 z-20">
                        <div className="p-4 font-bold text-purple-800 border-b border-pink-200">
                            Lembretes de Agendamento
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notificationAppointments.length > 0 ? (
                                notificationAppointments.map(appt => (
                                    <div key={appt.id} className="p-4 border-b border-pink-100 last:border-b-0">
                                        <p className="font-semibold text-purple-900">{appt.clientName}</p>
                                        <p className="text-sm text-purple-700">{appt.services.map(s => s.name).join(', ')}</p>
                                        <p className="text-sm text-pink-700 font-medium mt-1">{formatRelativeDateTime(appt.datetime)}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="p-4 text-sm text-purple-600 italic">Nenhum agendamento nas próximas 24 horas.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </header>
);

export default Header;