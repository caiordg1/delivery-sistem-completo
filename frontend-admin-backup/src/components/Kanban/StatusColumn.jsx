import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import OrderCard from './OrderCard';

const StatusColumn = ({ status, title, orders = [], color, onOrderClick }) => {
  
  const getColumnStyles = (color) => {
    const styles = {
      blue: 'bg-blue-50 border-blue-200',
      yellow: 'bg-yellow-50 border-yellow-200', 
      purple: 'bg-purple-50 border-purple-200',
      orange: 'bg-orange-50 border-orange-200',
      green: 'bg-green-50 border-green-200'
    };
    return styles[color] || styles.blue;
  };

  const getHeaderStyles = (color) => {
    const styles = {
      blue: 'bg-blue-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      purple: 'bg-purple-500 text-white', 
      orange: 'bg-orange-500 text-white',
      green: 'bg-green-500 text-white'
    };
    return styles[color] || styles.blue;
  };

  // ✅ Calcular métricas com validação
  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  
  const averageTime = totalOrders > 0 
    ? Math.round(orders.reduce((acc, order) => {
        try {
          const created = new Date(order.createdAt);
          const now = new Date();
          const minutes = Math.floor((now - created) / 60000);
          return acc + (minutes || 0);
        } catch (error) {
          return acc;
        }
      }, 0) / totalOrders)
    : 0;

  // ✅ Valor total dos pedidos na coluna
  const totalValue = totalOrders > 0
    ? orders.reduce((acc, order) => acc + (order.total || 0), 0)
    : 0;

  return (
    <div className={`rounded-lg border-2 ${getColumnStyles(color)} h-fit min-h-96 flex flex-col`}>
      {/* Header com informações */}
      <div className={`${getHeaderStyles(color)} p-4 rounded-t-lg flex-shrink-0`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold">
            {totalOrders}
          </span>
        </div>
        
        {totalOrders > 0 && (
          <div className="text-sm opacity-90 space-y-1">
            <div className="flex justify-between">
              <span>⏱️ Tempo médio:</span>
              <span className="font-medium">{averageTime}min</span>
            </div>
            <div className="flex justify-between">
              <span>💰 Total:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalValue)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Área de drop dos pedidos */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-3 min-h-80 transition-all duration-200
              ${snapshot.isDraggingOver ? 'bg-white bg-opacity-50 scale-[1.02]' : ''}
            `}
          >
            {/* Lista de pedidos */}
            {totalOrders > 0 ? (
              <div className="space-y-3">
                {orders.map((order, index) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    index={index}
                    onClick={() => onOrderClick(order)}
                  />
                ))}
              </div>
            ) : (
              /* Estado vazio */
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4 opacity-50">
                  {status === 'recebido' && '📥'}
                  {status === 'em_preparo' && '👨‍🍳'}
                  {status === 'aguardando_entregador' && '📦'}
                  {status === 'saiu_para_entrega' && '🚚'}
                  {status === 'entregue' && '✅'}
                </div>
                <p className="font-medium">Nenhum pedido</p>
                <p className="text-sm">
                  {status === 'recebido' && 'Aguardando novos pedidos...'}
                  {status === 'em_preparo' && 'Nenhum pedido em preparo'}
                  {status === 'aguardando_entregador' && 'Nenhum pedido pronto'}
                  {status === 'saiu_para_entrega' && 'Nenhum pedido em entrega'}
                  {status === 'entregue' && 'Nenhum pedido entregue hoje'}
                </p>
              </div>
            )}
            
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default StatusColumn;
