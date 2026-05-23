import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
  }
  return socket;
};
