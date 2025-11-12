import { connectDB } from './connection';
import { createIndexes } from './indexes';

/**
 * Initialize the database connection and create indexes
 * This should be called once when the application starts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing database...');

    // Connect to MongoDB
    await connectDB();

    // Create indexes
    await createIndexes();

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Setup database event listeners
 * Useful for monitoring connection status
 */
export function setupDatabaseEventListeners(): void {
  const mongoose = require('mongoose');

  mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err: Error) => {
    console.error('❌ Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('📡 Mongoose disconnected from MongoDB');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('📡 Mongoose connection closed due to app termination');
    process.exit(0);
  });
}
