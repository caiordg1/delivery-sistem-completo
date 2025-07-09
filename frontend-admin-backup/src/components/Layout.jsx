import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-800 text-white">
        <nav className="p-4">
          <h2 className="text-xl font-bold mb-8">Delivery Admin</h2>
          <div className="space-y-2">
            <div className="bg-gray-700 px-4 py-3 rounded cursor-pointer">
              📊 Pedidos
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/orders')}>
              📋 Pedidos
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/products')}>
              🍕 Produtos
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/users')}>
              👥 Clientes
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/coupons')}>
              🎫 Cupons
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/loyalty')}>
              ⭐ Fidelidade
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/logs')}>
              📊 Logs
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/satisfaction')}>
              😊 Satisfação
            </div>
            <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/bot-management')}>
              🤖 Bot WhatsApp
             </div>
             <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/printers')}>
              🖨️ Impressoras
             </div>
             <div className="text-gray-300 px-4 py-3 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => navigate('/reports')}>
              📈 Relatórios
            </div>
          </div>
        </nav>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Painel Administrativo</h1>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Sair
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
