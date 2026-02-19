import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const socket = new SockJS(import.meta.env.VITE_WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebSocket Connected');
      setConnected(true);
      setStompClient(client);
    };

    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
      setConnected(false);
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, [user, token]);

  const subscribe = (destination, callback) => {
    if (stompClient && connected) {
      return stompClient.subscribe(destination, callback);
    }
    return null;
  };

  const send = (destination, body) => {
    if (stompClient && connected) {
      stompClient.publish({ destination, body: JSON.stringify(body) });
    }
  };

  const value = { stompClient, connected, subscribe, send };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
};
