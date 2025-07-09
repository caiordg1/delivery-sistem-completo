import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  X, Edit, MessageSquare, Clock, User, MapPin, 
  CreditCard, Package, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { updateOrderStatus, getOrderHistory, getOrderObservations } from '../../../services/api';
import OrderTimeline from './OrderTimeline';
import OrderChat from './OrderChat';
import toast from 'react-hot-toast';

const OrderDetailModal = ({ order, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState(order);
  const [timeline, setTimeline] = useState([]);
  const [observations, setObservations] = useState([]);

  useEffect(() => {
    if (isOpen && order) {
      setOrderData(order);
      loadOrderDetails();
    }
  }, [isOpen, order]);

  const loadOrderDetails = async () => {
    if (!order?._id) return;

    try {
      setIsLoading(true);
      
      const [timelineRes, observationsRes] = await Promise.all([
        getOrderHistory(order._id).catch(() => ({ data: [] })),
        getOrderObservations(order._id).catch(() => ({ data: [] }))
      ]);
      
      setTimeline(timelineRes.data || []);
      setObservations(observationsRes.data || []);
      
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!orderData?._id || orderData.status === newStatus) return;

    try {
      setIsLoading(true);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = user.name || user.username || user.email || 'Admin';

      await updateOrderStatus(orderData._id, {
        status: newStatus,
        user: userName,
        observation: `Status alterado para ${newStatus.replace('_', ' ')} via modal`
      });
      
      setOrderData(prev => ({ ...prev, status: newStatus }));
      
      await loadOrderDetails();
      
      if (onUpdate) onUpdate();
      
      toast.success(`Status alterado para: ${newStatus.replace('_', ' ')}`);
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Detalhes', icon: Package },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'chat', label: 'Observações', icon: MessageSquare }
  ];

  const statusOptions = [
    { value: 'pendente', label: '⏳ Pendente', color: 'gray' },
    { value: 'recebido', label: '📥 Recebido', color: 'blue' },
    { value: 'em_preparo', label: '👨‍🍳 Em Preparo', color: 'yellow' },
    { value: 'aguardando_entregador', label: '📦 Aguardando Entregador', color: 'purple' },
    { value: 'saiu_para_entrega', label: '🚚 Saiu para Entrega', color: 'orange' },
    { value: 'entregue', label: '✅ Entregue', color: 'green' },
    { value: 'cancelado', label: '❌ Cancelado', color: 'red' }
  ];

  const getValidTransitions = (currentStatus) => {
    const transitions = {
      pendente: ['recebido', 'cancelado'],
      recebido: ['em_preparo', 'cancelado'],
      em_preparo: ['aguardando_entregador', 'cancelado'],
      aguardando_entregador: ['saiu_para_entrega', 'cancelado'],
      saiu_para_entrega: ['entregue', 'cancelado'],
      entregue: [],
      cancelado: []
    };
    return transitions[currentStatus] || [];
  };

  const validTransitions = getValidTransitions(orderData?.status);

  if (!orderData) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
          
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex-1">
              <Dialog.Title className="text-xl font-semibold text-gray-800">
                Pedido #{orderData.orderNumber || orderData._id?.slice(-6)}
              </Dialog.Title>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span>👤 {orderData.customerName || 'Cliente não informado'}</span>
                <span>📅 {new Date(orderData.createdAt).toLocaleString('pt-BR')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  orderData.priority === 'urgente' ? 'bg-red-100 text-red-700' :
                  orderData.priority === 'alta' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {orderData.priority || 'normal'}
                </span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status do Pedido
            </label>
            <div className="flex items-center space-x-4">
              <select
                value={orderData.status || 'pendente'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isLoading || validTransitions.length === 0}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                {statusOptions.map((option) => {
                  const isValid = option.value === orderData.status || validTransitions.includes(option.value);
                  return (
                    <option 
                      key={option.value} 
                      value={option.value}
                      disabled={!isValid}
                    >
                      {option.label} {!isValid && option.value !== orderData.status ? '(Inválido)' : ''}
                    </option>
                  );
                })}
              </select>
              
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </div>
            
            {validTransitions.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {orderData.status === 'entregue' ? '✅ Pedido finalizado' : 
                 orderData.status === 'cancelado' ? '❌ Pedido cancelado' : 
                 'Nenhuma transição disponível'}
              </p>
            )}
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            {activeTab === 'details' && (
              <OrderDetailsView order={orderData} />
            )}
            
            {activeTab === 'timeline' && (
              <OrderTimeline 
                timeline={timeline} 
                isLoading={isLoading}
                onRefresh={loadOrderDetails}
              />
            )}
            
            {activeTab === 'chat' && (
              <OrderChat
                orderId={orderData._id}
                observations={observations}
                onNewObservation={loadOrderDetails}
                isLoading={isLoading}
              />
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              💰 Total: <span className="font-semibold text-green-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderData.total || 0)}
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const OrderDetailsView = ({ order }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Informações do Cliente
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div>
            <span className="font-medium">Nome:</span> {order.customerName || 'Não informado'}
          </div>
          {order.customerPhone && (
            <div>
              <span className="font-medium">Telefone:</span> {order.customerPhone}
            </div>
          )}
          {order.customerEmail && (
            <div>
              <span className="font-medium">Email:</span> {order.customerEmail}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Entrega
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          {order.customerAddress ? (
            <div>
              <span className="font-medium">Endereço:</span> {order.customerAddress}
            </div>
          ) : (
            <div className="text-gray-500 italic">Endereço não informado</div>
          )}
          {order.estimatedTime && (
            <div>
              <span className="font-medium">Tempo estimado:</span> {order.estimatedTime} minutos
            </div>
          )}
          {order.deliveredAt && (
            <div>
              <span className="font-medium">Entregue em:</span> {new Date(order.deliveredAt).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
        <Package className="w-5 h-5 mr-2" />
        Itens do Pedido
      </h3>
      <div className="bg-gray-50 rounded-lg p-4">
        {order.items && order.items.length > 0 ? (
          <>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium">
                    {item.quantity}x {item.name}
                  </div>
                  {item.observation && (
                    <p className="text-sm text-gray-600 italic mt-1">
                      Obs: {item.observation}
                    </p>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    Preço unitário: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)}
                  </div>
                </div>
                <div className="font-semibold text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.price || 0) * (item.quantity || 0))}
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-300">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total || 0)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic">Nenhum item encontrado</div>
        )}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
        <CreditCard className="w-5 h-5 mr-2" />
        Pagamento
      </h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <div>
          <span className="font-medium">Método:</span> {order.paymentMethod || 'Não informado'}
        </div>
        {order.paymentStatus && (
          <div className="mt-2">
            <span className="font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              order.paymentStatus === 'approved' ? 'bg-green-100 text-green-700' :
              order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        )}
      </div>
    </div>

    {order.timeMetrics && Object.keys(order.timeMetrics).length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
          <Clock className="w-5 h-5 mr-2" />
          Métricas de Tempo
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {order.timeMetrics.preparationTime && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{order.timeMetrics.preparationTime}min</div>
              <div className="text-sm text-gray-600">Tempo de Preparo</div>
            </div>
          )}
          {order.timeMetrics.deliveryTime && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{order.timeMetrics.deliveryTime}min</div>
              <div className="text-sm text-gray-600">Tempo de Entrega</div>
            </div>
          )}
          {order.timeMetrics.totalTime && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{order.timeMetrics.totalTime}min</div>
              <div className="text-sm text-gray-600">Tempo Total</div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

export default OrderDetailModal;
