import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Users, Package, DollarSign, Timer } from 'lucide-react';
import { getOrderMetrics, getOrderAlerts } from '../../../services/api';
import toast from 'react-hot-toast';

const KanbanMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    averageTime: 0,
    delayedOrders: 0,
    completedToday: 0,
    statusTimes: [],
    hourlyDistribution: [],
    revenueToday: 0,
    pendingValue: 0
  });
  
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    loadAlerts();
    
    // Auto-refresh a cada 2 minutos se habilitado
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadMetrics();
        loadAlerts();
      }, 2 * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedPeriod, autoRefresh]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await getOrderMetrics();
      
      // Simular dados adicionais para demonstração
      const baseMetrics = response.data || {};
      const enhancedMetrics = {
        ...baseMetrics,
        revenueToday: calculateRevenueToday(baseMetrics),
        pendingValue: calculatePendingValue(baseMetrics),
        hourlyDistribution: generateHourlyData(),
        statusDistribution: generateStatusDistribution(baseMetrics)
      };
      
      setMetrics(enhancedMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await getOrderAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  // ✅ Funções auxiliares para calcular métricas
  const calculateRevenueToday = (baseMetrics) => {
    // Simular receita baseada em pedidos completados
    return (baseMetrics.completedToday || 0) * 45.50; // Média R$ 45,50 por pedido
  };

  const calculatePendingValue = (baseMetrics) => {
    // Simular valor pendente baseado em pedidos não finalizados
    const pendingOrders = (baseMetrics.totalOrders || 0) - (baseMetrics.completedToday || 0);
    return pendingOrders * 42.30; // Média R$ 42,30 por pedido pendente
  };

  const generateHourlyData = () => {
    // Simular distribuição de pedidos por hora
    const hours = [];
    for (let i = 6; i <= 23; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      const orders = Math.floor(Math.random() * 15) + (i >= 11 && i <= 14 ? 20 : i >= 18 && i <= 21 ? 25 : 5);
      hours.push({ hour, orders, revenue: orders * 45.50 });
    }
    return hours;
  };

  const generateStatusDistribution = (baseMetrics) => {
    // Distribuição atual por status
    return [
      { name: 'Recebidos', value: 8, color: '#3B82F6' },
      { name: 'Em Preparo', value: 5, color: '#EAB308' },
      { name: 'Prontos', value: 3, color: '#8B5CF6' },
      { name: 'Em Entrega', value: 7, color: '#F97316' },
      { name: 'Entregues', value: baseMetrics.completedToday || 0, color: '#10B981' }
    ];
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Dashboard Operacional
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Métricas em tempo real do sistema de pedidos
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Seletor de período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
          
          {/* Toggle auto-refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
          </button>
          
          {/* Botão refresh manual */}
          <button
            onClick={loadMetrics}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Atualizar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Indicador de última atualização */}
          <span className="text-xs text-gray-500">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Pedidos Hoje"
          value={metrics.totalOrders}
          icon={Package}
          color="blue"
          isLoading={isLoading}
          subtitle={`${metrics.completedToday} finalizados`}
        />
        
        <MetricCard
          title="Receita Hoje"
          value={formatCurrency(metrics.revenueToday)}
          icon={DollarSign}
          color="green"
          isLoading={isLoading}
          subtitle={`${formatCurrency(metrics.pendingValue)} pendente`}
        />
        
        <MetricCard
          title="Tempo Médio"
          value={formatTime(metrics.averageTime)}
          icon={Timer}
          color="yellow"
          isLoading={isLoading}
          subtitle="por pedido"
        />
        
        <MetricCard
          title="Alertas Ativos"
          value={alerts.length}
          icon={AlertTriangle}
          color="red"
          isLoading={isLoading}
          alert={alerts.length > 0}
          subtitle={`${metrics.delayedOrders} atrasados`}
        />
      </div>

      {/* Alertas Ativos */}
      {alerts.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alertas Ativos ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="text-sm text-red-700 flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                {alert.message}
              </div>
            ))}
            {alerts.length > 3 && (
              <div className="text-sm text-red-600 italic">
                +{alerts.length - 3} alertas adicionais...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Pedidos por Hora */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Pedidos por Hora
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.hourlyDistribution || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={([value, name]) => [`${value} pedidos`, 'Quantidade']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #D1D5DB' }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Distribuição por Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Distribuição por Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(metrics.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={([value, name]) => [`${value} pedidos`, 'Quantidade']}
                  contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #D1D5DB' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legenda */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {(metrics.statusDistribution || []).map((entry, index) => (
              <div key={index} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tempo Médio por Status */}
      {metrics.statusTimes && metrics.statusTimes.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Tempo Médio por Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.statusTimes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={([value]) => [`${value} min`, 'Tempo Médio']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #D1D5DB' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageTime" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Performance da Equipe
          </h4>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex justify-between">
              <span>Taxa de conclusão:</span>
              <span className="font-medium">
                {metrics.totalOrders > 0 ? Math.round((metrics.completedToday / metrics.totalOrders) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Eficiência horária:</span>
              <span className="font-medium">
                {Math.round(metrics.totalOrders / 8)} pedidos/h
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-medium text-green-800 mb-2 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Análise Financeira
          </h4>
          <div className="space-y-2 text-sm text-green-700">
            <div className="flex justify-between">
              <span>Ticket médio:</span>
              <span className="font-medium">
                {formatCurrency(metrics.totalOrders > 0 ? metrics.revenueToday / metrics.totalOrders : 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Meta diária:</span>
              <span className="font-medium">
                {Math.round((metrics.revenueToday / 1500) * 100)}% (R$ 1.500)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Análise Temporal
          </h4>
          <div className="space-y-2 text-sm text-purple-700">
            <div className="flex justify-between">
              <span>Pico de pedidos:</span>
              <span className="font-medium">19:00 - 21:00</span>
            </div>
            <div className="flex justify-between">
              <span>Hora mais rápida:</span>
              <span className="font-medium">14:00 - 16:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Componente auxiliar para cards de métricas
const MetricCard = ({ title, value, subtitle, icon: Icon, color, isLoading, alert = false }) => {
  const getColorClasses = (color) => {
    const classes = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      red: 'bg-red-50 text-red-700 border-red-200'
    };
    return classes[color] || classes.blue;
  };

  const getIconColor = (color) => {
    const classes = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      yellow: 'text-yellow-500',
      red: 'text-red-500'
    };
    return classes[color] || classes.blue;
  };

  return (
    <div className={`rounded-lg p-4 border transition-all duration-200 ${getColorClasses(color)} ${
      alert ? 'ring-2 ring-red-400 animate-pulse' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {isLoading ? (
              <div className="animate-pulse bg-gray-300 h-8 w-20 rounded"></div>
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-xs opacity-60 mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${getIconColor(color)} opacity-75 flex-shrink-0`} />
      </div>
    </div>
  );
};

export default KanbanMetrics;
