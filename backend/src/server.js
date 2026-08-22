const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { connectDB } = require('./config/database');
const { seedInitialData } = require('./config/seedData');
const { initSocket } = require('./services/socketService');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
initSocket(io);

// Security & Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));

// Rate limiter for API protection
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded. Please retry shortly.' }
});
app.use('/api/', limiter);

// Express Raw Body capture for cryptographic HMAC SHA-256 verification
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Root & Health Check Endpoints (for Render uptime & health probes)
app.get('/', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    service: 'CodeSentinel Control Plane Ingestion Gateway',
    version: '2.0.0 Enterprise Zero-Trust',
    environment: config.nodeEnv,
    aiEngineUrl: config.aiEngineUrl,
    health: '/health',
    api: '/api/metrics'
  });
});

app.head('/', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CodeSentinel Ingestion Gateway (Control Plane)',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/stats', metricsRoutes);
app.use('/api/audit', auditRoutes);

// Centralized error handler
app.use(errorHandler);

// Connect DB and start HTTP server
const PORT = config.port;
server.listen(PORT, async () => {
  await connectDB();
  await seedInitialData();
  console.log(`=======================================================`);
  console.log(`🛡️  CodeSentinel Control Plane Ingestion Gateway Ready!`);
  console.log(`🚀 Gateway Server running on: http://localhost:${PORT}`);
  console.log(`📡 WebSocket Telemetry Gateway: Active`);
  console.log(`🤖 AI Engine Worker URL: ${config.aiEngineUrl}`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
