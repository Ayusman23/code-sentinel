import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [triageEvents, setTriageEvents] = useState([]);
  const [latestAuditLogs, setLatestAuditLogs] = useState([]);
  const [activePipelineJob, setActivePipelineJob] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to CodeSentinel live telemetry feed');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from telemetry feed');
    });

    newSocket.on('pr:triage:progress', (eventData) => {
      setActivePipelineJob(eventData);
      setTriageEvents((prev) => [eventData, ...prev.slice(0, 49)]);
    });

    newSocket.on('telemetry:audit:log', (log) => {
      setLatestAuditLogs((prev) => [log, ...prev.slice(0, 99)]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        triageEvents,
        latestAuditLogs,
        activePipelineJob,
        setActivePipelineJob
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
