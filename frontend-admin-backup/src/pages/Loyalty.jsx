import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Loyalty = () => {
  const [levels, setLevels] = useState({});
  const [userSearch, setUserSearch] = useState('');
  const [userLoyalty, setUserLoyalty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');

  // Carregar informações dos níveis ao iniciar
  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const response = await api.getLoyaltyLevels();
      if (response.data.success) {
        setLevels(response.data.levels);
      }
    } catch (error) {
      console.error('Erro ao carregar níveis:', error);
    }
  };

  const searchUser = async () => {
    if (!userSearch.trim()) return;
    
    setLoading(true);
    try {
      // Buscar usuário por ID (você pode adaptar para buscar por email/nome)
      const response = await api.getLoyaltyUser(userSearch);
      if (response.data.success) {
        setUserLoyalty(response.data);
      }
    } catch (error) {
      alert('Usuário não encontrado');
      setUserLoyalty(null);
    }
    setLoading(false);
  };

  const addPoints = async () => {
    if (!userSearch || !pointsToAdd) return;
    
    try {
      const response = await api.addLoyaltyPoints({
        userId: userSearch,
        points: parseInt(pointsToAdd),
        purchaseValue: parseFloat(purchaseValue) || 0
      });
      
      if (response.data.success) {
        alert('Pontos adicionados com sucesso!');
        setUserLoyalty(prev => ({
          ...prev,
          loyalty: response.data.loyalty
        }));
        setPointsToAdd('');
        setPurchaseValue('');
      }
    } catch (error) {
      alert('Erro ao adicionar pontos');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sistema de Fidelidade</h1>
      
      {/* Informações dos Níveis */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Níveis de Fidelidade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(levels).map(([level, info]) => (
            <div key={level} className="border rounded-lg p-4">
              <h3 className="font-bold text-lg">{level}</h3>
              <p className="text-sm text-gray-600">Mínimo: {info.minPoints} pontos</p>
              <p className="text-sm mt-2">{info.benefits}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Buscar Usuário */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Buscar Usuário</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="ID do usuário"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={searchUser}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Informações do Usuário */}
      {userLoyalty && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informações de Fidelidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Dados do Cliente</h3>
              <p><strong>Nome:</strong> {userLoyalty.userName}</p>
              <p><strong>Nível:</strong> {userLoyalty.loyalty.level}</p>
              <p><strong>Pontos:</strong> {userLoyalty.loyalty.points}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Estatísticas</h3>
              <p><strong>Total em Compras:</strong> R$ {userLoyalty.loyalty.totalPurchases.toFixed(2)}</p>
              <p><strong>Quantidade de Pedidos:</strong> {userLoyalty.loyalty.purchaseCount}</p>
              <p><strong>Membro desde:</strong> {new Date(userLoyalty.loyalty.joinDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Adicionar Pontos */}
      {userLoyalty && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Adicionar Pontos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Pontos a adicionar"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor da compra (opcional)"
              value={purchaseValue}
              onChange={(e) => setPurchaseValue(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={addPoints}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Adicionar Pontos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loyalty;
