'use client';

import { useEffect, useRef } from 'react';

interface OrderStatusUpdate {
  orderId: string;
  status: string;
  timestamp: string;
}

export const useOrderSocket = (
  orderId: string,
  onStatusUpdate: (update: OrderStatusUpdate) => void
) => {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!orderId) return;

    // Initialize socket connection
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

        // Subscribe to order updates
        socketRef.current.emit('subscribe_order', orderId);

        // Listen for status updates
        socketRef.current.on('order_status_update', (update: OrderStatusUpdate) => {
          onStatusUpdate(update);
        });

        // Handle connection events
        socketRef.current.on('connect', () => {
          console.log('Connected to WebSocket server');
          socketRef.current.emit('subscribe_order', orderId);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from WebSocket server');
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe_order', orderId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId, onStatusUpdate]);

  return socketRef.current;
};