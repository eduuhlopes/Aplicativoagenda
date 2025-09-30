import React, { useState } from 'react';
import { User } from '../types';

const logoBase64 = "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6y//p3D8/8V9++d/+4V9/ePjP+vubnvoZAAAYDEEIAGf+X/+L86l66v4v/+q//5f/zU/+2e//+y//0v0/WvU5/+b3+7s/AwCAwQBhCdhY9Uf/c/z8e//zS/7p3B+/+Icv/d3/1B+v/nC0/tX+9s/A64kPAAAQBhBWgO+9+dM//Vl5/4v//d//27/+9H/+1z/4w3/6r+u///+g/+B//27//nb/mX/yB/q/f6b+90+0/99f+b//3//qP57843/7J2r/94/Uf/0b/+P/+B80/+P/9B82/+U/+Q8a/+H//wGk/b/7X37rL/5tUAAASAcIS8AGzP//f0aD/T//51/+x/8//83/+b//oP//f//v//2/+z//Vf+/P/0v/+9//8//9e//8z/953/6l/78X/zZP//f/+z/+q//6X/+D/35X/z5//w//49/88/9+f+zH/vzv/m/jP79v/2PP//nv/zn/6g/n+r/8H/8gP6//0f/p/87n/T/+W/+/X/4TzL//f/69/qf/x//+j+f/9/9H/3z/2f/h/8w8j//b//f/+P/+v/v//P/9j/u/9X/+y/+9f/3P/m///N/8t/5z//v/0f/5f+T//y/++9/9j/+7/+U/1+/n/f/+X/+//1f/wEAANAAhCUAAKAI/N//3f/+j/8//2P//v/7//J/+S/v/+X/4n/+//yX/8t/959/8x/+5X/23/43//H/8X/4P//D/6M/+e//0//4H/8H/8l/+r//x/9z/yP+z/+5/yF//3/3P/2Pf/+f/o//w//5f/w/+0//3//p//U/+z/+n/9X/7M/+T//P/+3/+z/9L/5d/+P/tn/5f+1f/r/4T//7/93/z//j//b//Q//j//Z//TP/5P/+2/+m//x//j//Z/+r/9T//f/+t/+r//2P+Q/+c//2P+//+3/8P/+R/2P/+P/sn/9L/+t/+o//U/+X/2n/7//pP/6v/zP/+P/+v/t//X/+T/3H/0//y//8P/4n/4v//D/+V/8t/91/97/+k/+sP/s//h/8z/3H/qP//P/4f/4v/pv/3f/U//8d/8W/+mP/+Hf+TP/5//T/+H//Z//F//v//H/+3/un/93//H//3/6P/zv//H//3/6t//7//j//H//F//X/3P/+X/1//T//j//H//N//D/+D/wAAAED6QlgiAQAAAACQAwAAAADpBYQlAAAAAEAOAAAAAOkFhCUAAAAAQI4AAAAB+N+7rEwAAAAAElFTSuQmCC";

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
        c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
        c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
        C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
        c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574
        l6.19,5.238C41.38,36.405,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setStatus({ type: 'error', message: 'Por favor, preencha o usuário e a senha.' });
            return;
        }
        setStatus(null);
        setIsLoading(true);

        const url = isRegister 
            ? '/api/register' 
            : '/api/login';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Ocorreu um erro. Status: ${response.status}`);
            }

            if (isRegister) {
                setStatus({ type: 'success', message: 'Cadastro realizado com sucesso! Faça o login para continuar.' });
                setIsRegister(false);
                setUsername('');
                setPassword('');
            } else {
                // Login was successful
                localStorage.setItem('userToken', data.token);
                onLogin(data.user);
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setStatus(null);
        try {
            // --- SIMULAÇÃO DA AUTENTICAÇÃO GOOGLE ---
            // Em uma aplicação real, aqui você usaria a biblioteca Google Identity Services (gsi)
            // para obter um token de identidade do usuário.
            // Ex: const credential = await google.accounts.id.getRedirectResult();
            // Por agora, vamos simular um token para enviar ao backend.
            const fakeGoogleToken = 'simulated-google-id-token.' + btoa(JSON.stringify({
                email: 'usuario.google@example.com',
                name: 'Usuário Google'
            }));

            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: fakeGoogleToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha na autenticação com o Google.');
            }

            // Backend retornou nosso próprio JWT
            localStorage.setItem('userToken', data.token);
            onLogin(data.user);

        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src={logoBase64} alt="Spaço Delas Logo" className="h-28 md:h-32 object-contain mx-auto" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-purple-800 tracking-tight mt-4">
                        Spaço Delas
                    </h1>
                     <p className="text-lg md:text-xl text-pink-700 mt-1">
                        Acesso ao Sistema
                    </p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-pink-100">
                     <h2 className="text-2xl font-bold text-purple-800 text-center mb-6">
                        {isRegister ? 'Criar Nova Conta' : 'Acessar Sistema'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-md font-medium text-purple-800 mb-1">
                                Usuário:
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Digite seu nome de usuário"
                                className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-md font-medium text-purple-800 mb-1">
                                Senha:
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha"
                                className="w-full h-11 px-3 py-2 bg-pink-100 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
                                disabled={isLoading}
                            />
                        </div>
                        {status && (
                            <p className={`text-sm text-center font-medium ${status.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                {status.message}
                            </p>
                        )}
                        <div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-pink-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-transform transform hover:scale-105 disabled:bg-pink-300 disabled:cursor-not-allowed">
                                {isLoading ? 'Processando...' : (isRegister ? 'Cadastrar' : 'Entrar')}
                            </button>
                        </div>
                    </form>
                    
                     <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-pink-200"></div>
                        <span className="flex-shrink mx-4 text-sm text-pink-700">ou</span>
                        <div className="flex-grow border-t border-pink-200"></div>
                    </div>

                     <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3 px-4 bg-white text-gray-700 font-bold text-lg rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                        <GoogleIcon />
                        {isLoading ? 'Aguarde...' : 'Entrar com o Google'}
                    </button>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => { setIsRegister(!isRegister); setStatus(null); }} 
                            className="text-sm text-pink-600 hover:text-pink-800 hover:underline focus:outline-none"
                            disabled={isLoading}
                        >
                            {isRegister ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Cadastre-se'}
                        </button>
                    </div>
                </div>
                 <p className="text-center text-sm text-pink-600 mt-6">
                    Este sistema agora se comunica com um servidor seguro. Certifique-se que o backend está rodando.
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;