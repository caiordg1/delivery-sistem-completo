import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Button, Card, Table, Modal, Alert, Loading } from '../components/ui';

export default function Clientes() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false); // 🆕 Estado para loading dos pedidos
  const [orderStats, setOrderStats] = useState({}); // 🆕 Estado para estatísticas dos pedidos
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loyaltyData, setLoyaltyData] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefone: '',
    endereco: '',
    dataNascimento: '',
    password: 'temp123'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      setUsers(response.data || []);
      
      const loyaltyPromises = (response.data || []).map(async (user) => {
        try {
          const loyaltyResponse = await api.getLoyaltyUser(user._id);
          return { userId: user._id, loyalty: loyaltyResponse.data };
        } catch (err) {
          return { userId: user._id, loyalty: null };
        }
      });
      
      const loyaltyResults = await Promise.all(loyaltyPromises);
      const loyaltyMap = {};
      loyaltyResults.forEach(result => {
        loyaltyMap[result.userId] = result.loyalty;
      });
      setLoyaltyData(loyaltyMap);
      
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NOVA FUNÇÃO - Buscar pedidos por telefone (vinculação automática)
  const fetchUserOrdersByPhone = async (phone) => {
    if (!phone) {
      console.log('Telefone não informado para buscar pedidos');
      setUserOrders([]);
      setOrderStats({});
      return;
    }

    try {
      setLoadingOrders(true);
      console.log(`🔍 Buscando pedidos para telefone: ${phone}`);
      
      const response = await api.getOrdersByPhone(phone);
      
      if (response.data) {
        const { orders, statistics } = response.data;
        setUserOrders(orders || []);
        setOrderStats(statistics || {});
        
        console.log(`✅ Encontrados ${orders?.length || 0} pedidos para ${phone}`);
        console.log('📊 Estatísticas:', statistics);
      } else {
        setUserOrders([]);
        setOrderStats({});
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos por telefone:', err);
      setUserOrders([]);
      setOrderStats({});
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(formData);
      fetchUsers();
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        telefone: '',
        endereco: '',
        dataNascimento: '',
        password: 'temp123'
      });
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(selectedUser._id, formData);
      fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        telefone: '',
        endereco: '',
        dataNascimento: '',
        password: 'temp123'
      });
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      name: '',
      email: '',
      telefone: '',
      endereco: '',
      dataNascimento: '',
      password: 'temp123'
    });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      telefone: user.telefone || '',
      endereco: user.endereco || '',
      dataNascimento: user.dataNascimento ? user.dataNascimento.split('T')[0] : '',
      password: ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      telefone: '',
      endereco: '',
      dataNascimento: '',
      password: 'temp123'
    });
  };

  // 🔄 FUNÇÃO MODIFICADA - Agora busca por telefone em vez de ID
  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    
    // 🆕 BUSCAR PEDIDOS POR TELEFONE (vinculação automática)
    if (user.telefone) {
      await fetchUserOrdersByPhone(user.telefone);
    } else {
      console.log('Cliente sem telefone cadastrado');
      setUserOrders([]);
      setOrderStats({});
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await api.deleteUser(id);
        fetchUsers();
      } catch (err) {
        console.error('Erro ao excluir usuário:', err);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserOrders([]);
    setOrderStats({});
  };

  // 🆕 FUNÇÃO AUXILIAR - Formatar status em português
  const formatStatus = (status) => {
    const statusMap = {
      'pendente': 'Pendente',
      'recebido': 'Recebido',
      'em_preparo': 'Em Preparo',
      'aguardando_entregador': 'Aguardando Entregador',
      'saiu_para_entrega': 'Saiu para Entrega',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  // 🆕 FUNÇÃO AUXILIAR - Cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'entregue': return 'bg-green-100 text-green-800';
      case 'saiu_para_entrega': return 'bg-blue-100 text-blue-800';
      case 'em_preparo': return 'bg-yellow-100 text-yellow-800';
      case 'aguardando_entregador': return 'bg-orange-100 text-orange-800';
      case 'recebido': return 'bg-purple-100 text-purple-800';
      case 'pendente': return 'bg-gray-100 text-gray-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLoyaltyLevel = (userId) => {
    const loyalty = loyaltyData[userId];
    if (!loyalty) return 'Bronze';
    
    if (loyalty.points >= 1000) return 'Platinum';
    if (loyalty.points >= 500) return 'Gold';
    if (loyalty.points >= 200) return 'Silver';
    return 'Bronze';
  };

  const getLoyaltyColor = (level) => {
    switch (level) {
      case 'Platinum': return 'bg-purple-100 text-purple-800';
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.telefone?.includes(searchTerm);
    
    if (filter === 'all') return matchesSearch;
    
    const userLevel = getLoyaltyLevel(user._id);
    return matchesSearch && userLevel.toLowerCase() === filter.toLowerCase();
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Clientes</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          + Novo Cliente
        </button>
      </div>

      {/* Filtros e Busca */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Cliente
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome, email ou telefone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Nível
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Níveis</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              {filteredUsers.length} cliente(s) encontrado(s)
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fidelidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const loyaltyLevel = getLoyaltyLevel(user._id);
                  const loyalty = loyaltyData[user._id];
                  
                  return (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.telefone || 'Sem telefone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLoyaltyColor(loyaltyLevel)}`}>
                          {loyaltyLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loyalty?.points || 0} pontos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-4xl mb-4">👥</div>
            <div className="text-gray-500">Nenhum cliente encontrado</div>
          </div>
        )}
      </Card>

      {/* Modal de Detalhes - 🆕 COM HISTÓRICO REAL */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhes do Cliente
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Informações do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informações Pessoais</h4>
                <div className="space-y-2">
                  <div><strong>Nome:</strong> {selectedUser.name}</div>
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Telefone:</strong> {selectedUser.telefone || 'Não informado'}</div>
                  <div><strong>Endereço:</strong> {selectedUser.endereco || 'Não informado'}</div>
                  <div><strong>Data de Aniversário:</strong> {selectedUser.dataNascimento ? new Date(selectedUser.dataNascimento).toLocaleDateString() : 'Não informado'}</div>
                  <div><strong>Data de Cadastro:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Programa de Fidelidade</h4>
                <div className="space-y-2">
                  <div>
                    <strong>Nível:</strong>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLoyaltyColor(getLoyaltyLevel(selectedUser._id))}`}>
                      {getLoyaltyLevel(selectedUser._id)}
                    </span>
                  </div>
                  <div><strong>Pontos:</strong> {loyaltyData[selectedUser._id]?.points || 0}</div>
                  {/* 🆕 MOSTRAR DADOS REAIS DOS PEDIDOS */}
                  <div><strong>Total Gasto:</strong> R$ {orderStats.totalSpent ? orderStats.totalSpent.toFixed(2) : '0,00'}</div>
                  <div><strong>Total de Pedidos:</strong> {orderStats.totalOrders || 0}</div>
                  {orderStats.lastOrderDate && (
                    <div><strong>Último Pedido:</strong> {new Date(orderStats.lastOrderDate).toLocaleDateString()}</div>
                  )}
                </div>
              </Card>
            </div>

            {/* 🆕 HISTÓRICO DE PEDIDOS REAL - IMPLEMENTAÇÃO COMPLETA */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">Histórico de Pedidos</h4>
                {selectedUser.telefone ? (
                  <div className="text-sm text-gray-500">
                    Vinculação automática por telefone: {selectedUser.telefone}
                  </div>
                ) : (
                  <div className="text-sm text-red-500">
                    ⚠️ Cliente sem telefone - histórico limitado
                  </div>
                )}
              </div>

              {loadingOrders ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="mt-2 text-gray-600">Carregando histórico...</div>
                </div>
              ) : userOrders.length > 0 ? (
                <div>
                  {/* 🆕 ESTATÍSTICAS RESUMIDAS */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{orderStats.totalOrders || 0}</div>
                      <div className="text-sm text-gray-600">Total de Pedidos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {orderStats.totalSpent ? orderStats.totalSpent.toFixed(2) : '0,00'}
                      </div>
                      <div className="text-sm text-gray-600">Valor Total Gasto</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        R$ {orderStats.averageOrderValue ? orderStats.averageOrderValue.toFixed(2) : '0,00'}
                      </div>
                      <div className="text-sm text-gray-600">Ticket Médio</div>
                    </div>
                  </div>

                  {/* 🆕 LISTA DETALHADA DE PEDIDOS */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Data & Hora
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Itens
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Origem
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              R$ {Number(order.total).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {formatStatus(order.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {order.items && order.items.length > 0 ? (
                                <div className="max-w-xs">
                                  {order.items.slice(0, 2).map((item, index) => (
                                    <div key={index} className="text-xs text-gray-600">
                                      {item.quantity}x {item.name}
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <div className="text-xs text-gray-400">
                                      +{order.items.length - 2} item(s)
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">Sem itens</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              <span className="capitalize">
                                {order.source || 'manual'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📦</div>
                  <div className="text-gray-500 mb-2">
                    {selectedUser.telefone 
                      ? 'Nenhum pedido encontrado para este telefone'
                      : 'Cliente sem telefone cadastrado'
                    }
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedUser.telefone 
                      ? 'Os pedidos são vinculados automaticamente pelo telefone'
                      : 'Adicione um telefone para ver o histórico de pedidos'
                    }
                  </div>
                </div>
              )}
            </Card>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Novo Cliente
              </h3>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Criar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Cliente
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
