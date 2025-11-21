// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = (url) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(url, {
      transports: ["websocket"], // server hanya websocket
      path: "/socket.io", // WAJIB! supaya namespace cocok
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false, // jangan double socket
      autoConnect: true
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [url]);

  return socketRef;
};
