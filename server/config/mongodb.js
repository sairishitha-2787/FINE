const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

const connectMongoDB = async () => {
  try {
    if (isConnected) {
      logger.info('📊 MongoDB already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fine_insights';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    isConnected = true;
    logger.info('✅ MongoDB connected successfully');
    
    // Connection event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    isConnected = false;
    throw error;
  }
};

const disconnectMongoDB = async () => {
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('🔌 MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
    throw error;
  }
};

const getConnectionStatus = () => isConnected;

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  getConnectionStatus
};
