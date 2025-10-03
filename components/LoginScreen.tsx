import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface LoginScreenProps {
    onLogin: (user: User) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

interface StoredUser {
    name: string;
    password?: string;
}

// Helper functions for avatars
const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const avatarColors = [
    '#C77D93', '#8A5F8A', '#A7C7E7', '#6A8AAB', '#98D7C2', '#5C946E',
    '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'
];

const generateAvatarColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % avatarColors.length);
    return avatarColors[index];
};


const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, showToast }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [animatedErrors, setAnimatedErrors] = useState<string[]>([]);
    
    const [userList, setUserList] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Effect to set up default admin or load user list
    useEffect(() => {
        try {
            const usersJSON = localStorage.getItem('spaco-delas-users');
            if (!usersJSON || Object.keys(JSON.parse(usersJSON)).length === 0) {
                const defaultUsers = {
                    admin: { password: 'admin', name: 'Administradora' }
                };
                localStorage.setItem('spaco-delas-users', JSON.stringify(defaultUsers));
                showToast('Conta de admin padrão criada (admin/admin).', 'success');
            }
            
            // Load users for profile selection
            const storedUsers = usersJSON ? JSON.parse(usersJSON) as Record<string, StoredUser> : {};
            const loadedUsers = Object.entries(storedUsers).map(([username, data]) => ({
                username: username,
                name: data.name
            }));
            setUserList(loadedUsers);
            
        } catch (e) {
            console.error("Failed to set up or load users", e);
        }
    }, [showToast]);
    
    const resetForm = () => {
        setUsername('');
        setDisplayName('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        setSelectedUser(null);
    };

    const toggleMode = () => {
        resetForm();
        setIsRegistering(prev => !prev);
    };

    const triggerErrorAnimation = (errorFields: string[]) => {
        setAnimatedErrors(errorFields);
        setTimeout(() => setAnimatedErrors([]), 500); // Duration should match animation
    };

    const validateLogin = (): { [key: string]: string } => {
        const newErrors: { [key: string]: string } = {};
        const usersJSON = localStorage.getItem('spaco-delas-users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
    
        if (!username) {
            newErrors.username = 'O nome de usuário é obrigatório.';
        } else if (!users[username.toLowerCase()]) {
            newErrors.username = 'Usuário não encontrado.';
        } else if (!password) {
             newErrors.password = 'A senha é obrigatória.';
        } else if (users[username.toLowerCase()].password !== password) {
            newErrors.password = 'Senha incorreta.';
        }
        
        setErrors(newErrors);
        return newErrors;
    };

    const validateRegistration = (): { [key: string]: string } => {
        const newErrors: { [key: string]: string } = {};
        const usersJSON = localStorage.getItem('spaco-delas-users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};

        if (!displayName) newErrors.displayName = 'O nome de exibição é obrigatório.';

        if (!username) newErrors.username = 'O nome de usuário é obrigatório.';
        else if (username.includes(' ')) newErrors.username = 'Não pode conter espaços.';
        else if (users[username.toLowerCase()]) newErrors.username = 'Este usuário já existe.';
        
        if (!password) newErrors.password = 'A senha é obrigatória.';
        else if (password.length < 4) newErrors.password = 'A senha deve ter no mínimo 4 caracteres.';
        
        if (password !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem.';
        
        setErrors(newErrors);
        return newErrors;
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateLogin();
        if (Object.keys(validationErrors).length > 0) {
            triggerErrorAnimation(Object.keys(validationErrors));
            return;
        }

        const usersJSON = localStorage.getItem('spaco-delas-users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};

        onLogin({ username: username.toLowerCase(), name: users[username.toLowerCase()].name });
    };
    
    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateRegistration();
        if (Object.keys(validationErrors).length > 0) {
            triggerErrorAnimation(Object.keys(validationErrors));
            return;
        }

        const usersJSON = localStorage.getItem('spaco-delas-users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        const newUserKey = username.toLowerCase();
        
        const updatedUsers = { ...users, [newUserKey]: { name: displayName, password: password }};
        localStorage.setItem('spaco-delas-users', JSON.stringify(updatedUsers));
        
        showToast('Conta criada com sucesso! Faça login para continuar.', 'success');
        toggleMode();
    };
    
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
        if (fieldName === 'username') {
            setSelectedUser(null);
        }
    };
    
    const handleUserSelect = (selectedUsername: string) => {
        setUsername(selectedUsername);
        setSelectedUser(selectedUsername);
        setPassword('');
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.password;
            return newErrors;
        });
        passwordInputRef.current?.focus();
    };

    const getInputClasses = (fieldName: string) => {
        const baseClasses = "w-full h-12 px-4 py-2 bg-[var(--highlight)] border-2 rounded-lg shadow-sm focus:outline-none text-lg text-center transition-all";
        const errorClasses = "border-red-500 ring-2 ring-red-300";
        const normalClasses = "border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]";
        const isAnimated = animatedErrors.includes(fieldName);
        return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses} ${isAnimated ? 'animate-shake' : ''}`;
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 transition-all duration-500 animate-view-in">
            <img src="/logo.png" alt="Spaço Delas Logo" className="h-24 w-24 rounded-full object-cover mb-4 shadow-lg" />
            <h1 className="font-brand text-6xl text-[var(--text-dark)] mb-2">Spaço Delas</h1>
            <p className="text-xl text-[var(--text-body)] mb-6">{isRegistering ? 'Crie sua conta' : 'Acesse sua agenda'}</p>
            
            {/* User Profile Selection */}
            {!isRegistering && userList.length > 0 && (
                <div className="w-full max-w-sm mb-6">
                    <h2 className="text-center font-semibold text-[var(--text-dark)] mb-3">Quem está acessando?</h2>
                    <div className="user-list-scrollbar flex overflow-x-auto space-x-4 p-2 -mx-2">
                        {userList.map(user => (
                             <button
                                key={user.username}
                                type="button"
                                onClick={() => handleUserSelect(user.username)}
                                className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg transition-transform hover:scale-105 focus:outline-none ${
                                    selectedUser === user.username ? 'ring-2 ring-offset-2 ring-[var(--primary)]' : ''
                                }`}
                                aria-label={`Fazer login como ${user.name}`}
                            >
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md"
                                    style={{ backgroundColor: generateAvatarColor(user.username) }}
                                >
                                    {getInitials(user.name)}
                                </div>
                                <p className="text-sm text-center mt-2 text-[var(--text-body)] font-medium truncate w-20">{user.name}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="w-full max-w-sm">
                <div className="space-y-4 transition-all duration-300">
                    
                    {/* Animated Display Name Field */}
                     <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isRegistering ? 'max-h-24' : 'max-h-0'}`}>
                        <div>
                           <label htmlFor="displayname-register" className="sr-only">Nome de Exibição</label>
                           <input id="displayname-register" type="text" value={displayName} onChange={handleInputChange(setDisplayName, 'displayName')} placeholder="Nome de exibição" className={getInputClasses('displayName')} />
                           {errors.displayName && <p className="text-sm text-center text-red-600 font-semibold mt-1">{errors.displayName}</p>}
                        </div>
                    </div>
                    
                    {/* --- Always Visible Fields --- */}
                    <div>
                        <label htmlFor="username-login" className="sr-only">Nome de Usuário</label>
                        <input id="username-login" type="text" value={username} onChange={handleInputChange(setUsername, 'username')} placeholder="Nome de usuário" className={getInputClasses('username')} autoFocus={!selectedUser} />
                        {errors.username && <p className="text-sm text-center text-red-600 font-semibold mt-1">{errors.username}</p>}
                    </div>
                     <div>
                        <label htmlFor="password-login" className="sr-only">Senha</label>
                        <input ref={passwordInputRef} id="password-login" type="password" value={password} onChange={handleInputChange(setPassword, 'password')} placeholder="Senha" className={getInputClasses('password')} />
                        {errors.password && <p className="text-sm text-center text-red-600 font-semibold mt-1">{errors.password}</p>}
                    </div>
                    
                    {/* Animated Confirm Password Field */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isRegistering ? 'max-h-24' : 'max-h-0'}`}>
                       <div>
                          <label htmlFor="confirm-password-register" className="sr-only">Confirmar Senha</label>
                          <input id="confirm-password-register" type="password" value={confirmPassword} onChange={handleInputChange(setConfirmPassword, 'confirmPassword')} placeholder="Confirmar senha" className={getInputClasses('confirmPassword')} />
                          {errors.confirmPassword && <p className="text-sm text-center text-red-600 font-semibold mt-1">{errors.confirmPassword}</p>}
                       </div>
                   </div>

                    <button type="submit" className="w-full py-3 px-4 bg-[var(--primary)] text-white font-bold text-lg rounded-lg shadow-md hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-transform transform hover:scale-105 active:scale-95">
                        {isRegistering ? 'Cadastrar' : 'Entrar'}
                    </button>
                    
                    <div className="text-center mt-4">
                        <button type="button" onClick={toggleMode} className="text-md text-[var(--text-body)] hover:text-[var(--primary)]">
                            {isRegistering ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
                             <span className="font-bold underline">{isRegistering ? 'Faça login' : 'Cadastre-se'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default LoginScreen;