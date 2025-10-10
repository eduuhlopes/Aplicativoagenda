import React from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { CustomTheme } from '../types';

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block ml-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


interface SettingsProps {
    currentTheme: string;
    onThemeChange: (themeName: string) => void;
    customTheme: CustomTheme;
    onCustomThemeChange: (theme: CustomTheme) => void;
    defaultCustomTheme: CustomTheme;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const Settings: React.FC<SettingsProps> = (props) => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-view-in">
            <h2 className="text-4xl font-bold text-[var(--text-dark)] text-center flex items-center justify-center">
                Configurações
                <SettingsIcon />
            </h2>

            <div className="bg-white/80 p-6 rounded-xl shadow-md border border-[var(--border)]">
                <ThemeSwitcher {...props} />
            </div>

            {/* Other settings sections could be added here in the future */}
        </div>
    );
};

export default Settings;