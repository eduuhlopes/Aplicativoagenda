import React, { useState, useEffect } from 'react';
// FIX: Imported StoredProfessional type and removed unused Professional type.
import { Service, StoredProfessional } from '../types';

interface ProfessionalManagementProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
    showModal: (title: string, message: string, onConfirm?: () => void) => void;
    services: Service[];
    // FIX: Changed props to use the correct StoredProfessional type.
    professionals: Record<string, StoredProfessional>;
    onUsersChange: React.Dispatch<React.SetStateAction<Record<string, StoredProfessional>>>;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const EditIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);


const UserManagement: React.FC<ProfessionalManagementProps> = ({ showToast, showModal, services, professionals, onUsersChange }) => {
    const [editingUsername, setEditingUsername] = useState<string | null>(null);

    // Form state for both adding and editing
    const [formUsername, setFormUsername] = useState('');
    const [formDisplayName, setFormDisplayName] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formRole, setFormRole] = useState<'admin' | 'professional'>('professional');
    const [formAssignedServices, setFormAssignedServices] = useState<string[]>([]);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const resetForm = () => {
        setFormUsername('');
        setFormDisplayName('');
        setFormPassword('');
        setFormRole('professional');
        setFormAssignedServices([]);
    };
    
    const cancelEdit = () => {
        setEditingUsername(null);
    };

    // Populate form when editing starts
    useEffect(() => {
        if (editingUsername && professionals[editingUsername]) {
            const userToEdit = professionals[editingUsername];
            setFormUsername(editingUsername);
            setFormDisplayName(userToEdit.name);
            setFormPassword(''); // Clear password field for security/simplicity
            // FIX: Added a fallback for role, as it can be optional in the StoredProfessional type.
            setFormRole(userToEdit.role || 'professional');
            setFormAssignedServices(userToEdit.assignedServices || []);
        } else {
            resetForm();
        }
    }, [editingUsername, professionals]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingUsername) {
            // --- UPDATE LOGIC ---
            if (!formDisplayName.trim()) {
                showToast("O nome de exibição é obrigatório.", 'error');
                return;
            }
            const updatedUsers = { ...professionals };
            updatedUsers[editingUsername] = {
                ...updatedUsers[editingUsername], // Preserve original password if not changed
                name: formDisplayName.trim(),
                role: formRole,
                assignedServices: formAssignedServices,
            };
            // Only update password if a new one is typed
            if (formPassword.trim()) {
                updatedUsers[editingUsername].password = formPassword.trim();
            }

            onUsersChange(updatedUsers);
            showToast(`Profissional @${editingUsername} atualizada com sucesso!`, 'success');
            cancelEdit();

        } else {
            // --- ADD LOGIC ---
            const username = formUsername.trim().toLowerCase();
            if (!username || !formDisplayName.trim() || !formPassword.trim()) {
                showToast("Todos os campos de texto são obrigatórios.", 'error');
                return;
            }
            if (professionals[username]) {
                showToast("Este nome de usuário já existe.", 'error');
                return;
            }
            if (username.includes(' ')) {
                showToast("Nome de usuário não pode conter espaços.", 'error');
                return;
            }

            const updatedUsers = {
                ...professionals,
                [username]: {
                    name: formDisplayName.trim(),
                    password: formPassword.trim(),
                    role: formRole,
                    assignedServices: formAssignedServices
                }
            };
            onUsersChange(updatedUsers);
            showToast(`Profissional @${username} adicionada com sucesso!`, 'success');
            resetForm();
        }
    };

    const handleDeleteUser = (username: string) => {
        if (username === 'admin') {
            showToast("A conta de administrador não pode ser removida.", 'error');
            return;
        }
        setUserToDelete(username);
        showModal(
            `Remover Profissional?`, 
            `Tem certeza que deseja remover @${username}? Os agendamentos e dados desta profissional NÃO serão apagados, mas ela não poderá mais acessar o sistema.`, 
            () => {
                const updatedUsers = { ...professionals };
                delete updatedUsers[username];
                onUsersChange(updatedUsers);
                showToast(`Profissional @${username} removida.`, 'success');
                setUserToDelete(null);
            }
        );
    };

    const handleServiceToggle = (serviceName: string) => {
        setFormAssignedServices(prev =>
            prev.includes(serviceName)
                ? prev.filter(s => s !== serviceName)
                : [...prev, serviceName]
        );
    };

    const inputClasses = "w-full h-11 px-3 py-2 bg-[var(--highlight)] border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition disabled:opacity-50 disabled:bg-gray-200";

    return (
        <div className="space-y-6">
            {/* Add/Edit User Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 p-4 bg-[var(--highlight)] border border-[var(--border)] rounded-lg">
                <h3 className="text-xl font-semibold text-[var(--text-dark)] mb-3 text-center">
                    {editingUsername ? `Editando @${editingUsername}` : 'Adicionar Nova Profissional'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Nome de Usuário (login):</label>
                        <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="ex: joana" className={inputClasses} disabled={!!editingUsername} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Nome de Exibição:</label>
                        <input type="text" value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder="ex: Joana Silva" className={inputClasses} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Senha:</label>
                        <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder={editingUsername ? "Deixe em branco para não alterar" : "••••••••"} className={inputClasses} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Função:</label>
                        <select value={formRole} onChange={(e) => setFormRole(e.target.value as any)} className={inputClasses} disabled={editingUsername === 'admin'}>
                            <option value="professional">Profissional</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">Serviços que realiza:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-white rounded-lg border border-[var(--border)] max-h-32 overflow-y-auto">
                        {services.map(service => (
                            <label key={service.name} className="flex items-center space-x-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={formAssignedServices.includes(service.name)}
                                    onChange={() => handleServiceToggle(service.name)}
                                    className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary-hover)]"
                                />
                                <span>{service.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {editingUsername && (
                        <button type="button" onClick={cancelEdit} className="w-full py-2 px-4 bg-gray-400 text-white font-bold rounded-lg shadow-md hover:bg-gray-500 transition-transform transform hover:scale-105 active:scale-95">
                            Cancelar Edição
                        </button>
                    )}
                    <button type="submit" className="w-full py-2 px-4 bg-[var(--primary)] text-white font-bold rounded-lg shadow-md hover:bg-[var(--primary-hover)] transition-transform transform hover:scale-105 active:scale-95">
                        {editingUsername ? 'Salvar Alterações' : 'Adicionar Profissional'}
                    </button>
                </div>
            </form>

            {/* Existing Users List */}
            <div>
                 <h3 className="text-xl font-semibold text-[var(--text-dark)] mb-3 text-center">Profissionais Existentes</h3>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 -mr-2">
                    {Object.entries(professionals).map(([username, userData]) => (
                        <div key={username} className={`bg-white p-3 rounded-lg shadow flex items-center justify-between transition-all duration-500 ${userToDelete === username ? 'animate-fade-out' : ''}`}>
                            <div>
                                <p className="font-semibold text-[var(--text-dark)]">{userData.name} <span className="text-xs font-bold uppercase text-white bg-[var(--accent)] px-1.5 py-0.5 rounded-full ml-1">{userData.role}</span></p>
                                <p className="text-sm text-[var(--secondary)]">@{username}</p>
                                <p className="text-xs text-gray-500 mt-1 italic">{userData.assignedServices?.join(', ') || 'Nenhum serviço atribuído'}</p>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setEditingUsername(username)}
                                    className="p-2 text-gray-500 hover:text-[var(--primary)] hover:bg-gray-100 rounded-full transition-all active:scale-95"
                                    aria-label={`Editar ${username}`}
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(username)}
                                    disabled={username === 'admin'}
                                    className="p-2 text-[var(--danger)] hover:bg-red-100 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Remover ${username}`}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default UserManagement;