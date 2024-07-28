import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initializeSocket = (url: string) => {
  socket = io(url);
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};