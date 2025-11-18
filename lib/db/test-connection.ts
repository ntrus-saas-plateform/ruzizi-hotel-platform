/**
 * Test database connection
 * Run this script to verify MongoDB connection
 * Usage: npx tsx lib/db/test-connection.ts
 */

import { connectDB, disconnectDB, getConnectionState } from './connection';

async function testConnection() {
  try {
    // Test connection
    await connectDB();

    // Test basic operations
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('✅ Database connected successfully (no collections yet)');
    } else {
      console.log(`✅ Database connected successfully (${collections.length} collections found)`);
      collections.forEach((col: any) => {
        console.log(`  - ${col.name}`);
      });
    }

    // Disconnect
    await disconnectDB();
    console.log('✅ Database connection test completed successfully');
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
