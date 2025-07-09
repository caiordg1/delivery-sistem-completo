import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, ShoppingCart, Gift, 
  Star, Bot, Printer, FileText, LogOut, Menu, X,
  TrendingUp, MessageCircle, Settings, Bell
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/orders', icon: ShoppingCart, label: 'Pedidos', color: 'text-yellow-400' },
    { path: '/products', icon: Package, label: 'Produtos', color: 'text-amber-400' },
    { path: '/users', icon: Users, label: 'Clientes', color: 'text-yellow-300' },
    { path: '/coupons', icon: Gift, label: 'Cupons', color: 'text-orange-400' },
    { path: '/loyalty', icon: Star, label: 'Fidelidade', color: 'text-yellow-400' },
    { path: '/logs', icon: FileText, label: 'Logs', color: 'text-gray-300' },
    { path: '/satisfaction', icon: MessageCircle, label: 'Satisfação', color: 'text-pink-300' },
    { path: '/bot-management', icon: Bot, label: 'Bot WhatsApp', color: 'text-green-400' },
    { path: '/printers', icon: Printer, label: 'Impressoras', color: 'text-blue-300' },
    { path: '/reports', icon: TrendingUp, label: 'Relatórios', color: 'text-emerald-400' },
  ];

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Burgundy Background - SAPORE Style */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/30 via-transparent to-gray-200/20"></div>
        
        {/* Animated premium patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-10 left-40 w-64 h-64 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Glassmorphism Sidebar - SAPORE Premium */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full bg-red-900/40 backdrop-blur-xl border-r border-yellow-500/20 shadow-2xl">
            
            {/* Logo Area - SAPORE Style */}
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                  <LayoutDashboard className="w-7 h-7 text-red-900" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400 font-display">SAPORE</h2>
                  <p className="text-xs text-yellow-200">Admin Panel</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg text-yellow-200 hover:text-yellow-400 hover:bg-red-800/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation - Premium Style */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-yellow-500/20 border border-yellow-500/40 shadow-lg shadow-yellow-500/10 backdrop-blur-sm' 
                        : 'hover:bg-yellow-500/10 hover:border-yellow-500/30 border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-yellow-500/30' : 'bg-red-800/30'} transition-all group-hover:scale-110 shadow-md`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-300' : item.color} transition-colors`} />
                    </div>
                    <span className={`font-medium ${isActive ? 'text-yellow-200' : 'text-red-100'} transition-colors`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full ml-auto animate-pulse shadow-md shadow-yellow-400/50"></div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Area - Premium Style */}
            <div className="p-4 border-t border-yellow-500/20">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-red-800/30 backdrop-blur-sm mb-3 border border-yellow-500/20">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-red-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-yellow-200 truncate">Administrador</p>
                  <p className="text-xs text-yellow-300">SAPORE Panel</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-md shadow-green-400/50"></div>
              </div>
              
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 text-red-200 hover:text-white transition-all duration-200 group shadow-md"
              >
                <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">Sair do Sistema</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          {/* Header - Premium Glass */}
          <header className="bg-red-900/20 backdrop-blur-xl border-b border-yellow-500/20 px-6 py-4 sticky top-0 z-30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-yellow-200 hover:text-yellow-400 hover:bg-red-800/30 transition-all"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-yellow-300 font-display">
                    Painel Administrativo
                  </h1>
                  <p className="text-sm text-yellow-200">
                    SAPORE - Gestão Premium do seu delivery
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button className="relative p-2 rounded-lg text-yellow-200 hover:text-yellow-400 hover:bg-red-800/30 transition-all">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-md shadow-red-500/50"></div>
                </button>
                
                <button className="p-2 rounded-lg text-yellow-200 hover:text-yellow-400 hover:bg-red-800/30 transition-all">
                  <Settings className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-red-900 text-sm font-bold">A</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area - Premium Cards */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-yellow-500/20 shadow-2xl shadow-red-900/20 p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
