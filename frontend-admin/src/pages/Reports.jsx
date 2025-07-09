import React, { useState, useEffect } from 'react';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [salesData, setSalesData] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [peakHours, setPeakHours] = useState({});

  // Simulação de dados (substitua pela API real)
  const mockFinancialSummary = {
    currentPeriod: {
      totalRevenue: 15750.80,
      totalOrders: 127,
      averageOrderValue: 124.02,
      totalDeliveryFees: 1270.00,
      totalDiscounts: 890.50,
      totalItems: 342
    },
    growth: {
      revenueGrowth: 15.3,
      orderGrowth: 8.7
    }
  };

  const mockSalesData = [
    { _id: { day: 10, month: 6 }, totalRevenue: 1250.00, orderCount: 12 },
    { _id: { day: 11, month: 6 }, totalRevenue: 1850.50, orderCount: 18 },
    { _id: { day: 12, month: 6 }, totalRevenue: 2100.80, orderCount: 21 },
    { _id: { day: 13, month: 6 }, totalRevenue: 1675.30, orderCount: 15 },
    { _id: { day: 14, month: 6 }, totalRevenue: 2350.90, orderCount: 25 },
    { _id: { day: 15, month: 6 }, totalRevenue: 2890.40, orderCount: 28 }
  ];

  const mockTopProducts = [
    { productName: 'Pizza Margherita', totalQuantity: 45, totalRevenue: 1350.00, orderCount: 15 },
    { productName: 'Hambúrguer Artesanal', totalQuantity: 38, totalRevenue: 1140.00, orderCount: 12 },
    { productName: 'Lasanha Bolonhesa', totalQuantity: 32, totalRevenue: 960.00, orderCount: 10 },
    { productName: 'Sushi Combo', totalQuantity: 28, totalRevenue: 1120.00, orderCount: 8 },
    { productName: 'Salada Caesar', totalQuantity: 25, totalRevenue: 625.00, orderCount: 9 }
  ];

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setFinancialSummary(mockFinancialSummary);
      setSalesData(mockSalesData);
      setTopProducts(mockTopProducts);
      setLoading(false);
    }, 1000);
  }, [dateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateObj) => {
    if (dateObj.day && dateObj.month) {
      return `${dateObj.day}/${dateObj.month}`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-gray-600">Análise completa de vendas e faturamento</p>
        </div>
        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Faturamento Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialSummary.currentPeriod?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-green-600">
                ↗️ +{financialSummary.growth?.revenueGrowth || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {financialSummary.currentPeriod?.totalOrders || 0}
              </p>
              <p className="text-sm text-blue-600">
                ↗️ +{financialSummary.growth?.orderGrowth || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialSummary.currentPeriod?.averageOrderValue || 0)}
              </p>
              <p className="text-sm text-purple-600">Média por pedido</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Descontos</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialSummary.currentPeriod?.totalDiscounts || 0)}
              </p>
              <p className="text-sm text-orange-600">Em cupons aplicados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'sales', label: '📈 Vendas', icon: '📈' },
              { id: 'products', label: '🛍️ Produtos', icon: '🛍️' },
              { id: 'hours', label: '⏰ Horários', icon: '⏰' },
              { id: 'fiscal', label: '📋 Fiscal', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Vendas */}
          {activeTab === 'sales' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Vendas por Dia</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.map((day, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(day._id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {day.orderCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(day.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(day.totalRevenue / day.orderCount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Produtos */}
          {activeTab === 'products' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Produtos Mais Vendidos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.totalQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.orderCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Horários */}
          {activeTab === 'hours' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Análise de Horários de Pico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Horários com Mais Pedidos</h4>
                  <div className="space-y-2">
                    {['18:00-19:00', '19:00-20:00', '20:00-21:00'].map((hour, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{hour}</span>
                        <span className="font-medium">{25 - index * 3} pedidos</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Dias da Semana</h4>
                  <div className="space-y-2">
                    {['Sexta-feira', 'Sábado', 'Domingo'].map((day, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{day}</span>
                        <span className="font-medium">{formatCurrency(2500 - index * 200)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Fiscal */}
          {activeTab === 'fiscal' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Relatório Fiscal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo Mensal</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Faturamento Bruto:</span>
                      <span className="font-medium">{formatCurrency(15750.80)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impostos Estimados:</span>
                      <span className="font-medium">{formatCurrency(2362.62)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Faturamento Líquido:</span>
                      <span className="font-medium">{formatCurrency(13388.18)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Para o Contador</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Receita de vendas: {formatCurrency(14480.80)}</p>
                    <p>• Taxa de entrega: {formatCurrency(1270.00)}</p>
                    <p>• ICMS estimado: {formatCurrency(2006.54)}</p>
                    <p>• ISS estimado: {formatCurrency(63.50)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
