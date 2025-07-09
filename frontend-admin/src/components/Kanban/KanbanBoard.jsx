import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

const KanbanBoard = () => {
  const [orders, setOrders] = useState({
    recebido: [],
    em_preparo: [],
    aguardando_entregador: [],
    saiu_para_entrega: [],
    entregue: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const navigate = useNavigate();
  const irParaDetalhes = (pedidoId) => {
    navigate(`/pedido/${pedidoId}`);
  };
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status options para menu de contexto
  const statusOptions = [
    { id: 'recebido', label: '📥 Recebidos', color: 'blue' },
    { id: 'em_preparo', label: '👨‍🍳 Em Preparo', color: 'yellow' },
    { id: 'aguardando_entregador', label: '📦 Prontos', color: 'purple' },
    { id: 'saiu_para_entrega', label: '🚚 Em Entrega', color: 'orange' },
    { id: 'entregue', label: '✅ Entregues', color: 'green' }
  ];

  const loadKanbanData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/orders/kanban/data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setLastUpdate(new Date());
        
        const totalPedidos = Object.values(data).reduce((total, column) => total + column.length, 0);
        console.log(`✅ Kanban atualizado: ${totalPedidos} pedidos carregados`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar Kanban:', error);
      toast.error('❌ Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKanbanData();
    const interval = setInterval(loadKanbanData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const updateOrderStatus = async (orderId, newStatus, oldStatus, retryCount = 0) => {
    try {
      console.log(`🔄 Atualizando pedido ${orderId}: ${oldStatus} → ${newStatus}`);
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          user: 'Admin Kanban',
          observation: `Movido de ${oldStatus.replace('_', ' ')} para ${newStatus.replace('_', ' ')} via Kanban`
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Status atualizado com sucesso:', result);
        toast.success(`✅ ${newStatus.replace('_', ' ').toUpperCase()}`);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      
      // Sistema de retry (máximo 2 tentativas)
      if (retryCount < 2) {
        console.log(`🔄 Tentativa ${retryCount + 1} de 3...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
        return updateOrderStatus(orderId, newStatus, oldStatus, retryCount + 1);
      }
      
      toast.error(`❌ Erro ao atualizar: ${error.message}`);
      // Reverter mudança
      moveOrderBetweenColumns(orderId, newStatus, oldStatus);
      return false;
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // Validações robustas
    if (!destination) {
      console.log('🚫 Drag cancelado: sem destino');
      return;
    }
    
    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) {
      console.log('🚫 Drag cancelado: mesmo local');
      return;
    }

    const orderId = draggableId;
    const oldStatus = source.droppableId;
    const newStatus = destination.droppableId;

    // Validar se o pedido existe
    const order = orders[oldStatus]?.find(o => o._id === orderId);
    if (!order) {
      console.error('❌ Pedido não encontrado:', orderId);
      toast.error('❌ Pedido não encontrado');
      return;
    }

    console.log(`🎯 Drag & Drop: ${order.orderNumber || orderId.slice(-6)} de ${oldStatus} para ${newStatus}`);

    // Atualização otimista da UI
    moveOrderBetweenColumns(orderId, oldStatus, newStatus);
    
    // Mostrar loading
    toast.loading('🔄 Atualizando status...', { id: orderId });
    
    // Atualizar no backend
    const success = await updateOrderStatus(orderId, newStatus, oldStatus);
    
    // Remover loading toast
    toast.dismiss(orderId);
    
    if (!success) {
      console.log('❌ Falha na atualização, revertendo...');
    }
  };

  const moveOrderBetweenColumns = (orderId, fromStatus, toStatus) => {
    setOrders(prev => {
      const order = prev[fromStatus]?.find(o => o._id === orderId);
      if (!order) {
        console.error('❌ Pedido não encontrado para mover:', orderId);
        return prev;
      }

      console.log(`📦 Movendo pedido ${order.orderNumber || orderId.slice(-6)}: ${fromStatus} → ${toStatus}`);

      return {
        ...prev,
        [fromStatus]: prev[fromStatus].filter(o => o._id !== orderId),
        [toStatus]: [...(prev[toStatus] || []), { ...order, status: toStatus }]
      };
    });
  };

  // Função para menu de contexto
  const handleContextMenu = (e, order) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedOrder(order);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      orderId: order._id,
      currentStatus: order.status
    });
    
    console.log(`🖱️ Menu contexto aberto para pedido: ${order.orderNumber || order._id.slice(-6)}`);
  };

  // Mover via menu de contexto
  const moveOrderViaMenu = async (newStatus) => {
    if (!selectedOrder || !contextMenu) return;
    
    const oldStatus = selectedOrder.status;
    const orderId = selectedOrder._id;
    
    if (oldStatus === newStatus) {
      toast.info('ℹ️ Pedido já está neste status');
      setContextMenu(null);
      return;
    }

    console.log(`🎯 Menu: Movendo ${selectedOrder.orderNumber || orderId.slice(-6)} para ${newStatus}`);
    
    // Atualização otimista da UI
    moveOrderBetweenColumns(orderId, oldStatus, newStatus);
    
    // Fechar menu
    setContextMenu(null);
    setSelectedOrder(null);
    
    // Mostrar loading
    toast.loading('🔄 Movendo pedido...', { id: orderId });
    
    // Atualizar no backend
    const success = await updateOrderStatus(orderId, newStatus, oldStatus);
    
    // Remover loading toast
    toast.dismiss(orderId);
  };

  const renderOrderCard = (order, index) => (
    <Draggable draggableId={order._id} index={index} key={order._id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white p-3 mb-3 rounded-lg shadow-sm border-l-4 border-blue-400 
            transition-all duration-200 cursor-move select-none
            ${snapshot.isDragging ? 'shadow-2xl rotate-1 scale-105 z-50 border-green-400' : 'hover:shadow-md hover:scale-[1.02]'}
          `}
          onContextMenu={(e) => handleContextMenu(e, order)}
          onClick={() => irParaDetalhes(order._id)}
          title="🖱️ Arraste para mover | Botão direito para menu"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold text-gray-800">
              #{order.orderNumber || order._id.slice(-6)}
            </div>
            <div className="font-bold text-green-600">
              R$ {order.total?.toFixed(2) || '0.00'}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            👤 {order.customerName || 'Cliente não informado'}
          </div>
          
          {order.customerPhone && (
            <div className="text-xs text-gray-500 mb-1">
              📞 {order.customerPhone}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              📅 {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </div>
            <div className="text-xs text-gray-500">
              ⏰ {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          {snapshot.isDragging && (
            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-lg">
              🤏
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  const renderColumn = (status, title, color, ordersList) => (
    <div className={`bg-${color}-50 border-2 border-${color}-200 rounded-lg min-h-96 overflow-hidden`}>
      <div className={`bg-${color}-500 text-white p-4 rounded-t-lg`}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold">
            {ordersList.length}
          </span>
        </div>
        
        {ordersList.length > 0 && (
          <div className="mt-2 text-sm opacity-90">
            💰 Total: R$ {ordersList.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
          </div>
        )}
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              p-4 min-h-80 transition-all duration-300 overflow-y-auto max-h-96
              ${snapshot.isDraggingOver ? 'bg-white bg-opacity-70 scale-[1.01] border-2 border-dashed border-green-400' : ''}
            `}
          >
            {ordersList.length > 0 ? (
              ordersList.map((order, index) => renderOrderCard(order, index))
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4 opacity-50">
                  {status === 'recebido' && '📥'}
                  {status === 'em_preparo' && '👨‍🍳'}
                  {status === 'aguardando_entregador' && '📦'}
                  {status === 'saiu_para_entrega' && '🚚'}
                  {status === 'entregue' && '✅'}
                </div>
                <p className="font-medium">Nenhum pedido</p>
                <p className="text-sm">Arraste um pedido aqui</p>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  const totalPedidos = Object.values(orders).reduce((total, column) => total + column.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard Kanban - Pedidos do Bot WhatsApp 🤖
            </h1>
            <p className="text-gray-600">
              {totalPedidos} pedidos • Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              {isLoading && <span className="ml-2">⏳ Carregando...</span>}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              🖱️ <strong>Arraste</strong> os cards entre colunas ou <strong>clique direito</strong> para menu
            </p>
          </div>
          
          <button
            onClick={loadKanbanData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            disabled={isLoading}
          >
            <span>🔄</span>
            <span>{isLoading ? 'Carregando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-5 gap-6">
          {renderColumn('recebido', '📥 Recebidos', 'blue', orders.recebido || [])}
          {renderColumn('em_preparo', '👨‍🍳 Em Preparo', 'yellow', orders.em_preparo || [])}
          {renderColumn('aguardando_entregador', '📦 Prontos', 'purple', orders.aguardando_entregador || [])}
          {renderColumn('saiu_para_entrega', '🚚 Em Entrega', 'orange', orders.saiu_para_entrega || [])}
          {renderColumn('entregue', '✅ Entregues', 'green', orders.entregue || [])}
        </div>
      </DragDropContext>

      {/* Menu de Contexto */}
      {contextMenu && (
        <div 
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-48"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(-10px, -10px)'
          }}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">
              Mover para:
            </p>
          </div>
          {statusOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => moveOrderViaMenu(option.id)}
              disabled={option.id === contextMenu.currentStatus}
              className={`
                w-full text-left px-3 py-2 text-sm transition-colors
                ${option.id === contextMenu.currentStatus 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                }
              `}
            >
              {option.label}
              {option.id === contextMenu.currentStatus && (
                <span className="ml-2 text-xs">(atual)</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>🔄 Atualização automática a cada 30 segundos</p>
        <p>📱 Integrado com Bot WhatsApp • 🎯 Drag & Drop MELHORADO! • 🖱️ Menu Botão Direito</p>
      </div>
    </div>
  );
};

export default KanbanBoard;
