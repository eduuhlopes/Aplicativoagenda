import React, { useRef, useState, useEffect } from 'react';

const BackupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


interface BackupRestoreProps {
    onExport: () => void;
    onImport: (data: any) => void;
    onRestore: (data: any) => void;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ onExport, onImport, onRestore }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [autoBackups, setAutoBackups] = useState<{key: string; date: Date}[]>([]);

    useEffect(() => {
        try {
            const allBackupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith('spa-autobackup-'));
            
            const backups = allBackupKeys.map(key => {
                const dateString = key.replace('spa-autobackup-', '');
                return { key, date: new Date(dateString) };
            }).sort((a, b) => b.date.getTime() - a.date.getTime());

            setAutoBackups(backups);
        } catch (error) {
            console.error("Failed to load auto-backups", error);
        }
    }, []);

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
                if (typeof text === 'string') {
                    const data = JSON.parse(text);
                    onImport(data);
                }
            } catch (error) {
                console.error("Erro ao importar o arquivo:", error);
                alert("Erro ao ler o arquivo de backup. Verifique se o arquivo é um JSON válido.");
            }
        };
        reader.readAsText(file);
        
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRestoreClick = (key: string) => {
        try {
            const backupJSON = localStorage.getItem(key);
            if (backupJSON) {
                const backupData = JSON.parse(backupJSON);
                onRestore(backupData);
            }
        } catch (error) {
            console.error("Failed to restore from backup", error);
            alert("Erro ao restaurar o backup.");
        }
    };

    const handleDeleteBackup = (key: string) => {
        if (window.confirm("Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.")) {
            localStorage.removeItem(key);
            setAutoBackups(prev => prev.filter(b => b.key !== key));
        }
    };

    return (
        <div className="border-t-2 border-pink-200 pt-8 mt-8">
            <h2 className="text-2xl font-bold text-purple-800 text-center mb-4 flex items-center justify-center">
                Backup e Restauração
                <BackupIcon />
            </h2>
            <div className="flex flex-col gap-4">
                <button
                    onClick={onExport}
                    className="w-full py-3 px-4 bg-blue-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
                >
                    Exportar Dados (Backup)
                </button>
                <button
                    onClick={handleImportClick}
                    className="w-full py-3 px-4 bg-green-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105"
                >
                    Importar Dados (Restaurar)
                </button>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-purple-800 text-center mb-3">Backups Automáticos</h3>
                {autoBackups.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {autoBackups.map(backup => (
                            <div key={backup.key} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                                <p className="font-semibold text-purple-700">
                                    {backup.date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRestoreClick(backup.key)}
                                        className="px-3 py-1 bg-teal-500 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 transition-colors text-sm"
                                    >
                                        Restaurar
                                    </button>
                                     <button
                                        onClick={() => handleDeleteBackup(backup.key)}
                                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-full"
                                        title="Excluir este backup"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-purple-600 text-center italic">Nenhum backup automático criado ainda.</p>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
                aria-label="Importar arquivo de backup"
            />
        </div>
    );
};

export default BackupRestore;