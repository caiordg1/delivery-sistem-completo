import React, { useState, useMemo } from 'react';
import { Clock, User, MessageSquare, RefreshCw, Filter, Calendar } from 'lucide-react';

const OrderTimeline = ({ timeline = [], isLoading, onRefresh }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // ✅ Processar timeline com cálculos de tempo
  const processedTimeline = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];

    return timeline.map((event, index) => {
      const currentTime = new Date(event.timestamp);
      const nextEvent = timeline[index + 1];
      
      let timeInStatus = null;
      if (nextEvent) {
        const nextTime = new Date(nextEvent.timestamp);
        const diffMs = nextTime - currentTime;
        timeInStatus = Math.floor(diffMs / 60000); // minutos
      }

      return {
        ...event,
        timeInStatus,
        formattedTime: currentTime.toLocaleString('pt-BR'),
        relativeTime: getRelativeTime(currentTime)
      };
    });
  }, [timeline]);

  // ✅ Filtrar eventos por status selecionado
  const filteredTimeline = useMemo(() => {
    if (selectedStatuses.length === 0) return processedTimeline;
    return processedTimeline.filter(event => 
      selectedStatuses.includes(event.status)
    );
  }, [processedTimeline, selectedStatuses]);

  // ✅ Função para tempo relativo
  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'ontem';
    return `${diffDays} dias atrás`;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendente: '⏳',
      recebido: '📥',
      em_preparo: '👨‍🍳',
      aguardando_entregador: '📦',
      saiu_para_entrega: '🚚',
      entregue: '✅',
      cancelado: '❌'
    };
    return icons[status] || '📝';
  };

  const getStatusColor = (status) => {
    const colors = {
      pendente: 'bg-gray-500 border-gray-300',
      recebido: 'bg-blue-500 border-blue-300',
      em_preparo: 'bg-yellow-500 border-yellow-300',
      aguardando_entregador: 'bg-purple-500 border-purple-300',
      saiu_para_entrega: 'bg-orange-500 border-orange-300',
      entregue: 'bg-green-500 border-green-300',
      cancelado: 'bg-red-500 border-red-300'
    };
    return colors[status] || 'bg-gray-500 border-gray-300';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendente: 'Pendente',
      recebido: 'Recebido',
      em_preparo: 'Em Preparo',
      aguardando_entregador: 'Aguardando Entregador',
      saiu_para_entrega: 'Saiu para Entrega',
      entregue: 'Entregue',
      cancelado: 'Cancelado'
    };
    return labels[status] || status;
  };

  // ✅ Opções de filtro
  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'gray' },
    { value: 'recebido', label: 'Recebido', color: 'blue' },
    { value: 'em_preparo', label: 'Em Preparo', color: 'yellow' },
    { value: 'aguardando_entregador', label: 'Aguardando Entregador', color: 'purple' },
    { value: 'saiu_para_entrega', label: 'Saiu para Entrega', color: 'orange' },
    { value: 'entregue', label: 'Entregue', color: 'green' },
    { value: 'cancelado', label: 'Cancelado', color: 'red' }
  ];

  const toggleStatusFilter = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
  };

  // ✅ Estatísticas do timeline
  const timelineStats = useMemo(() => {
    const totalEvents = processedTimeline.length;
    const eventsWithTime = processedTimeline.filter(e => e.timeInStatus !== null);
    const avgTimeInStatus = eventsWithTime.length > 0
      ? Math.round(eventsWithTime.reduce((sum, e) => sum + e.timeInStatus, 0) / eventsWithTime.length)
      : 0;

    const firstEvent = processedTimeline[0];
    const lastEvent = processedTimeline[processedTimeline.length - 1];
    const totalDuration = firstEvent && lastEvent
      ? Math.floor((new Date(lastEvent.timestamp) - new Date(firstEvent.timestamp)) / 60000)
      : 0;

    return {
      totalEvents,
      avgTimeInStatus,
      totalDuration
    };
  }, [processedTimeline]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Histórico do Pedido
          </h3>
          {processedTimeline.length > 0 && (
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              <span>📊 {timelineStats.totalEvents} eventos</span>
              {timelineStats.totalDuration > 0 && (
                <span>⏱️ {timelineStats.totalDuration}min total</span>
              )}
              {timelineStats.avgTimeInStatus > 0 && (
                <span>📈 {timelineStats.avgTimeInStatus}min média/status</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters || selectedStatuses.length > 0
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Filtrar eventos"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Atualizar histórico"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">Filtrar por status:</h4>
            {selectedStatuses.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpar filtros
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleStatusFilter(option.value)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedStatuses.includes(option.value)
                    ? `bg-${option.color}-100 border-${option.color}-300 text-${option.color}-700`
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getStatusIcon(option.value)} {option.label}
              </button>
            ))}
          </div>
          
          {selectedStatuses.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Mostrando {filteredTimeline.length} de {processedTimeline.length} eventos
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {filteredTimeline.length > 0 ? (
          filteredTimeline.map((event, index) => (
            <div key={index} className="flex items-start space-x-4">
              {/* Ícone do Status */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getStatusColor(event.status)} flex items-center justify-center text-white text-lg shadow-lg border-2`}>
                {getStatusIcon(event.status)}
              </div>
              
              {/* Conteúdo do Evento */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  {/* Header do evento */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <p className="text-base font-medium text-gray-900">
                        {getStatusLabel(event.status)}
                      </p>
                      {event.timeInStatus !== null && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {event.timeInStatus}min neste status
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {event.formattedTime}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.relativeTime}
                      </p>
                    </div>
                  </div>
                  
                  {/* Observação */}
                  {event.observation && (
                    <div className="mt-2 flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 leading-relaxed">{event.observation}</p>
                    </div>
                  )}
                  
                  {/* Usuário */}
                  {event.user && (
                    <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>Alterado por <span className="font-medium">{event.user}</span></span>
                    </div>
                  )}
                </div>

                {/* Linha conectora */}
                {index < filteredTimeline.length - 1 && (
                  <div className="w-px h-6 bg-gray-300 ml-6 mt-3"></div>
                )}
              </div>
            </div>
          ))
        ) : processedTimeline.length > 0 ? (
          /* Filtered empty state */
          <div className="text-center py-12 text-gray-500">
            <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum evento encontrado</p>
            <p className="text-sm">Tente ajustar os filtros para ver mais eventos</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          /* Truly empty state */
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum evento registrado</p>
            <p className="text-sm">O histórico será atualizado conforme o pedido progride</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTimeline;
