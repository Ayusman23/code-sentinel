const mongoose = require('mongoose');
const config = require('./index');

let isConnected = false;

// In-memory fallback stores for offline/local standalone mode
const inMemoryStore = {
  reviews: new Map(),
  auditLogs: [],
  repoHealth: new Map()
};

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed: ${error.message}. Running in Hybrid In-Memory Store Mode.`);
    isConnected = false;
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  type: isConnected ? 'MongoDB Atlas' : 'In-Memory Enterprise Cache',
  uri: config.mongoUri
});

module.exports = {
  connectDB,
  getDBStatus,
  inMemoryStore
};
