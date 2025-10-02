import React, { useRef } from 'react';

interface LogoUploaderProps {
    currentLogo: string;
    onLogoChange: (logoDataUrl: string | null) => void;
    onError: (title: string, message: string) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ currentLogo, onLogoChange, onError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            onError("Formato Inválido", "Por favor, selecione um arquivo PNG ou JPG.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            onError("Arquivo Muito Grande", "O tamanho da imagem não deve exceder 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                onLogoChange(result);
            } else {
                onError("Erro de Leitura", "Não foi possível ler o arquivo de imagem.");
            }
        };
        reader.onerror = () => {
            onError("Erro de Leitura", "Ocorreu um erro ao tentar ler o arquivo selecionado.");
        };
        reader.readAsDataURL(file);
    };
    
    const handleRemoveLogo = () => {
        if (currentLogo !== '/logo.png') {
            onLogoChange(null);
        }
    };

    return (
        <div className="border-t-2 border-[var(--border)] pt-6">
            <h2 className="text-2xl font-bold text-[var(--text-dark)] text-center mb-4">
                Logo do Salão
            </h2>
            <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-[var(--border)] overflow-hidden flex items-center justify-center bg-white">
                    <img src={currentLogo} alt="Logo Atual" className="max-w-full max-h-full object-cover" />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[var(--info)] text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all text-sm active:scale-95"
                    >
                        Alterar Imagem
                    </button>
                    <button
                        onClick={handleRemoveLogo}
                        disabled={currentLogo === '/logo.png'}
                        className="px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-500 transition-all text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Remover
                    </button>
                </div>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg"
                    className="hidden"
                    aria-label="Selecionar logo"
                />
            </div>
        </div>
    );
};

export default LogoUploader;