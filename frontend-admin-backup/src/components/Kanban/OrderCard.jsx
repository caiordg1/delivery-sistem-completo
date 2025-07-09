import React, { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Clock, User, MapPin, CreditCard, AlertTriangle, MessageSquare } from 'lucide-react';

const OrderCard = ({ order, index, onClick }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  // ✅ Timer em tempo real
  useEffect(() => {
    const updateTimer = () => {
      try {
        const now = new Date();
        const created = new Date(order.createdAt);
        const minutes = Math.floor((now - created) / 60000);
        setTimeElapsed(minutes >= 0 ? minutes : 0);
      } catch (error) {
        setTimeElapsed(0);
      }
    };

    // Atualizar imediatamente
    updateTimer();
    
    // Atualizar a cada minuto
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, [order.createdAt]);

  // ✅ Styles baseados na prioridade
  const getPriorityColor = (priority) => {
    const colors = {
      baixa: 'border-l-green-400',
      normal: 'border-l-blue-400', 
      alta: 'border-l-yellow-400',
      urgente: 'border-l-red-400'
    };
    return colors[priority || 'normal'] || colors.normal;
  };

  // ✅ Cores baseadas no tempo decorrido
  const getTimeColor = (minutes) => {
    if (minutes < 30) return 'text-green-600';
    if (minutes < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ✅ Formatação de moeda
  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0);
    } catch (error) {
      return `R$ ${(value || 0).toFixed(2)}`;
    }
  };

  // ✅ Indicador de urgência visual
  const getUrgencyIndicator = () => {
    if (order.priority === 'urgente') return '🔥';
    if (timeElapsed > 90) return '⚠️';
    if (timeElapsed > 60) return '⏰';
    return null;
  };

  return (
    <Draggable draggableId={order._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={(e) => {
            e.preventDefault();
            onClick();
          }}
          className={`
            bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(order.priority)}
            p-4 cursor-pointer transition-all duration-200 hover:shadow-md
            ${snapshot.isDragging ? 'shadow-xl rotate-2 scale-105 z-50' : 'hover:scale-[1.02]'}
          `}
        >
          {/* Header do Card */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-800 text-lg">
                  #{order.orderNumber || order._id?.slice(-6) || 'N/A'}
                </h4>
                {getUrgencyIndicator() && (
                  <span className="text-lg">{getUrgencyIndicator()}</span>
                )}
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <User className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{order.customerName || 'Cliente não informado'}</span>
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-lg text-green-600">
                {formatCurrency(order.total)}
              </div>
              
              {order.priority === 'urgente' && (
                <div className="flex items-center justify-end mt-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-500 ml-1">URGENTE</span>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="space-y-2 text-sm text-gray-600">
            {order.customerPhone && (
              <div className="flex items-center">
                <span className="mr-1">📞</span>
                <span className="truncate">{order.customerPhone}</span>
              </div>
            )}
            
            {order.customerAddress && (
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{order.customerAddress}</span>
              </div>
            )}

            {order.paymentMethod && (
              <div className="flex items-center">
                <CreditCard className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate capitalize">{order.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Footer do Card */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            {/* Timer */}
            <div className="flex items-center text-sm">
              <Clock className="w-3 h-3 mr-1" />
              <span className={`font-medium ${getTimeColor(timeElapsed)}`}>
                {timeElapsed}min
              </span>
            </div>
            
            {/* Contadores */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {/* Quantidade de itens */}
              <span>
                {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'itens'}
              </span>
              
              {/* Indicador de observações */}
              {order.observations && order.observations.length > 0 && (
                <div className="flex items-center text-blue-600">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  <span>{order.observations.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Indicador de observações importantes */}
          {order.observations && order.observations.some(obs => obs.type === 'warning' || obs.type === 'error') && (
            <div className="mt-2 flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs text-red-600 font-medium">
                Atenção necessária
              </span>
            </div>
          )}
          
          {/* Preview de observações recentes */}
          {order.observations && order.observations.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <div className="flex items-center text-blue-700 mb-1">
                <MessageSquare className="w-3 h-3 mr-1" />
                <span className="font-medium">Última observação:</span>
              </div>
              <p className="text-blue-600 truncate">
                {order.observations[order.observations.length - 1]?.text || 'N/A'}
              </p>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default OrderCard;
