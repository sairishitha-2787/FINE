const redis = require('redis');
const logger = require('../utils/logger');

let client;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    client.on('error', (error) => {
      logger.error('❌ Redis client error:', error);
    });

    client.on('connect', () => {
      logger.info('🔄 Redis client connecting...');
    });

    client.on('ready', () => {
      logger.info('✅ Redis client connected and ready');
    });

    client.on('end', () => {
      logger.info('🔌 Redis client disconnected');
    });

    await client.connect();
    
    // Test the connection
    await client.ping();
    logger.info('✅ Redis connected successfully');
    
    return client;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error.message);
    throw error;
  }
};

const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
};

const closeRedis = async () => {
  if (client) {
    await client.quit();
    logger.info('🔌 Redis connection closed');
  }
};

// Cache helper functions
const setCache = async (key, value, expireInSeconds = 3600) => {
  try {
    const redisClient = getRedisClient();
    const serializedValue = JSON.stringify(value);
    await redisClient.setEx(key, expireInSeconds, serializedValue);
    return true;
  } catch (error) {
    logger.error('Error setting cache:', error);
    return false;
  }
};

const getCache = async (key) => {
  try {
    const redisClient = getRedisClient();
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Error getting cache:', error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    const redisClient = getRedisClient();
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Error deleting cache:', error);
    return false;
  }
};

const clearCachePattern = async (pattern) => {
  try {
    const redisClient = getRedisClient();
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Error clearing cache pattern:', error);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  setCache,
  getCache,
  deleteCache,
  clearCachePattern
};
