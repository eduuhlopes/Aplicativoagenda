import React, { useState, useEffect } from 'react';
import { CustomTheme } from '../types';
import CollapsibleSection from './CollapsibleSection';

export const themes = [
    { name: 'pink', label: 'Rosa Pastel', color: '#C77D93' },
    { name: 'blue', label: 'Azul Sereno', color: '#A7C7E7' },
    { name: 'green', label: 'Verde Menta', color: '#98D7C2' },
    { name: 'dark', label: 'Modo Escuro', color: '#1a1a2e' },
];

interface ThemeSwitcherProps {
    currentTheme: string;
    onThemeChange: (themeName: string) => void;
    customTheme: CustomTheme;
    onCustomThemeChange: (theme: CustomTheme) => void;
    defaultCustomTheme: CustomTheme;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const ColorPicker: React.FC<{ label: string; value: string; onChange: (value: string) => void; }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-md text-[var(--text-body)]">{label}</label>
        <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-[var(--secondary)]">{value}</span>
            <input 
                type="color" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 p-1 bg-white border border-[var(--border)] rounded-md cursor-pointer"
            />
        </div>
    </div>
);

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange, customTheme, onCustomThemeChange, defaultCustomTheme, showToast }) => {
    const [localColors, setLocalColors] = useState<CustomTheme>(customTheme);

    useEffect(() => {
        setLocalColors(customTheme);
    }, [customTheme]);

    const handleColorChange = (key: keyof CustomTheme, value: string) => {
        setLocalColors(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveCustomTheme = () => {
        onCustomThemeChange(localColors);
        onThemeChange('custom');
        showToast('Tema personalizado salvo!', 'success');
    };

    const handleResetTheme = () => {
        onCustomThemeChange(defaultCustomTheme);
        setLocalColors(defaultCustomTheme);
        onThemeChange('pink');
        showToast('Tema redefinido para o padrão.', 'success');
    }

    return (
        <div className="border-t-2 border-[var(--border)] pt-6">
            <h2 className="text-2xl font-bold text-[var(--text-dark)] text-center mb-4">
                Mudar Tema
            </h2>
            <div className="flex justify-center gap-4">
                {themes.map(theme => (
                    <button
                        key={theme.name}
                        onClick={() => onThemeChange(theme.name)}
                        className={`w-12 h-12 rounded-full border-4 focus:outline-none transition-transform transform hover:scale-110 ${
                            currentTheme === theme.name ? 'border-[var(--primary)] ring-2 ring-offset-2 ring-[var(--primary)]' : 'border-transparent hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: theme.color }}
                        aria-label={`Mudar para o tema ${theme.label}`}
                        title={theme.label}
                    />
                ))}
            </div>

            <div className="mt-6">
                 <CollapsibleSection title="Customizar Tema">
                    <div className="space-y-4 p-4 bg-[var(--highlight)] rounded-lg">
                        <ColorPicker label="Cor Primária (Destaques)" value={localColors.primary} onChange={(v) => handleColorChange('primary', v)} />
                        <ColorPicker label="Cor Secundária" value={localColors.secondary} onChange={(v) => handleColorChange('secondary', v)} />
                        <ColorPicker label="Fundo da Página" value={localColors.background} onChange={(v) => handleColorChange('background', v)} />
                        <ColorPicker label="Fundo de Cards" value={localColors.surfaceOpaque} onChange={(v) => handleColorChange('surfaceOpaque', v)} />
                        <ColorPicker label="Texto (Títulos)" value={localColors.textDark} onChange={(v) => handleColorChange('textDark', v)} />
                        <ColorPicker label="Texto (Corpo)" value={localColors.textBody} onChange={(v) => handleColorChange('textBody', v)} />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleResetTheme} className="w-full py-2 px-4 bg-gray-400 text-white font-bold rounded-lg shadow-md hover:bg-gray-500">
                            Resetar
                        </button>
                        <button onClick={handleSaveCustomTheme} className="w-full py-2 px-4 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)]">
                            Salvar Tema Customizado
                        </button>
                    </div>
                 </CollapsibleSection>
            </div>
        </div>
    );
};

export default ThemeSwitcher;