import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Se já está logado, redireciona para orders
  if (isAuthenticated) {
    return <Navigate to="/orders" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/api/auth/login', { email, password });
      login(response.data.token);
    } catch (err) {
      setError('Email ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* SAPORE Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="text-center">
          <div className="w-64 h-64 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-8 shadow-2xl">
            <span className="text-red-900 text-8xl">🍕</span>
          </div>
          <h1 className="text-9xl font-black text-yellow-400 tracking-wider">SAPORE</h1>
          <p className="text-4xl text-yellow-300 font-light tracking-widest mt-4">O sabor italiano</p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/20 backdrop-blur-xl border border-yellow-500/30 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-105">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-red-900 text-3xl">🍕</span>
            </div>
            <h1 className="text-4xl font-bold text-yellow-300 mb-2">SAPORE</h1>
            <p className="text-yellow-200 text-lg">Painel Administrativo</p>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto mt-4"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="relative group">
              <label className="block text-yellow-200 text-sm font-semibold mb-2">
                📧 Email de Acesso
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/10 border-2 border-yellow-500/30 rounded-xl px-4 py-4 text-yellow-100 placeholder-yellow-300/50 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all duration-300 backdrop-blur-sm"
                placeholder="seuemail@exemplo.com"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-yellow-600/0 group-hover:from-yellow-400/5 group-hover:to-yellow-600/5 rounded-xl transition-all duration-300 pointer-events-none"></div>
            </div>

            {/* Password Field */}
            <div className="relative group">
              <label className="block text-yellow-200 text-sm font-semibold mb-2">
                🔐 Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/10 border-2 border-yellow-500/30 rounded-xl px-4 py-4 text-yellow-100 placeholder-yellow-300/50 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all duration-300 backdrop-blur-sm"
                placeholder="••••••••"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-yellow-600/0 group-hover:from-yellow-400/5 group-hover:to-yellow-600/5 rounded-xl transition-all duration-300 pointer-events-none"></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-300 text-sm font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-red-900 font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-red-900/30 border-t-red-900 rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>Acessar Sistema</span>
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="bg-red-900/30 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-yellow-200 text-sm">
                🔒 Acesso seguro e criptografado
              </p>
              <p className="text-yellow-300/70 text-xs mt-1">
                Sistema de delivery premium
              </p>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/20 rounded-full animate-bounce"></div>
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-yellow-500/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 -right-8 w-4 h-4 bg-yellow-300/20 rounded-full animate-pulse"></div>
      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/10 backdrop-blur-sm border border-yellow-500/20 rounded-full px-6 py-2">
          <p className="text-yellow-200 text-sm font-medium">
            Powered by <span className="text-yellow-400 font-bold">SAPORE Tech</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
