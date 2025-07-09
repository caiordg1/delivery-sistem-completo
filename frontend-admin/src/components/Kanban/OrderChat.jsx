import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User, Clock, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { addOrderObservation } from '../../../services/api';
import toast from 'react-hot-toast';

const OrderChat = ({ orderId, observations = [], onNewObservation, isLoading }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageType, setMessageType] = useState('info');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Auto-scroll inteligente com delay
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };

    // Delay para garantir que DOM foi atualizado
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [observations]);

  // ✅ Focar input quando modal abrir
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // ✅ Simulador de typing indicator
  useEffect(() => {
    if (newMessage.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [newMessage]);

  // ✅ Filtrar observações
  const filteredObservations = observations.filter(obs => {
    const matchesSearch = !searchFilter || 
      obs.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
      obs.user.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesType = typeFilter === 'all' || obs.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !orderId) return;

    setIsSending(true);
    try {
      // ✅ Determinar usuário atual
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = user.name || user.username || user.email || 'Admin';

      await addOrderObservation(orderId, {
        text: newMessage.trim(),
        user: userName,
        type: messageType
      });

      setNewMessage('');
      setMessageType('info'); // Reset para tipo padrão
      
      // Recarregar observações
      if (onNewObservation) {
        onNewObservation();
      }
      
      toast.success('Observação adicionada');

    } catch (error) {
      console.error('Erro ao enviar observação:', error);
      toast.error('Erro ao enviar observação');
    } finally {
      setIsSending(false);
      // Manter foco no input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleQuickAction = (actionText) => {
    setNewMessage(actionText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getMessageTypeIcon = (type) => {
    const icons = {
      info: Info,
      warning: AlertCircle,
      error: X,
      success: CheckCircle
    };
    return icons[type] || Info;
  };

  const getMessageTypeColor = (type) => {
    const colors = {
      info: 'border-l-blue-400 bg-blue-50 text-blue-800',
      warning: 'border-l-yellow-400 bg-yellow-50 text-yellow-800',
      error: 'border-l-red-400 bg-red-50 text-red-800',
      success: 'border-l-green-400 bg-green-50 text-green-800'
    };
    return colors[type] || 'border-l-blue-400 bg-blue-50 text-blue-800';
  };

  const getMessageTypeLabel = (type) => {
    const labels = {
      info: 'Informação',
      warning: 'Atenção',
      error: 'Problema',
      success: 'Sucesso'
    };
    return labels[type] || 'Informação';
  };

  // ✅ Ações rápidas expandidas por categoria
  const quickActionCategories = [
    {
      name: 'Status do Cliente',
      actions: [
        { text: 'Cliente confirmou o pedido', icon: '✅', type: 'success' },
        { text: 'Aguardando confirmação do cliente', icon: '⏳', type: 'info' },
        { text: 'Cliente não atende telefone', icon: '📞', type: 'warning' },
        { text: 'Cliente solicitou alteração', icon: '🔄', type: 'warning' }
      ]
    },
    {
      name: 'Problemas de Entrega',
      actions: [
        { text: 'Problema no endereço de entrega', icon: '❌', type: 'error' },
        { text: 'Endereço não encontrado', icon: '🗺️', type: 'error' },
        { text: 'Cliente não está no local', icon: '🚪', type: 'warning' },
        { text: 'Portão/prédio fechado', icon: '🔒', type: 'warning' }
      ]
    },
    {
      name: 'Status de Produção',
      actions: [
        { text: 'Pedido pronto para retirada', icon: '📦', type: 'success' },
        { text: 'Entregador a caminho', icon: '🚚', type: 'info' },
        { text: 'Atraso na cozinha', icon: '⏰', type: 'warning' },
        { text: 'Falta de ingrediente', icon: '🥘', type: 'error' }
      ]
    }
  ];

  // ✅ Estatísticas das observações
  const observationStats = {
    total: observations.length,
    byType: observations.reduce((acc, obs) => {
      acc[obs.type || 'info'] = (acc[obs.type || 'info'] || 0) + 1;
      return acc;
    }, {}),
    recent: observations.filter(obs => {
      const obsTime = new Date(obs.timestamp);
      const now = new Date();
      return (now - obsTime) < 60 * 60 * 1000; // Últimas 1 hora
    }).length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Carregando observações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Observações da Equipe
          </h3>
          {observations.length > 0 && (
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              <span>💬 {observationStats.total} mensagens</span>
              <span>🔥 {observationStats.recent} na última hora</span>
              {observationStats.byType.error > 0 && (
                <span className="text-red-600 font-medium">
                  ⚠️ {observationStats.byType.error} problemas
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar nas observações..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="info">📋 Informação</option>
          <option value="warning">⚠️ Atenção</option>
          <option value="error">❌ Problema</option>
          <option value="success">✅ Sucesso</option>
        </select>
      </div>

      {/* Container de Mensagens */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 h-80 overflow-y-auto p-4 space-y-3">
        {filteredObservations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchFilter || typeFilter !== 'all' ? (
              <>
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhuma observação encontrada</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
                <button
                  onClick={() => {
                    setSearchFilter('');
                    setTypeFilter('all');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhuma observação ainda</p>
                <p className="text-sm">Adicione a primeira observação sobre este pedido</p>
              </>
            )}
          </div>
        ) : (
          filteredObservations.map((obs, index) => {
            const TypeIcon = getMessageTypeIcon(obs.type);
            return (
              <div
                key={index}
                className={`border-l-4 pl-4 py-3 ${getMessageTypeColor(obs.type)} rounded-r-lg transition-all duration-200 hover:shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="w-4 h-4" />
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {getMessageTypeLabel(obs.type)}
                    </span>
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{obs.user || 'Usuário'}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs opacity-75">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(obs.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed font-medium">{obs.text}</p>
              </div>
            );
          })
        )}
        
        {/* Indicador de digitação */}
        {isTyping && newMessage.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>Digitando...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Nova Mensagem */}
      <form onSubmit={handleSendMessage} className="space-y-3">
        {/* Seletor de tipo de mensagem */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Tipo:</label>
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="info">📋 Informação</option>
            <option value="warning">⚠️ Atenção</option>
            <option value="error">❌ Problema</option>
            <option value="success">✅ Sucesso</option>
          </select>
        </div>

        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma observação sobre este pedido..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isSending}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isSending ? 'Enviando...' : 'Enviar'}</span>
          </button>
        </div>
      </form>

      {/* Ações Rápidas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Ações rápidas:</p>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showQuickActions ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        {showQuickActions && (
          <div className="space-y-4">
            {quickActionCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  {category.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {category.actions.map((action, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        handleQuickAction(action.text);
                        setMessageType(action.type);
                      }}
                      className="px-3 py-1 text-xs bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center space-x-1"
                    >
                      <span>{action.icon}</span>
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contador de Caracteres e Dicas */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {newMessage && (
            <span>{newMessage.length}/500 caracteres</span>
          )}
          <span>💡 Use Ctrl+Enter para enviar rapidamente</span>
        </div>
        {filteredObservations.length !== observations.length && (
          <span className="text-blue-600">
            Mostrando {filteredObservations.length} de {observations.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default OrderChat;
