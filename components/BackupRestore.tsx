import React, { useRef } from 'react';

const BackupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

interface BackupRestoreProps {
    onExport: () => void;
    onImport: (data: any) => void;
    onError: (title: string, message: string) => void;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ onExport, onImport, onError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string' && text.length > 0) {
                    const data = JSON.parse(text);
                    if (window.confirm("Você tem certeza que deseja restaurar este backup? Os dados locais atuais no seu navegador serão substituídos. Esta ação não pode ser desfeita.")) {
                        onImport(data);
                    }
                } else {
                    throw new Error("O arquivo está vazio ou não pôde ser lido como texto.");
                }
            } catch (error) {
                console.error("Erro ao importar o arquivo:", error);
                onError("Erro de Importação", `Não foi possível processar o arquivo de backup. Verifique se é um arquivo JSON válido. Detalhe: ${(error as Error).message}`);
            }
        };
        reader.onerror = () => {
             onError("Erro de Leitura", "Ocorreu um erro ao tentar ler o arquivo selecionado.");
        }
        reader.readAsText(file);
        
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-[var(--text-dark)] text-center mb-4 flex items-center justify-center">
                Backup e Restauração
                <BackupIcon />
            </h2>
            <div className="flex flex-col gap-4">
                <button
                    onClick={onExport}
                    className="w-full py-3 px-4 bg-[var(--info)] text-white font-bold text-lg rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--info)] transition-transform transform hover:scale-105 active:scale-95"
                >
                    Exportar Dados (Backup)
                </button>
                <button
                    onClick={handleImportClick}
                    className="w-full py-3 px-4 bg-[var(--success)] text-white font-bold text-lg rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--success)] transition-transform transform hover:scale-105 active:scale-95"
                >
                    Importar Dados (Restaurar)
                </button>
            </div>
            <p className="text-center text-sm text-[var(--secondary)] italic mt-4">
                Os backups são gerenciados localmente no seu navegador. Use 'Exportar' para salvar uma cópia local dos dados.
            </p>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.json"
                className="hidden"
                aria-label="Importar arquivo de backup"
            />
        </div>
    );
};

export default BackupRestore;