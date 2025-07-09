import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PedidoDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPedido(data.order);
      } else {
        toast.error('Pedido não encontrado');
        navigate('/kanban');
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast.error('Erro ao carregar dados do pedido');
      navigate('/kanban');
    } finally {
      setIsLoading(false);
    }
  };

  const voltarKanban = () => {
    navigate('/kanban');
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'recebido': 'bg-blue-100 text-blue-800',
      'em_preparo': 'bg-yellow-100 text-yellow-800',
      'aguardando_entregador': 'bg-purple-100 text-purple-800',
      'saiu_para_entrega': 'bg-orange-100 text-orange-800',
      'entregue': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusTexto = (status) => {
    const textos = {
      'recebido': '📥 Recebido',
      'em_preparo': '👨‍🍳 Em Preparo',
      'aguardando_entregador': '📦 Pronto',
      'saiu_para_entrega': '🚚 Em Entrega',
      'entregue': '✅ Entregue'
    };
    return textos[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-gray-600 mb-4">Pedido não encontrado</p>
          <button
            onClick={voltarKanban}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Voltar ao Kanban
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={voltarKanban}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>←</span>
          <span>Voltar ao Kanban</span>
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Detalhes do Pedido #{pedido.orderNumber || pedido._id?.slice(-6)}
            </h1>
            <p className="text-gray-600">
              {formatarData(pedido.createdAt)}
            </p>
          </div>
          
          <div className={`px-4 py-2 rounded-full font-bold ${getStatusColor(pedido.status)}`}>
            {getStatusTexto(pedido.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados do Cliente */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👤</span>
            Dados do Cliente
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Nome:</label>
              <p className="font-medium">{pedido.customerName || 'Não informado'}</p>
            </div>
            
            {pedido.customerEmail && (
              <div>
                <label className="text-sm text-gray-500">E-mail:</label>
                <p className="font-medium">{pedido.customerEmail}</p>
              </div>
            )}
            
            {pedido.customerPhone && (
              <div>
                <label className="text-sm text-gray-500">Telefone:</label>
                <p className="font-medium">{pedido.customerPhone}</p>
              </div>
            )}
            
            {pedido.customerAddress && (
              <div>
                <label className="text-sm text-gray-500">Endereço:</label>
                <p className="font-medium">{pedido.customerAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dados do Pedido */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🛍️</span>
            Dados do Pedido
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Total:</label>
              <p className="font-bold text-green-600 text-xl">R$ {pedido.total?.toFixed(2) || '0.00'}</p>
            </div>
            
            {pedido.paymentMethod && (
              <div>
                <label className="text-sm text-gray-500">Forma de Pagamento:</label>
                <p className="font-medium">{pedido.paymentMethod}</p>
              </div>
            )}
            
            {pedido.estimatedTime && (
              <div>
                <label className="text-sm text-gray-500">Tempo Estimado:</label>
                <p className="font-medium">{pedido.estimatedTime}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm text-gray-500">Data/Hora:</label>
              <p className="font-medium">{formatarData(pedido.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        {pedido.items && pedido.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Itens do Pedido ({pedido.items.length})
            </h2>
            
            <div className="space-y-3">
              {pedido.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">R$ {item.price?.toFixed(2)} cada</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações */}
        {pedido.observations && (
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💬</span>
              Observações
            </h2>
            <p className="text-gray-700">{pedido.observations}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <button
          onClick={voltarKanban}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          ← Voltar ao Kanban
        </button>
      </div>
    </div>
  );
};

export default PedidoDetalhes;
