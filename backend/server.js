const cron = require('node-cron');
const {
  fetchAccessToken,
  refreshAccessToken,
  getValidAccessToken,
  setTokens,
  getTokens,
  syncMauticContactsWithToken,
} = require('./services/mauticContactSync');


require('dotenv').config();


const MAUTIC_WEBHOOK_SECRET = process.env.MAUTIC_WEBHOOK_SECRET || 'dd5cff2d5cdb76c01a9e120268ec736a7b522c38ee2aae6820cae4a3f3bf1ed6';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectRedis } = require('./config/redis-working');
const redisService = require('./services/redisService');
const { uploadRoot } = require('./utils/mediaUrl');
const { environmentCheck, externalDomainErrorHandler, checkNetworkConnectivity } = require('./middleware/environmentCheck');
require('dotenv').config();

const app = express();

const splitEnvList = (value) => (value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const publicBaseUrl = process.env.BOT_PUBLIC_URL || process.env.PUBLIC_BASE_URL || 'https://bot.dfgworld.net';
const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://10.0.0.181:3000',
  'http://10.0.0.181:8080',
  'https://connect.vemgootech.info:3000',
  'https://connect.vemgootech.info:5000',
  'https://connect.vemgootech.info',
  'https://api.vemgootech.info',
  'http://connect.vemgootech.info:3000',
  'http://connect.vemgootech.info:5000',
  'http://connect.vemgootech.info',
  publicBaseUrl,
  process.env.FRONTEND_URL,
  ...splitEnvList(process.env.ADDITIONAL_CORS_ORIGINS)
].filter(Boolean);

// Webhook endpoint for Mautic contact sync
app.post('/webhook/mautic-contact', async (req, res) => {
  try {
    // Validate secret from header or body
    const secret = req.headers['x-webhook-secret'] || req.body.secret;
    if (secret !== MAUTIC_WEBHOOK_SECRET) {
      console.warn('[Webhook] Invalid secret received:', secret);
      return res.status(403).json({ error: 'Forbidden: Invalid webhook secret.' });
    }
    const accessToken = await getValidAccessToken();
    const imported = await syncMauticContactsWithToken(accessToken);
    res.json({ success: true, imported });
  } catch (err) {
    console.error('[Webhook] Mautic contact sync error:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Webhook sync failed', details: err.response ? err.response.data : err.message });
  }
});

// Schedule: every hour at minute 5 (change as needed)
cron.schedule('5 * * * *', async () => {
  try {
    // You must provide a valid OAuth2 code for unattended automation (see note below)
    const code = process.env.MAUTIC_OAUTH_CODE;
    if (!code) {
      console.log('[Mautic Sync] Skipped: No MAUTIC_OAUTH_CODE set in env.');
      return;
    }
    const accessToken = await fetchAccessToken(code);
    const imported = await syncMauticContactsWithToken(accessToken);
    console.log(`[Mautic Sync] Imported/updated ${imported} contacts.`);
  } catch (err) {
    console.error('[Mautic Sync] Error:', err.response ? err.response.data : err.message);
  }
});

// Initialize Redis connection safely (with timeout protection)
async function initializeRedis() {
  try {
    console.log('Initializing Redis connection...');
    await connectRedis();
    await redisService.initialize();
    console.log('Redis initialization completed successfully');
  } catch (error) {
    console.log('Redis initialization failed - using memory fallback');
    console.log('Application will continue without Redis caching');
  }
}

// Start Redis initialization in background (non-blocking)
initializeRedis();

// Trust proxy settings for Cloudflare (temporarily disabled to prevent restart loops)
// app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for external domain access
}));

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Client-Domain']
}));

// Allow all host headers for external domain access
app.use((req, res, next) => {
  // Allow your domain specifically
  const allowedHosts = [
    'localhost',
    '127.0.0.1', 
    '10.0.0.181',
    'bot.dfgworld.net',
    'connect.vemgootech.info',
    'api.vemgootech.info',
    ...splitEnvList(process.env.ADDITIONAL_ALLOWED_HOSTS)
  ];
  
  const host = req.get('host');
  const origin = req.get('origin');
  const userAgent = req.get('user-agent');
  
  // Enhanced logging for debugging external domain issues
  console.log(`🌐 REQUEST: ${req.method} ${req.url}`);
  console.log(`📍 Host: ${host}, Origin: ${origin}`);
  console.log(`🔐 Auth Header: ${req.get('authorization') ? 'Present' : 'Missing'}`);
  
  if (host && allowedHosts.some(allowed => host.includes(allowed))) {
    console.log(`✅ Accepted request from host: ${host}`);
  } else {
    console.log(`⚠️  Request from unknown host: ${host}`);
  }
  
  // Set additional security headers for external domain
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Set appropriate origin based on request
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (host && host.includes('localhost')) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  } else {
    res.header('Access-Control-Allow-Origin', publicBaseUrl);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✈️  Handling preflight request');
    return res.status(200).end();
  }
  
  next();
});

// External domain security middleware
const externalDomainSecurity = require('./middleware/externalDomainSecurity');
app.use(externalDomainSecurity);

// Rate limiting - TEMPORARILY DISABLED to prevent restart loops
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 200, // limit each IP to 200 requests per minute
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   // Configure for proxy environment (Cloudflare)
//   trustProxy: true,
//   skipSuccessfulRequests: false,
//   skipFailedRequests: false,
//   // Use X-Forwarded-For header for Cloudflare
//   keyGenerator: (req) => {
//     return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.connection.remoteAddress;
//   }
// });
// app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Environment detection middleware
app.use(environmentCheck);

// Static files. /uploads is kept for backward compatibility; /media is the local CDN path.
const staticUploadRoot = uploadRoot();
const mediaCacheMaxAge = process.env.MEDIA_CACHE_MAX_AGE || '1d';
app.use('/uploads', express.static(staticUploadRoot, { maxAge: mediaCacheMaxAge }));
app.use('/media', express.static(staticUploadRoot, {
  maxAge: mediaCacheMaxAge,
  immutable: process.env.NODE_ENV === 'production'
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_marketing_bot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  // Initialize Auto-Sync Service after database connection
  try {
    const autoSyncService = require('./services/autoSyncService');
    await autoSyncService.initialize();
    console.log('🔄 Auto-Sync Service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Auto-Sync Service:', error);
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile')); // User profile routes
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/business', require('./routes/business'));
app.use('/api/business-data', require('./routes/businessData'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/channels', require('./routes/channels'));

// OAuth2 auth routes for external integrations
app.use('/api/crm', require('./routes/crm'));
app.use('/api/test', require('./routes/test-import'));
app.use('/api/fix', require('./routes/fix'));

// Routes (with auth middleware applied)
app.use('/api/auth', require('./routes/crm')); // Temporarily using CRM routes for auth

app.use('/webhook', require('./routes/webhook'));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    external_domain: publicBaseUrl,
    cors_enabled: true,
    redis: redisService.getConnectionStatus(),
    media: {
      publicBaseUrl: process.env.MEDIA_PUBLIC_URL || process.env.CDN_BASE_URL || null,
      localPath: staticUploadRoot
    }
  });
});

// Error handling middleware
app.use(externalDomainErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// 📊 Socket.io setup for real-time analytics
const http = require('http');
const socketIo = require('socket.io');

// Enhanced server startup with network checks and Socket.io
async function startServer() {
  try {
    console.log('🔧 Starting server initialization...');
    
    // Check network connectivity
    const networkOk = await checkNetworkConnectivity();
    if (!networkOk) {
      console.log('⚠️  Network connectivity issues detected - some features may not work');
    }
    
    // Create HTTP server with Socket.io
    const server = http.createServer(app);
    const io = socketIo(server, {
      cors: {
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST']
      }
    });
    
    // Initialize Real-Time Analytics Service
    try {
      const RealTimeAnalyticsService = require('./services/realTimeAnalyticsService');
      await RealTimeAnalyticsService.initialize(io);
      console.log('📊 Real-Time Analytics Service initialized with Socket.io');
    } catch (error) {
      console.error('❌ Real-Time Analytics Service initialization failed:', error);
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server accessible via:`);
      console.log(`   - Local: http://localhost:${PORT}`);
      console.log(`   - Network: http://0.0.0.0:${PORT}`);
      console.log(`   - External: ${publicBaseUrl}`);
      console.log(`📊 Real-time analytics available via Socket.io`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
const serverPromise = startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redisService.disconnect();
  const server = await serverPromise;
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    if (redisService && typeof redisService.disconnect === 'function') {
      await redisService.disconnect();
    }
  } catch (error) {
    console.log('Redis disconnect error:', error.message);
  }
  const server = await serverPromise;
  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle uncaught exceptions (like EBUSY errors from WhatsApp session files)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  
  // Don't exit on EBUSY errors - these are recoverable
  if (error.message && error.message.includes('EBUSY')) {
    console.log('⚠️ File lock error detected - continuing operation...');
    return;
  }
  
  // For other critical errors, log and continue
  console.log('⚠️ Server continuing despite error...');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  
  // Don't exit - log and continue
  console.log('⚠️ Server continuing despite unhandled rejection...');
});

module.exports = app;
