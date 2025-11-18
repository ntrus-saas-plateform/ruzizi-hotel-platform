import { connectDB } from './connection';
import { createIndexes } from './indexes';

/**
 * Initialize the database connection and create indexes
 * This should be called once when the application starts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create indexes
    await createIndexes();

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
    });

  mongoose.connection.on('error', (err: Error) => {
    console.error('❌ Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    });

  // Handle process termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}
