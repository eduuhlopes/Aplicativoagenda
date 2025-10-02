import React from 'react';

export const themes = [
    { name: 'pink', label: 'Rosa Pastel', color: '#C77D93' },
    { name: 'blue', label: 'Azul Sereno', color: '#A7C7E7' },
    { name: 'green', label: 'Verde Menta', color: '#98D7C2' },
];

interface ThemeSwitcherProps {
    currentTheme: string;
    onThemeChange: (themeName: string) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
    return (
        <div>
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
        </div>
    );
};

export default ThemeSwitcher;