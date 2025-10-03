import React, { useState, useEffect, useRef } from 'react';
import { Professional } from '../types';
import { SERVICES } from '../constants';

interface LoginScreenProps {
    onLogin: (user: Professional) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

// StoredUser now reflects the new Professional type, minus the username key
interface StoredProfessionalData {
    name: string;
    password?: string;
    role?: 'admin' | 'professional';
    assignedServices?: string[];
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

const LoginArt = () => (
    <div className="hidden lg:flex w-1/2 h-screen items-center justify-center bg-[var(--highlight)] p-12 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full opacity-50">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="artGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: 'var(--primary-light)'}} />
                        <stop offset="100%" style={{stopColor: 'var(--primary)'}} />
                    </linearGradient>
                    <filter id="artGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="50" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g filter="url(#artGlow)">
                    <circle cx="100" cy="200" r="250" fill="url(#artGrad)" />
                    <circle cx="700" cy="900" r="300" fill="var(--secondary)" />
                    <ellipse cx="400" cy="600" rx="350" ry="200" fill="var(--accent)" transform="rotate(-30 400 600)" />
                </g>
            </svg>
        </div>
        <div className="relative z-10 text-center text-balance">
            <h2 className="font-brand text-5xl text-[var(--primary)] mb-4">Seu negócio, organizado.</h2>
            <p className="text-xl text-[var(--text-body)] max-w-md mx-auto">
                Todos os seus agendamentos em um só lugar, de forma simples e elegante.
            </p>
        </div>
    </div>
);


const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, showToast }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [animatedErrors, setAnimatedErrors] = useState<string[]>([]);
    
    const [userList, setUserList] = useState<Professional[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [logo, setLogo] = useState('/logo.png');

    // Effect to load the custom logo
    useEffect(() => {
        try {
            const storedLogo = localStorage.getItem('spaco-delas-global-logo');
            if (storedLogo) {
                setLogo(JSON.parse(storedLogo));
            }
        } catch (e) {
            console.error("Failed to load logo from localStorage", e);
        }
    }, []);

    // Effect to set up default admin, migrate old user structures, and load user list
    useEffect(() => {
        try {
            const usersJSON = localStorage.getItem('spaco-delas-users');
            let users: Record<string, StoredProfessionalData> = usersJSON ? JSON.parse(usersJSON) : {};
            let needsUpdate = false;

            // Create default admin if no users exist
            if (Object.keys(users).length === 0) {
                users = {
                    admin: {
                        name: 'Administradora',
                        password: 'admin',
                        role: 'admin',
                        assignedServices: SERVICES.map(s => s.name)
                    }
                };
                showToast('Conta de admin padrão criada (admin/admin).', 'success');
                needsUpdate = true;
            } else {
                // Migrate existing users to new Professional structure
                for (const username in users) {
                    if (!users[username].role || !users[username].assignedServices) {
                        needsUpdate = true;
                        users[username].role = username === 'admin' ? 'admin' : 'professional';
                        // Admins get all services by default on migration, others get none.
                        users[username].assignedServices = username === 'admin' ? SERVICES.map(s => s.name) : [];
                    }
                }
            }

            if (needsUpdate) {
                localStorage.setItem('spaco-delas-users', JSON.stringify(users));
            }
            
            // Load users for profile selection
            const loadedUsers = Object.entries(users).map(([username, data]) => ({
                username: username,
                name: data.name,
                role: data.role!,
                assignedServices: data.assignedServices!
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
        const users: Record<string, StoredProfessionalData> = usersJSON ? JSON.parse(usersJSON) : {};
        const userKey = username.toLowerCase();

        onLogin({
            username: userKey,
            name: users[userKey].name,
            role: users[userKey].role || 'professional', // Fallback for safety
            assignedServices: users[userKey].assignedServices || []
        });
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
        
        const updatedUsers = {
            ...users,
            [newUserKey]: {
                name: displayName,
                password: password,
                role: 'professional',
                assignedServices: []
            }
        };
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
        <div className="min-h-screen bg-[var(--background)] flex flex-col lg:flex-row items-stretch transition-all duration-500 animate-view-in">
             <LoginArt />
            
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 lg:p-8 overflow-y-auto">
                <div className="w-full max-w-sm">

                    <div className="flex flex-col items-center text-center">
                        <div className="h-24 w-24 flex items-center justify-center mb-4">
                            <img src={logo} alt="Logo do Salão" className="w-full h-full object-cover rounded-full shadow-lg border-2 border-white/50" />
                        </div>
                        <h1 className="font-brand text-6xl text-[var(--text-dark)] mb-2">Spaço Delas</h1>
                        <p className="text-xl text-[var(--text-body)] mb-6">{isRegistering ? 'Crie sua conta' : 'Acesse sua agenda'}</p>
                    </div>
                    
                    {/* User Profile Selection */}
                    {!isRegistering && userList.length > 0 && (
                        <div className="w-full mb-6 text-center">
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
                    
                    <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="w-full">
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
            </div>
        </div>
    );
};

export default LoginScreen;
