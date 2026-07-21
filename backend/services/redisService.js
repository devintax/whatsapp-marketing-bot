const { getRedisClient, isRedisConnected } = require('../config/redis-working');

class RedisService {
  constructor() {
    this.client = null;
    this.fallbackStorage = new Map(); // In-memory fallback
  }

  async initialize() {
    try {
      this.client = getRedisClient();
      if (this.client && isRedisConnected()) {
        console.log('RedisService initialized with Redis connection');
        return true;
      } else {
        console.log('⚠️  RedisService using in-memory fallback storage');
        return false;
      }
    } catch (error) {
      console.error('❌ RedisService initialization error:', error.message);
      console.log('📝 Using in-memory fallback storage');
      return false;
    }
  }

  async set(key, value, expireInSeconds = null) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (this.client && isRedisConnected()) {
        if (expireInSeconds) {
          await this.client.setEx(key, expireInSeconds, stringValue);
        } else {
          await this.client.set(key, stringValue);
        }
        console.log(`📝 Redis SET: ${key}`);
      } else {
        // Fallback to in-memory storage
        this.fallbackStorage.set(key, {
          value: stringValue,
          expires: expireInSeconds ? Date.now() + (expireInSeconds * 1000) : null
        });
        console.log(`💾 Memory SET: ${key}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error.message);
      // Fallback to memory
      this.fallbackStorage.set(key, {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        expires: expireInSeconds ? Date.now() + (expireInSeconds * 1000) : null
      });
      return false;
    }
  }

  async get(key) {
    try {
      if (this.client && isRedisConnected()) {
        const value = await this.client.get(key);
        console.log(`📖 Redis GET: ${key} = ${value ? 'found' : 'not found'}`);
        return value;
      } else {
        // Fallback to in-memory storage
        const item = this.fallbackStorage.get(key);
        if (item) {
          if (item.expires && Date.now() > item.expires) {
            this.fallbackStorage.delete(key);
            console.log(`🗑️ Memory expired: ${key}`);
            return null;
          }
          console.log(`💾 Memory GET: ${key} = found`);
          return item.value;
        }
        console.log(`💾 Memory GET: ${key} = not found`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error.message);
      // Try fallback
      const item = this.fallbackStorage.get(key);
      return item && (!item.expires || Date.now() <= item.expires) ? item.value : null;
    }
  }

  async del(key) {
    try {
      if (this.client && isRedisConnected()) {
        const result = await this.client.del(key);
        console.log(`🗑️ Redis DEL: ${key}`);
        return result;
      } else {
        // Fallback to in-memory storage
        const deleted = this.fallbackStorage.delete(key);
        console.log(`🗑️ Memory DEL: ${key}`);
        return deleted ? 1 : 0;
      }
    } catch (error) {
      console.error(`❌ Redis DEL error for key ${key}:`, error.message);
      return this.fallbackStorage.delete(key) ? 1 : 0;
    }
  }

  async exists(key) {
    try {
      if (this.client && isRedisConnected()) {
        const exists = await this.client.exists(key);
        console.log(`🔍 Redis EXISTS: ${key} = ${exists ? 'yes' : 'no'}`);
        return exists === 1;
      } else {
        // Fallback to in-memory storage
        const item = this.fallbackStorage.get(key);
        const exists = item && (!item.expires || Date.now() <= item.expires);
        console.log(`🔍 Memory EXISTS: ${key} = ${exists ? 'yes' : 'no'}`);
        return exists;
      }
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error.message);
      const item = this.fallbackStorage.get(key);
      return item && (!item.expires || Date.now() <= item.expires);
    }
  }

  async expire(key, seconds) {
    try {
      if (this.client && isRedisConnected()) {
        const result = await this.client.expire(key, seconds);
        console.log(`⏰ Redis EXPIRE: ${key} = ${seconds}s`);
        return result === 1;
      } else {
        // Fallback to in-memory storage
        const item = this.fallbackStorage.get(key);
        if (item) {
          item.expires = Date.now() + (seconds * 1000);
          this.fallbackStorage.set(key, item);
          console.log(`⏰ Memory EXPIRE: ${key} = ${seconds}s`);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error(`❌ Redis EXPIRE error for key ${key}:`, error.message);
      return false;
    }
  }

  isConnected() {
    return this.client && isRedisConnected();
  }

  getConnectionStatus() {
    if (this.client && isRedisConnected()) {
      return 'redis';
    } else {
      return 'memory_fallback';
    }
  }

  // Legacy methods for compatibility
  async connect() {
    return await this.initialize();
  }

  isReady() {
    return this.isConnected();
  }

  // Session management helpers
  async setWhatsAppSession(userId, sessionData) {
    const key = `whatsapp:session:${userId}`;
    return await this.set(key, sessionData, 86400); // 24 hours
  }

  async getWhatsAppSession(userId) {
    const key = `whatsapp:session:${userId}`;
    return await this.get(key);
  }

  async deleteWhatsAppSession(userId) {
    const key = `whatsapp:session:${userId}`;
    return await this.del(key);
  }

  // Campaign management helpers
  async setCampaignStatus(campaignId, status) {
    const key = `campaign:status:${campaignId}`;
    return await this.set(key, status, 3600); // 1 hour
  }

  async getCampaignStatus(campaignId) {
    const key = `campaign:status:${campaignId}`;
    return await this.get(key);
  }

  // Connection status helpers
  async setUserConnectionStatus(userId, status) {
    const key = `whatsapp:connection:${userId}`;
    return await this.set(key, status, 300); // 5 minutes
  }

  async getUserConnectionStatus(userId) {
    const key = `whatsapp:connection:${userId}`;
    return await this.get(key);
  }

  // Legacy aliases for backward compatibility
  async delete(key) {
    return await this.del(key);
  }

  async increment(key, amount = 1) {
    try {
      if (this.client && isRedisConnected()) {
        return await this.client.incrBy(key, amount);
      } else {
        // Fallback to memory
        const current = parseInt(await this.get(key) || '0') + amount;
        await this.set(key, current.toString());
        return current;
      }
    } catch (error) {
      console.error(`❌ Redis INCREMENT error for key ${key}:`, error.message);
      return 0;
    }
  }

  async ping() {
    try {
      if (this.client && isRedisConnected()) {
        const result = await this.client.ping();
        return result === 'PONG';
      }
      return false;
    } catch (error) {
      console.error('❌ Redis PING error:', error.message);
      return false;
    }
  }

  // Rate limiting helper methods
  async rateLimitCheck(key, limit, windowSeconds) {
    try {
      const current = await this.increment(key);
      
      if (current === 1) {
        await this.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;
      const resetTime = Date.now() + windowSeconds * 1000;

      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error('❌ Redis rate limit error:', error.message);
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }
}

module.exports = new RedisService();
