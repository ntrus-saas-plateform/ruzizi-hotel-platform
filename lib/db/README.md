# Database Module

This module handles MongoDB connection and database operations using Mongoose.

## Files

- **connection.ts** - MongoDB connection singleton with connection pooling
- **indexes.ts** - Centralized index definitions for all collections
- **init.ts** - Database initialization and event listeners
- **errors.ts** - Custom database error classes
- **utils.ts** - Utility functions for common database operations
- **test-connection.ts** - Script to test database connection

## Usage

### Basic Connection

```typescript
import { connectDB } from '@/lib/db';

// Connect to database
await connectDB();
```

### Initialize Database (with indexes)

```typescript
import { initializeDatabase, setupDatabaseEventListeners } from '@/lib/db';

// Initialize database and create indexes
await initializeDatabase();

// Setup event listeners (optional)
setupDatabaseEventListeners();
```

### Check Connection Status

```typescript
import { isConnected, getConnectionState } from '@/lib/db';

if (isConnected()) {
  console.log('Database is connected');
}

console.log('Connection state:', getConnectionState());
```

### Pagination

```typescript
import { paginate } from '@/lib/db/utils';
import { UserModel } from '@/models/User.model';

const result = await paginate(
  UserModel.find({ isActive: true }),
  {
    page: 1,
    limit: 10,
    sort: { createdAt: -1 }
  }
);

console.log(result.data); // Array of users
console.log(result.pagination); // Pagination info
```

### Transactions

```typescript
import { withTransaction } from '@/lib/db/utils';

const result = await withTransaction(async (session) => {
  // Perform multiple operations within a transaction
  const user = await UserModel.create([{ email: 'test@example.com' }], { session });
  const profile = await ProfileModel.create([{ userId: user[0]._id }], { session });
  
  return { user: user[0], profile: profile[0] };
});
```

### Error Handling

```typescript
import { handleMongooseError, DuplicateKeyError } from '@/lib/db/errors';

try {
  await UserModel.create({ email: 'existing@example.com' });
} catch (error) {
  const dbError = handleMongooseError(error);
  
  if (dbError instanceof DuplicateKeyError) {
    console.log('Email already exists:', dbError.field);
  }
}
```

### Sanitize User Input

```typescript
import { sanitizeQuery } from '@/lib/db/utils';

// Remove potentially dangerous operators
const safeQuery = sanitizeQuery(userInput);
const users = await UserModel.find(safeQuery);
```

### Search Query Builder

```typescript
import { buildSearchQuery } from '@/lib/db/utils';

const searchQuery = buildSearchQuery('john', ['firstName', 'lastName', 'email']);
const users = await UserModel.find(searchQuery);
```

### Date Range Query

```typescript
import { buildDateRangeQuery } from '@/lib/db/utils';

const dateQuery = buildDateRangeQuery(
  'createdAt',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
const bookings = await BookingModel.find(dateQuery);
```

## Testing Connection

Run the test script to verify your MongoDB connection:

```bash
npx tsx lib/db/test-connection.ts
```

## Environment Variables

Required environment variables in `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/ruzizi_hotel
DATABASE_NAME=ruzizi_hotel
```

## Connection Pooling

The connection is configured with:
- **maxPoolSize**: 10 connections
- **minPoolSize**: 2 connections
- **socketTimeoutMS**: 45000ms
- **serverSelectionTimeoutMS**: 10000ms

## Indexes

All indexes are defined in `indexes.ts` and are automatically created when calling `initializeDatabase()`.

To manually create indexes:

```typescript
import { createIndexes } from '@/lib/db';

await createIndexes();
```

To drop all indexes (useful for testing):

```typescript
import { dropAllIndexes } from '@/lib/db';

await dropAllIndexes();
```

## Best Practices

1. **Always use the singleton connection** - Don't create multiple connections
2. **Use transactions for multi-document operations** - Ensures data consistency
3. **Sanitize user input** - Prevent NoSQL injection attacks
4. **Use pagination for large datasets** - Improves performance
5. **Define indexes strategically** - Based on your query patterns
6. **Handle errors properly** - Use custom error classes for better error handling

## Connection States

- **0** - disconnected
- **1** - connected
- **2** - connecting
- **3** - disconnecting

## Event Listeners

The database module emits the following events:

- `connected` - When connection is established
- `error` - When an error occurs
- `disconnected` - When connection is closed

Setup event listeners with:

```typescript
import { setupDatabaseEventListeners } from '@/lib/db';

setupDatabaseEventListeners();
```
