import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle order status subscription
    socket.on('subscribe_order', (orderId: string) => {
      socket.join(`order_${orderId}`);
      console.log(`Client ${socket.id} subscribed to order ${orderId}`);
    });

    // Handle order status unsubscription
    socket.on('unsubscribe_order', (orderId: string) => {
      socket.leave(`order_${orderId}`);
      console.log(`Client ${socket.id} unsubscribed from order ${orderId}`);
    });

    // Handle messages (legacy)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Function to emit order status updates
export const emitOrderStatusUpdate = (io: Server, orderId: string, status: string) => {
  io.to(`order_${orderId}`).emit('order_status_update', {
    orderId,
    status,
    timestamp: new Date().toISOString(),
  });
};