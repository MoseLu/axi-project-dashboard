import mongoose from 'mongoose';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = config.database.mongodb.uri;
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB disconnected successfully');
  } catch (error) {
    logger.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};
