import { Server } from 'socket.io';

export let io: Server | null = null;

export const setIO = (server: Server) => {
  io = server;
};
