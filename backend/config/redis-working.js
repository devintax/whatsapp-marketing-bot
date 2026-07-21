const redis = require('redis');

const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number(process.env.REDIS_DB || 0),
  tls: String(process.env.REDIS_TLS || 'false').toLowerCase() === 'true',
  connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 5000),
  commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT_MS || 3000),
  maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES || 2),
  disableOfflineQueue: String(process.env.REDIS_DISABLE_OFFLINE_QUEUE || 'true').toLowerCase() === 'true',
};

let redisClient = null;
let connectionState = 'disconnected';

const safeRedisUrl = (url) => url.replace(/\/\/[^@]+@/, '//***@');

const connectRedis = async (timeoutMs = 6000) => new Promise(async (resolve) => {
  const timeout = setTimeout(() => {
    console.log('Redis connection timeout - using memory fallback');
    connectionState = 'timeout';
    resolve(null);
  }, timeoutMs);

  try {
    console.log(`Connecting to Redis at ${safeRedisUrl(REDIS_CONFIG.url)}...`);

    redisClient = redis.createClient({
      url: REDIS_CONFIG.url,
      username: REDIS_CONFIG.username,
      password: REDIS_CONFIG.password,
      database: REDIS_CONFIG.database,
      socket: {
        connectTimeout: REDIS_CONFIG.connectTimeout,
        commandTimeout: REDIS_CONFIG.commandTimeout,
        tls: REDIS_CONFIG.tls,
        rejectUnauthorized: false,
      },
      maxRetriesPerRequest: REDIS_CONFIG.maxRetriesPerRequest,
      disableOfflineQueue: REDIS_CONFIG.disableOfflineQueue,
    });

    redisClient.on('ready', () => {
      console.log('Redis connected and ready');
      connectionState = 'ready';
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      connectionState = 'error';
    });

    redisClient.on('end', () => {
      console.log('Redis connection ended');
      connectionState = 'disconnected';
    });

    await redisClient.connect();
    await redisClient.ping();

    clearTimeout(timeout);
    connectionState = 'connected';
    console.log('Redis connection verified');
    resolve(redisClient);
  } catch (error) {
    clearTimeout(timeout);
    console.error('Redis connection failed:', error.message);
    connectionState = 'failed';
    resolve(null);
  }
});

const disconnectRedis = async () => {
  if (redisClient && connectionState !== 'disconnected') {
    try {
      await redisClient.quit();
      console.log('Redis disconnected gracefully');
    } catch (error) {
      console.error('Redis disconnect error:', error.message);
    }
    connectionState = 'disconnected';
  }
};

const getRedisClient = () => redisClient;
const isRedisConnected = () => redisClient && connectionState === 'connected' && redisClient.isReady;
const getConnectionState = () => connectionState;

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
  getConnectionState,
  REDIS_CONFIG,
};
