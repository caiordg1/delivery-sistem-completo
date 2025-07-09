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
    <div className="min-h-screen bg-gray-50">
      {/* 🆕 HEADER COM TOGGLE E BOTÃO NOVO PEDIDO */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Pedidos</h2>
              <p className="text-gray-600 mt-1">
                {orders.length} pedidos encontrados
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 🆕 BOTÃO NOVO PEDIDO */}
              <Button onClick={openNewOrderModal}>
                ➕ Novo Pedido
              </Button>
              
              {/* 🆕 TOGGLE LISTA/KANBAN */}
              <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📋 Lista
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
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
        /* ✅ INTERFACE ORIGINAL PRESERVADA 100% */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {orders.length > 0 ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head>ID</Table.Head>
                      <Table.Head>Total</Table.Head>
                      <Table.Head>Status</Table.Head>
                      <Table.Head>Ações</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {orders.map(order => (
                      <Table.Row key={order._id}>
                        <Table.Cell className="font-mono">
                          {order._id.slice(-8)}
                        </Table.Cell>
                        <Table.Cell className="font-semibold text-green-600">
                          R$ {order.total}
                        </Table.Cell>
                        <Table.Cell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {order.status}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <Button 
                            size="sm" 
                            onClick={() => openModal(order)}
                          >
                            Detalhes
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            ) : (
              <Card className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-500">Nenhum pedido encontrado</p>
              </Card>
            )}

            {/* ✅ MODAL ORIGINAL PRESERVADO 100% */}
            {showModal && selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Detalhes do Pedido
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">ID:</span>
                      <p className="font-mono text-sm">{selectedOrder._id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total:</span>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {selectedOrder.total}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button 
                      variant="secondary"
                      onClick={closeModal}
                    >
                      Fechar
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* 🆕 MODAL NOVO PEDIDO */}
            {showNewOrderModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Criar Novo Pedido
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Dados do Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome *</label>
                        <input
                          type="text"
                          value={newOrder.customerName}
                          onChange={(e) => updateNewOrderField('customerName', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone *</label>
                        <input
                          type="text"
                          value={newOrder.customerPhone}
                          onChange={(e) => updateNewOrderField('customerPhone', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Endereço</label>
                      <input
                        type="text"
                        value={newOrder.customerAddress}
                        onChange={(e) => updateNewOrderField('customerAddress', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Rua, número, bairro, cidade"
                      />
                    </div>

                    {/* Origem e Pagamento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Origem do Pedido</label>
                        <select
                          value={newOrder.source}
                          onChange={(e) => updateNewOrderField('source', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="telefone">📞 Telefone</option>
                          <option value="whatsapp">📱 WhatsApp</option>
                          <option value="instagram">📷 Instagram</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select
                          value={newOrder.paymentMethod}
                          onChange={(e) => updateNewOrderField('paymentMethod', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="dinheiro">💵 Dinheiro</option>
                          <option value="cartao">💳 Cartão</option>
                          <option value="pix">🔘 PIX</option>
                        </select>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Itens do Pedido *</label>
                        <Button size="sm" onClick={addItem}>+ Adicionar Item</Button>
                      </div>
                      
                      {newOrder.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              placeholder="Nome do item"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              min="1"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="col-span-2">
                            {newOrder.items.length > 1 && (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => removeItem(index)}
                                className="w-full"
                              >
                                ❌
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <div className="text-right font-semibold text-lg text-green-600">
                        Total: R$ {newOrder.total.toFixed(2)}
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observações</label>
                      <textarea
                        value={newOrder.observations}
                        onChange={(e) => updateNewOrderField('observations', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        rows="3"
                        placeholder="Observações sobre o pedido..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button 
                      variant="secondary"
                      onClick={closeNewOrderModal}
                      disabled={isCreating}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={createOrder}
                      disabled={isCreating}
                    >
                      {isCreating ? 'Criando...' : 'Criar Pedido'}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
