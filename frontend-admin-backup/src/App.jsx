import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Coupons from './pages/Coupons';
import Loyalty from './pages/Loyalty';
import Logs from './pages/Logs';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Reports from './pages/Reports';
import Satisfaction from './pages/Satisfaction';
import BotManagement from './pages/BotManagement';
import Printers from './pages/Printers';
import Products from './pages/Products';
import Clientes from './pages/Clientes';
import PedidoDetalhes from './components/Pages/PedidoDetalhes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
         <Route
            path="/pedido/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <PedidoDetalhes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <Orders />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coupons"
            element={
              <ProtectedRoute>
                <Layout>
                  <Coupons />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute>
                <Layout>
                  <Loyalty />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <Layout>
                  <Logs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
           <Route
            path="/satisfaction"
            element={
              <ProtectedRoute>
                <Layout>
                  <Satisfaction />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bot-management"
            element={
             <ProtectedRoute>
              <Layout>
                <BotManagement />
              </Layout>
            </ProtectedRoute>
            }
           />
          <Route path="/*" element={<Login />} />
          <Route
  path="/printers"
  element={
    <ProtectedRoute>
      <Layout>
        <Printers />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
