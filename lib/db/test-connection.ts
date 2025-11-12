/**
 * Test database connection
 * Run this script to verify MongoDB connection
 * Usage: npx tsx lib/db/test-connection.ts
 */

import { connectDB, disconnectDB, getConnectionState } from './connection';

async function testConnection() {
  try {
    console.log('🧪 Testing MongoDB connection...\n');

    // Test connection
    console.log('📡 Connecting to MongoDB...');
    await connectDB();

    console.log(`✅ Connection state: ${getConnectionState()}\n`);

    // Test basic operations
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('📊 Available collections:');
    if (collections.length === 0) {
      console.log('  (No collections yet - this is normal for a new database)');
    } else {
      collections.forEach((col: any) => {
        console.log(`  - ${col.name}`);
      });
    }

    console.log('\n✅ Database connection test successful!');

    // Disconnect
    await disconnectDB();
    console.log(`\n📡 Final connection state: ${getConnectionState()}`);
  } catch (error) {
    console.error('\n❌ Database connection test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection();
}

export default testConnection;
