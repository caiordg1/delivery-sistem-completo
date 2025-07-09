import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext'; // ✅ Usar context existente

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // ✅ Assumindo que AuthContext já existe

  useEffect(() => {
    // Só conectar se usuário estiver logado
    if (!user) {
      console.log('Socket: Usuário não logado, aguardando...');
      return;
    }

    console.log('Socket: Iniciando conexão WebSocket...');
    
    // Detectar URL automaticamente
    const socketURL = process.env.REACT_APP_WEBSOCKET_URL || 
                     process.env.REACT_APP_API_URL || 
                     'http://localhost:3000';

    const newSocket = io(socketURL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Socket: Conectado com sucesso!', newSocket.id);
      // Entrar na sala de administradores
      newSocket.emit('join-admin', user.id || user._id || 'admin');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket: Desconectado -', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('Socket: Erro de conexão (normal em desenvolvimento):', error.message);
      // Não quebrar o sistema se WebSocket falhar
    });

    setSocket(newSocket);

    return () => {
      console.log('Socket: Limpando conexão...');
      newSocket.close();
    };
  }, [user]);

  return socket;
};

// ✅ Hook adicional para verificar conectividade
export const useSocketStatus = () => {
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Estado inicial
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return { socket, isConnected };
};
