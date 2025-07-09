import React, { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useSocketStatus } from '../../hooks/useSocket';

const NotificationSystem = () => {
  const { socket, isConnected } = useSocketStatus();

  // ✅ Solicitar permissão para notificações do browser
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
      });
    }
  }, []);

  // ✅ Configurar todos os listeners de notificação
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Função helper para notificações do browser
    const showBrowserNotification = (title, options = {}) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
          });
        } catch (error) {
          console.warn('Erro ao mostrar notificação:', error);
        }
      }
    };

    // Função helper para tocar som
    const playNotificationSound = () => {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignorar erro se não conseguir tocar (autoplay policies)
        });
      } catch (error) {
        // Som não é crítico
      }
    };

    // 🆕 Novo pedido
    const handleNewOrder = (order) => {
      const orderNumber = order.orderNumber || order._id?.slice(-6) || 'N/A';
      const customerName = order.customerName || 'Cliente';
      
      toast.success(
        `🆕 Novo pedido: #${orderNumber} - ${customerName}`,
        {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      );

      showBrowserNotification('Novo Pedido!', {
        body: `Pedido #${orderNumber} de ${customerName}`,
        tag: 'new-order'
      });

      playNotificationSound();
    };

    // 🔄 Mudança de status
    const handleStatusChange = (data) => {
      const orderNumber = data.orderId?.slice(-6) || 'N/A';
      const statusLabel = data.newStatus?.replace('_', ' ') || 'desconhecido';
      
      toast.info(
        `📋 Pedido #${orderNumber} → ${statusLabel}`,
        {
          duration: 3000,
          position: 'top-right'
        }
      );
    };

    // 💬 Nova observação
    const handleNewObservation = (data) => {
      const orderNumber = data.orderId?.slice(-6) || 'N/A';
      
      toast(
        `💬 Nova observação no pedido #${orderNumber}`,
        {
          duration: 3000,
          position: 'top-right',
          icon: '💬'
        }
      );
    };

    // ⚠️ Alertas importantes (pedidos atrasados, etc.)
    const handleOrderAlert = (alert) => {
      toast.error(
        `⚠️ ${alert.message}`,
        {
          duration: 8000,
          position: 'top-center',
          style: {
            background: '#EF4444',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      );

      showBrowserNotification('Alerta de Pedido!', {
        body: alert.message,
        tag: 'order-alert'
      });
    };

    // 🔗 Registrar todos os listeners
    socket.on('new-order', handleNewOrder);
    socket.on('status-changed', handleStatusChange);
    socket.on('new-observation', handleNewObservation);
    socket.on('order-alert', handleOrderAlert);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('status-changed', handleStatusChange);
      socket.off('new-observation', handleNewObservation);
      socket.off('order-alert', handleOrderAlert);
    };
  }, [socket, isConnected]);

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          maxWidth: '500px'
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff'
          }
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff'
          }
        }
      }}
    />
  );
};

export default NotificationSystem;
