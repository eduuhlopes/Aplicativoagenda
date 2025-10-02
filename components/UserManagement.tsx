import React, { useState, useEffect } from 'react';

// This component's internal representation of a user from localStorage
interface StoredUser {
    name: string;
    password?: string;
}

interface UserManagementProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
    showModal: (title: string, message: string, onConfirm?: () => void) => void;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const UserManagement: React.FC<UserManagementProps> = ({ showToast, showModal }) => {
    const [users, setUsers] = useState<Record<string, StoredUser>>({});
    const [newUsername, setNewUsername] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const USERS_KEY = 'spaco-delas-users';

    useEffect(() => {
        try {
            const usersJSON = localStorage.getItem(USERS_KEY);
            if (usersJSON) {
                // Fix: Cast the result of JSON.parse to the correct type to resolve downstream type errors.
                setUsers(JSON.parse(usersJSON) as Record<string, StoredUser>);
            }
        } catch (e) {
            console.error("Failed to load users", e);
            showToast("Erro ao carregar usuários.", 'error');
        }
    }, [showToast]);

    const saveUsers = (updatedUsers: Record<string, StoredUser>) => {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
        } catch (e) {
            console.error("Failed to save users", e);
            showToast("Erro ao salvar usuários.", 'error');
        }
    };
    
    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        const username = newUsername.trim().toLowerCase();
        if (!username || !newDisplayName.trim() || !newPassword.trim()) {
            showToast("Todos os campos são obrigatórios.", 'error');
            return;
        }
        if (users[username]) {
            showToast("Este nome de usuário já existe.", 'error');
            return;
        }
        if (username.includes(' ')) {
             showToast("Nome de usuário não pode conter espaços.", 'error');
            return;
        }

        const updatedUsers = { ...users, [username]: { name: newDisplayName.trim(), password: newPassword.trim() } };
        saveUsers(updatedUsers);
        showToast(`Usuário @${username} adicionado com sucesso!`, 'success');
        setNewUsername('');
        setNewDisplayName('');
        setNewPassword('');
    };

    const handleDeleteUser = (username: string) => {
        if (username === 'admin') {
            showToast("A conta de administrador não pode ser removida.", 'error');
            return;
        }
        setUserToDelete(username);
        showModal(
            `Remover Usuário?`, 
            `Tem certeza que deseja remover o usuário @${username}? Os agendamentos e dados deste usuário NÃO serão apagados, mas se tornarão inacessíveis. Esta ação não pode ser desfeita.`, 
            () => {
                const updatedUsers = { ...users };
                delete updatedUsers[username];
                saveUsers(updatedUsers);
                showToast(`Usuário @${username} removido.`, 'success');
                setUserToDelete(null); // Hide animation trigger
            }
        );
    };

    const inputClasses = "w-full h-11 px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition";

    return (
        <div className="space-y-6">
            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="space-y-4 p-4 bg-[var(--highlight)] border border-[var(--border)] rounded-lg">
                <h3 className="text-xl font-semibold text-[var(--text-dark)] mb-3 text-center">Adicionar Novo Usuário</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Nome de Usuário (login):</label>
                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="ex: joana" className={inputClasses} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Nome de Exibição:</label>
                        <input type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder="ex: Joana Silva" className={inputClasses} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Senha:</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className={inputClasses} />
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-transform transform hover:scale-105 active:scale-95">
                    Adicionar Usuário
                </button>
            </form>

            {/* Existing Users List */}
            <div>
                 <h3 className="text-xl font-semibold text-[var(--text-dark)] mb-3 text-center">Usuários Existentes</h3>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 -mr-2">
                    {Object.entries(users).map(([username, rawUserData]) => {
                        // Fix: Explicitly cast userData to StoredUser to resolve the type error, as TypeScript
                        // cannot guarantee the shape of data parsed from JSON.
                        const userData = rawUserData as StoredUser;
                        return (
                        <div key={username} className={`bg-white p-3 rounded-lg shadow flex items-center justify-between transition-all duration-500 ${userToDelete === username ? 'animate-fade-out' : ''}`}>
                            <div>
                                <p className="font-semibold text-[var(--text-dark)]">{userData.name}</p>
                                <p className="text-sm text-[var(--secondary)]">@{username}</p>
                            </div>
                            <button
                                onClick={() => handleDeleteUser(username)}
                                disabled={username === 'admin'}
                                className="p-2 text-[var(--danger)] hover:bg-red-100 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Remover ${username}`}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    )})}
                 </div>
            </div>
        </div>
    );
};

export default UserManagement;