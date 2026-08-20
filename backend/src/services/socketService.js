let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected to live telemetry feed: ${socket.id}`);

    // Welcome telemetry handshake
    socket.emit('telemetry:handshake', {
      connectedAt: new Date().toISOString(),
      service: 'CodeSentinel Telemetry Gateway',
      status: 'ONLINE'
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

const broadcastTriageProgress = (eventData) => {
  if (ioInstance) {
    ioInstance.emit('pr:triage:progress', eventData);
  }
};

const broadcastAuditLog = (auditLog) => {
  if (ioInstance) {
    ioInstance.emit('telemetry:audit:log', auditLog);
  }
};

const broadcastMetricsUpdate = (metrics) => {
  if (ioInstance) {
    ioInstance.emit('metrics:update', metrics);
  }
};

module.exports = {
  initSocket,
  broadcastTriageProgress,
  broadcastAuditLog,
  broadcastMetricsUpdate
};
