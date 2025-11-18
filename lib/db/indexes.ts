import mongoose from 'mongoose';

/**
 * Index configuration for MongoDB collections
 * This ensures optimal query performance
 */

export interface IndexDefinition {
  collection: string;
  indexes: Array<{
    fields: Record<string, 1 | -1 | 'text'>;
    options?: mongoose.IndexOptions;
  }>;
}

/**
 * Define all indexes for the application
 * These will be created when the application starts
 */
export const indexDefinitions: IndexDefinition[] = [
  // User indexes
  {
    collection: 'users',
    indexes: [
      {
        fields: { email: 1 },
        options: { unique: true },
      },
      {
        fields: { role: 1 },
      },
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { isActive: 1 },
      },
    ],
  },

  // Establishment indexes
  {
    collection: 'establishments',
    indexes: [
      {
        fields: { name: 1 },
      },
      {
        fields: { 'location.city': 1 },
      },
      {
        fields: { isActive: 1 },
      },
      {
        fields: { managerId: 1 },
      },
    ],
  },

  // Accommodation indexes
  {
    collection: 'accommodations',
    indexes: [
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { status: 1 },
      },
      {
        fields: { type: 1 },
      },
      {
        fields: { pricingMode: 1 },
      },
      {
        fields: { establishmentId: 1, status: 1 },
      },
    ],
  },

  // Booking indexes
  {
    collection: 'bookings',
    indexes: [
      {
        fields: { bookingCode: 1 },
        options: { unique: true },
      },
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { accommodationId: 1 },
      },
      {
        fields: { status: 1 },
      },
      {
        fields: { checkIn: 1 },
      },
      {
        fields: { checkOut: 1 },
      },
      {
        fields: { 'clientInfo.email': 1 },
      },
      {
        fields: { createdAt: -1 },
      },
      {
        fields: { establishmentId: 1, status: 1, checkIn: 1 },
      },
      {
        fields: { establishmentId: 1, createdAt: -1 },
      },
      {
        fields: { accommodationId: 1, checkIn: 1, checkOut: 1 },
      },
      {
        fields: { 'clientInfo.email': 1, status: 1 },
      },
      {
        fields: { bookingType: 1, status: 1, checkIn: 1 },
      },
    ],
  },

  // Invoice indexes
  {
    collection: 'invoices',
    indexes: [
      {
        fields: { invoiceNumber: 1 },
        options: { unique: true },
      },
      {
        fields: { bookingId: 1 },
      },
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { status: 1 },
      },
      {
        fields: { issuedAt: -1 },
      },
      {
        fields: { 'clientInfo.email': 1 },
      },
    ],
  },

  // Expense indexes
  {
    collection: 'expenses',
    indexes: [
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { category: 1 },
      },
      {
        fields: { date: -1 },
      },
      {
        fields: { establishmentId: 1, date: -1 },
      },
      {
        fields: { establishmentId: 1, category: 1 },
      },
    ],
  },

  // Employee indexes
  {
    collection: 'employees',
    indexes: [
      {
        fields: { employeeNumber: 1 },
        options: { unique: true },
      },
      {
        fields: { 'employment.establishmentId': 1 },
      },
      {
        fields: { 'personalInfo.email': 1 },
        options: { sparse: true },
      },
      {
        fields: { isActive: 1 },
      },
      {
        fields: { userId: 1 },
        options: { sparse: true },
      },
    ],
  },

  // Attendance indexes
  {
    collection: 'attendances',
    indexes: [
      {
        fields: { employeeId: 1 },
      },
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { date: -1 },
      },
      {
        fields: { status: 1 },
      },
      {
        fields: { employeeId: 1, date: -1 },
      },
      {
        fields: { establishmentId: 1, date: -1 },
      },
    ],
  },

  // Shift indexes
  {
    collection: 'shifts',
    indexes: [
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { isActive: 1 },
      },
    ],
  },

  // Payroll indexes
  {
    collection: 'payrolls',
    indexes: [
      {
        fields: { employeeId: 1 },
      },
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { 'period.year': 1, 'period.month': 1 },
      },
      {
        fields: { status: 1 },
      },
      {
        fields: { employeeId: 1, 'period.year': 1, 'period.month': 1 },
        options: { unique: true },
      },
    ],
  },

  // Leave indexes
  {
    collection: 'leaves',
    indexes: [
      {
        fields: { employeeId: 1 },
      },
      {
        fields: { establishmentId: 1 },
      },
      {
        fields: { status: 1 },
      },
      {
        fields: { startDate: 1 },
      },
      {
        fields: { type: 1 },
      },
      {
        fields: { employeeId: 1, status: 1 },
      },
    ],
  },

  // Client indexes
  {
    collection: 'clients',
    indexes: [
      {
        fields: { 'personalInfo.email': 1 },
        options: { unique: true, sparse: true },
      },
      {
        fields: { 'personalInfo.phone': 1 },
      },
      {
        fields: { classification: 1 },
      },
      {
        fields: { totalStays: -1 },
      },
    ],
  },
];

/**
 * Create all indexes defined in indexDefinitions
 * This should be called once when the application starts
 */
export async function createIndexes(): Promise<void> {
  try {
    console.log('📊 Creating MongoDB indexes...');

    for (const definition of indexDefinitions) {
      const collection = mongoose.connection.collection(definition.collection);

      for (const index of definition.indexes) {
        try {
          await collection.createIndex(index.fields, index.options as any);
          console.log(
            `✅ Index created for ${definition.collection}:`,
            JSON.stringify(index.fields)
          );
        } catch (error) {
          // Index might already exist, which is fine
          if (error instanceof Error && !error.message.includes('already exists')) {
            console.error(
              `❌ Error creating index for ${definition.collection}:`,
              error.message
            );
          }
        }
      }
    }

    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

/**
 * Drop all indexes (useful for testing or migrations)
 * WARNING: This will drop all indexes except _id
 */
export async function dropAllIndexes(): Promise<void> {
  try {
    console.log('🗑️  Dropping all indexes...');

    for (const definition of indexDefinitions) {
      const collection = mongoose.connection.collection(definition.collection);
      try {
        await collection.dropIndexes();
        console.log(`✅ Indexes dropped for ${definition.collection}`);
      } catch (error) {
        // Collection might not exist yet
        if (error instanceof Error && !error.message.includes('ns not found')) {
          console.error(`❌ Error dropping indexes for ${definition.collection}:`, error.message);
        }
      }
    }

    console.log('✅ All indexes dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
}
