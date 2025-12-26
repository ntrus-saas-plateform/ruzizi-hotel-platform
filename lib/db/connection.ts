import mongoose from 'mongoose';

// Type for the global mongoose connection
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Extend the global object to include mongoose
declare global {
     
    var mongoose: MongooseCache;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI || MONGODB_URI.length === 0) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose
 * Uses a singleton pattern to reuse the connection
 * @returns Promise<typeof mongoose>
 */
async function connectDB(): Promise<typeof mongoose> {
    if (!cached) {
        cached = global.mongoose = { conn: null, promise: null };
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10, // Reduced for development
            minPoolSize: 2, // Reduced for development
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            socketTimeoutMS: 45000, // Socket timeout
            serverSelectionTimeoutMS: 5000, // Server selection timeout
            connectTimeoutMS: 10000, // Connection timeout
            heartbeatFrequencyMS: 10000, // Check server health every 10 seconds
            family: 4, // Prefer IPv4 connections
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }

    return cached.conn;
}

/**
 * Disconnect from MongoDB
 * Useful for cleanup in tests or serverless functions
 */
async function disconnectDB(): Promise<void> {
    if (!cached) {
        return;
    }

    if (cached.conn) {
        await cached.conn.disconnect();
        cached.conn = null;
        cached.promise = null;
        }
}

/**
 * Check if MongoDB is connected
 * @returns boolean
 */
function isConnected(): boolean {
    return mongoose.connection.readyState === 1;
}

/**
 * Get the current connection state
 * @returns string - 'disconnected' | 'connected' | 'connecting' | 'disconnecting'
 */
function getConnectionState(): string {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return states[mongoose.connection.readyState] || 'unknown';
}

export { connectDB, disconnectDB, isConnected, getConnectionState };
export default connectDB;
