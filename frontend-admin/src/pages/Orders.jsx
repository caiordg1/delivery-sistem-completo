import { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Card, Table } from '../components/ui';
import OrdersKanban from './OrdersKanban';

export default function Orders() {
  // ✅ PRESERVAR TODOS OS ESTADOS ORIGINAIS
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // 🆕 ESTADOS PARA NOVO PEDIDO
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ name: '', quantity: 1, price: 0 }],
    total: 0,
    paymentMethod: 'dinheiro',
    observations: '',
    source: 'telefone'
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // 🆕 NOVO ESTADO PARA TOGGLE
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'kanban'

  // ✅ PRESERVAR FUNÇÃO ORIGINAL
  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await api.get('/api/orders');
        setOrders(response.data);
      } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
      }
    }
    fetchOrders();
  }, []);

  // ✅ PRESERVAR FUNÇÕES ORIGINAIS DO MODAL
  const openModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  // 🆕 FUNÇÕES PARA NOVO PEDIDO
  const openNewOrderModal = () => {
    setNewOrder({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      items: [{ name: '', quantity: 1, price: 0 }],
      total: 0,
      paymentMethod: 'dinheiro',
      observations: '',
      source: 'telefone'
    });
    setShowNewOrderModal(true);
  };

  const closeNewOrderModal = () => {
    setShowNewOrderModal(false);
  };

  const updateNewOrderField = (field, value) => {
    setNewOrder(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index][field] = value;
    setNewOrder(prev => ({ ...prev, items: updatedItems }));
    calculateTotal(updatedItems);
  };

  const addItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder(prev => ({ ...prev, items: updatedItems }));
    calculateTotal(updatedItems);
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    setNewOrder(prev => ({ ...prev, total }));
  };

  const createOrder = async () => {
    if (!newOrder.customerName || !newOrder.customerPhone || newOrder.items.length === 0) {
      alert('Preencha pelo menos nome, telefone e um item');
      return;
    }

    setIsCreating(true);
    try {
      await api.post('/api/orders', newOrder);
      
      // Atualizar lista de pedidos
      const response = await api.get('/api/orders');
      setOrders(response.data);
      
      // Fechar modal
      closeNewOrderModal();
      
      alert('Pedido criado com sucesso!');
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      alert('Erro ao criar pedido. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  // 🆕 FUNÇÃO PARA ATUALIZAR DADOS (para integração com Kanban)
  const refreshOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Erro ao atualizar pedidos:', err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* 🖤 HEADER COM TEXTOS PRETOS */}
      <div className="bg-gradient-to-r from-blue-800/30 to-blue-700/20 backdrop-blur-xl border-b border-blue-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-display">
                📋 Gestão de Pedidos
              </h2>
              <p className="text-gray-700 mt-2 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                {orders.length} pedidos encontrados
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 🎨 BOTÃO NOVO PEDIDO */}
              <button
                onClick={openNewOrderModal}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-gray-900 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-200 transform hover:scale-105"
              >
                ✨ Novo Pedido
              </button>
              
              {/* 🎨 TOGGLE */}
              <div className="flex rounded-xl border border-blue-500/30 p-1 bg-blue-900/20 backdrop-blur-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-blue-500/20'
                  }`}
                >
                  📋 Lista
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-blue-500/20'
                  }`}
                >
                  📊 Kanban
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO BASEADO NO MODO */}
      {viewMode === 'kanban' ? (
        /* 🆕 NOVA INTERFACE KANBAN */
        <OrdersKanban onUpdate={refreshOrders} />
      ) : (
        /* 🖤 INTERFACE COM TEXTOS PRETOS */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {orders.length > 0 ? (
              <div className="bg-white/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* 🖤 TABELA COM TEXTOS PRETOS */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-800/50 to-blue-700/30 border-b border-blue-500/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID do Pedido</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valor Total</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-500/10">
                      {orders.map((order, index) => (
                        <tr key={order._id} className="hover:bg-blue-500/5 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <span className="font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-300">
                              {order._id.slice(-8)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-lg text-green-400">
                              R$ {order.total}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-900 border border-gray-300">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openModal(order)}
                              className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-600 hover:to-blue-700 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            >
                              👁️ Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl p-12 text-center">
                <div className="text-blue-600 text-6xl mb-6">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-700">Aguardando novos pedidos</p>
              </div>
            )}

            {/* 🖤 MODAL DETALHES COM TEXTOS PRETOS */}
            {showModal && selectedOrder && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      📋
                    </span>
                    Detalhes do Pedido
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                      <span className="text-sm text-gray-700">ID do Pedido:</span>
                      <p className="font-mono text-gray-900 text-lg">{selectedOrder._id}</p>
                    </div>
                    <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                      <span className="text-sm text-gray-700">Valor Total:</span>
                      <p className="text-2xl font-bold text-green-400">
                        R$ {selectedOrder.total}
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                      <span className="text-sm text-gray-700">Status Atual:</span>
                      <div className="mt-2">
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-200 text-gray-900 border border-gray-400">
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={closeModal}
                      className="bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      ✖️ Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 🖤 MODAL NOVO PEDIDO COM TEXTOS PRETOS */}
            {showNewOrderModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white/15 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        ✨
                      </span>
                      Criar Novo Pedido
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Dados do Cliente */}
                      <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                        <h4 className="text-gray-900 font-semibold mb-4">👤 Dados do Cliente</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                            <input
                              type="text"
                              value={newOrder.customerName}
                              onChange={(e) => updateNewOrderField('customerName', e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                              placeholder="Nome do cliente"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                            <input
                              type="text"
                              value={newOrder.customerPhone}
                              onChange={(e) => updateNewOrderField('customerPhone', e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                          <input
                            type="text"
                            value={newOrder.customerAddress}
                            onChange={(e) => updateNewOrderField('customerAddress', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                            placeholder="Rua, número, bairro, cidade"
                          />
                        </div>
                      </div>

                      {/* Origem e Pagamento */}
                      <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                        <h4 className="text-gray-900 font-semibold mb-4">💳 Informações do Pedido</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Origem do Pedido</label>
                            <select
                              value={newOrder.source}
                              onChange={(e) => updateNewOrderField('source', e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                            >
                              <option value="telefone">📞 Telefone</option>
                              <option value="whatsapp">📱 WhatsApp</option>
                              <option value="instagram">📷 Instagram</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                            <select
                              value={newOrder.paymentMethod}
                              onChange={(e) => updateNewOrderField('paymentMethod', e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                            >
                              <option value="dinheiro">💵 Dinheiro</option>
                              <option value="cartao">💳 Cartão</option>
                              <option value="pix">🔘 PIX</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Itens do Pedido */}
                      <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-gray-900 font-semibold">🍕 Itens do Pedido *</h4>
                          <button
                            onClick={addItem}
                            className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-600 hover:to-blue-700 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-md transition-all duration-200 transform hover:scale-105"
                          >
                            + Adicionar Item
                          </button>
                        </div>
                        
                        {newOrder.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 mb-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm focus:border-blue-600 transition-all"
                                placeholder="Nome do item"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-blue-600 transition-all"
                                min="1"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-blue-600 transition-all"
                                step="0.01"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="col-span-2">
                              {newOrder.items.length > 1 && (
                                <button 
                                  onClick={() => removeItem(index)}
                                  className="w-full bg-red-600/60 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                >
                                  ❌
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-300">
                          <div className="text-right font-bold text-xl text-green-600">
                            💰 Total: R$ {newOrder.total.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Observações */}
                      <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                        <label className="block text-sm font-medium text-gray-700 mb-2">📝 Observações</label>
                        <textarea
                          value={newOrder.observations}
                          onChange={(e) => updateNewOrderField('observations', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                          rows="3"
                          placeholder="Observações sobre o pedido..."
                        ></textarea>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                      <button
                        onClick={closeNewOrderModal}
                        disabled={isCreating}
                        className="bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      >
                        ❌ Cancelar
                      </button>
                      <button
                        onClick={createOrder}
                        disabled={isCreating}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-gray-900 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      >
                        {isCreating ? '⏳ Criando...' : '✨ Criar Pedido'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
