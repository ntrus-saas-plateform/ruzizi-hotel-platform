# Ruzizi Hotel Platform - Architectural Recommendations & Best Practices

## Overview

This document provides comprehensive architectural recommendations for the enhanced Ruzizi Hotel Platform, based on modern best practices for scalability, maintainability, security, and performance. The platform uses Next.js 16, TypeScript, MongoDB, Redis, and follows a service-oriented architecture.

## 1. Service Layer Patterns

### Current Implementation Analysis

The platform uses static service classes that encapsulate business logic, providing a clean separation between API routes and core business operations.

**Key Patterns Observed:**
- Static methods for stateless operations
- Centralized database connection management
- Input validation using Zod schemas
- Error handling with custom exceptions
- Transaction support for complex operations

### Recommended Service Layer Patterns

#### 1.1 Repository Pattern for Data Access

```typescript
// lib/repositories/BaseRepository.ts
export abstract class BaseRepository<T> {
  protected model: mongoose.Model<T>;

  constructor(model: mongoose.Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findAll(filter: any = {}, options: QueryOptions = {}): Promise<T[]> {
    const { skip = 0, limit = 10, sort = {} } = options;
    return this.model.find(filter).skip(skip).limit(limit).sort(sort).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}

// services/repositories/BookingRepository.ts
export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(BookingModel);
  }

  async findByEstablishment(establishmentId: string): Promise<IBooking[]> {
    return this.model.find({ establishmentId }).populate('accommodation').exec();
  }

  async findConflictingBookings(
    accommodationId: string,
    checkIn: Date,
    checkOut: Date,
    excludeId?: string
  ): Promise<IBooking[]> {
    const query: any = {
      accommodationId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { checkIn: { $lte: checkIn }, checkOut: { $gt: checkIn } },
        { checkIn: { $lt: checkOut }, checkOut: { $gte: checkOut } },
        { checkIn: { $gte: checkIn }, checkOut: { $lte: checkOut } },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return this.model.find(query).exec();
  }
}
```

#### 1.2 Service Layer with Dependency Injection

```typescript
// lib/di/Container.ts
export class Container {
  private services = new Map<string, any>();

  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service ${key} not registered`);
    }
    return factory();
  }
}

// services/BookingService.ts (enhanced)
export class BookingService {
  constructor(
    private bookingRepo: BookingRepository,
    private accommodationRepo: AccommodationRepository,
    private clientRepo: ClientRepository,
    private cache: CacheService
  ) {}

  async createBooking(data: CreateBookingInput): Promise<BookingResponse> {
    // Business logic with injected dependencies
    const accommodation = await this.accommodationRepo.findById(data.accommodationId);
    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    // Check availability using repository
    const conflicts = await this.bookingRepo.findConflictingBookings(
      data.accommodationId,
      data.checkIn,
      data.checkOut
    );

    if (conflicts.length > 0) {
      throw new Error('Accommodation not available');
    }

    // Create booking
    const booking = await this.bookingRepo.create(data);

    // Cache invalidation
    await this.cache.invalidate(`establishment_${data.establishmentId}_bookings`);

    return booking;
  }
}
```

#### 1.3 Unit of Work Pattern for Transactions

```typescript
// lib/db/UnitOfWork.ts
export class UnitOfWork {
  private session: mongoose.ClientSession | null = null;

  async start(): Promise<void> {
    this.session = await mongoose.startSession();
    this.session.startTransaction();
  }

  async commit(): Promise<void> {
    if (this.session) {
      await this.session.commitTransaction();
    }
  }

  async rollback(): Promise<void> {
    if (this.session) {
      await this.session.abortTransaction();
    }
  }

  async end(): Promise<void> {
    if (this.session) {
      this.session.endSession();
      this.session = null;
    }
  }

  getSession(): mongoose.ClientSession | null {
    return this.session;
  }
}

// Usage in service
export class BookingService {
  async createBookingWithTransaction(data: CreateBookingInput): Promise<BookingResponse> {
    const uow = new UnitOfWork();

    try {
      await uow.start();

      // Verify accommodation
      const accommodation = await AccommodationModel.findById(data.accommodationId).session(uow.getSession());
      if (!accommodation) {
        throw new Error('Accommodation not found');
      }

      // Create booking
      const booking = await BookingModel.create([data], { session: uow.getSession() });

      // Update accommodation status
      accommodation.status = 'reserved';
      await accommodation.save({ session: uow.getSession() });

      await uow.commit();
      return booking[0];

    } catch (error) {
      await uow.rollback();
      throw error;
    } finally {
      await uow.end();
    }
  }
}
```

#### 1.4 Service Interface Segregation

```typescript
// types/services/IBookingService.ts
export interface IBookingService {
  create(data: CreateBookingInput): Promise<BookingResponse>;
  getById(id: string): Promise<BookingResponse | null>;
  update(id: string, data: UpdateBookingInput): Promise<BookingResponse | null>;
  cancel(id: string): Promise<BookingResponse | null>;
  getAll(filters: BookingFilterOptions, page: number, limit: number): Promise<PaginationResult<BookingResponse>>;
}

// types/services/IBookingValidationService.ts
export interface IBookingValidationService {
  validateAvailability(accommodationId: string, checkIn: Date, checkOut: Date): Promise<boolean>;
  validateCapacity(accommodationId: string, guestCount: number): Promise<boolean>;
  validateBusinessRules(data: CreateBookingInput): Promise<void>;
}

// services/BookingService.ts
export class BookingService implements IBookingService {
  constructor(
    private validationService: IBookingValidationService,
    private repository: IBookingRepository
  ) {}

  async create(data: CreateBookingInput): Promise<BookingResponse> {
    // Validate business rules
    await this.validationService.validateBusinessRules(data);

    // Create booking
    return this.repository.create(data);
  }
}
```

### Benefits of Enhanced Service Layer

1. **Testability**: Dependency injection enables easy mocking
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Repository pattern supports different data sources
4. **Consistency**: Unit of Work ensures data integrity
5. **Flexibility**: Interface segregation allows for different implementations

## 2. API Design Principles

### Current Implementation Analysis

The platform uses Next.js API routes with a RESTful structure. Routes are organized by resource type with proper HTTP methods.

**Current Structure:**
```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── refresh/route.ts
├── public/
│   ├── establishments/route.ts
│   ├── bookings/route.ts
│   └── accommodations/route.ts
└── admin/
    ├── establishments/route.ts
    └── bookings/route.ts
```

### Recommended API Design Patterns

#### 2.1 RESTful Resource Design

```typescript
// app/api/v1/establishments/[id]/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/BookingService';
import { authMiddleware } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const user = await authMiddleware(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const bookings = await BookingService.getBookingsByEstablishment(
      params.id,
      { page, limit, status: status as BookingStatus }
    );

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching establishment bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authMiddleware(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const bookingData = {
      ...body,
      establishmentId: params.id,
      createdBy: user.userId
    };

    const booking = await BookingService.create(bookingData);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 2.2 API Versioning Strategy

```typescript
// lib/api/versioning.ts
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

// Middleware for API versioning
export function apiVersionMiddleware(version: ApiVersion) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      // Add version to request context
      context.apiVersion = version;

      // Version-specific logic can be added here
      if (version === API_VERSIONS.V2) {
        // V2 specific features
        request.headers.set('X-API-Version', 'v2');
      }

      return handler(request, context);
    };
  };
}

// Usage in routes
// app/api/v1/establishments/route.ts
export const GET = apiVersionMiddleware(API_VERSIONS.V1)(
  async (request: NextRequest) => {
    // V1 implementation
    const establishments = await EstablishmentService.getAll();
    return NextResponse.json(establishments);
  }
);

// app/api/v2/establishments/route.ts
export const GET = apiVersionMiddleware(API_VERSIONS.V2)(
  async (request: NextRequest) => {
    // V2 implementation with enhanced features
    const establishments = await EstablishmentService.getAllV2();
    return NextResponse.json({
      data: establishments,
      meta: {
        version: 'v2',
        timestamp: new Date().toISOString()
      }
    });
  }
);
```

#### 2.3 GraphQL API for Complex Queries (Optional Enhancement)

```typescript
// lib/graphql/schema.ts
import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  type Establishment {
    id: ID!
    name: String!
    location: Location!
    accommodations: [Accommodation!]!
    bookings(limit: Int, offset: Int): [Booking!]!
  }

  type Accommodation {
    id: ID!
    name: String!
    type: String!
    capacity: Capacity!
    pricing: Pricing!
    availability(checkIn: Date!, checkOut: Date!): Boolean!
  }

  type Booking {
    id: ID!
    bookingCode: String!
    status: BookingStatus!
    checkIn: Date!
    checkOut: Date!
    client: Client!
    accommodation: Accommodation!
    pricingDetails: PricingDetails!
  }

  type Query {
    establishments: [Establishment!]!
    establishment(id: ID!): Establishment
    bookings(establishmentId: ID, status: BookingStatus): [Booking!]!
  }

  type Mutation {
    createBooking(input: CreateBookingInput!): Booking!
    updateBooking(id: ID!, input: UpdateBookingInput!): Booking!
    cancelBooking(id: ID!): Booking!
  }
`;

// lib/graphql/resolvers.ts
export const resolvers = {
  Query: {
    establishments: async () => {
      return EstablishmentService.getAll();
    },
    establishment: async (_: any, { id }: { id: string }) => {
      return EstablishmentService.getById(id);
    },
    bookings: async (_: any, { establishmentId, status }: { establishmentId?: string, status?: string }) => {
      return BookingService.getAll({ establishmentId, status });
    },
  },
  Mutation: {
    createBooking: async (_: any, { input }: { input: CreateBookingInput }) => {
      return BookingService.create(input);
    },
    updateBooking: async (_: any, { id, input }: { id: string, input: UpdateBookingInput }) => {
      return BookingService.update(id, input);
    },
    cancelBooking: async (_: any, { id }: { id: string }) => {
      return BookingService.cancel(id);
    },
  },
  Establishment: {
    accommodations: async (establishment: any) => {
      return AccommodationService.getByEstablishment(establishment.id);
    },
    bookings: async (establishment: any, { limit, offset }: { limit?: number, offset?: number }) => {
      return BookingService.getByEstablishmentPaginated(establishment.id, limit, offset);
    },
  },
  Accommodation: {
    availability: async (accommodation: any, { checkIn, checkOut }: { checkIn: Date, checkOut: Date }) => {
      return BookingService.checkAvailability(accommodation.id, checkIn, checkOut);
    },
  },
};
```

#### 2.4 API Response Standardization

```typescript
// lib/api/response.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class ApiResponseBuilder {
  static success<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number; totalPages: number }
  ): ApiResponse<T[]> {
    return this.success(data, {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      pagination,
    });
  }
}

// Usage in API routes
export async function GET() {
  try {
    const establishments = await EstablishmentService.getAll();
    return NextResponse.json(
      ApiResponseBuilder.success(establishments)
    );
  } catch (error) {
    return NextResponse.json(
      ApiResponseBuilder.error('FETCH_FAILED', 'Failed to fetch establishments'),
      { status: 500 }
    );
  }
}
```

### API Design Best Practices

1. **Consistent HTTP Status Codes**
2. **Proper Content-Type Headers**
3. **Rate Limiting**
4. **Request/Response Validation**
5. **Error Handling**
6. **Pagination for Large Datasets**
7. **Caching Headers**
8. **API Documentation (OpenAPI/Swagger)**

## 3. Caching Strategies

### Current Implementation Analysis

The platform uses Redis for caching with fallback to in-memory storage. Current caching includes:
- Establishment data
- User permissions
- Common query results
- Method-level caching with decorators

### Advanced Caching Patterns

#### 3.1 Multi-Level Caching Strategy

```typescript
// lib/cache/MultiLevelCache.ts
export class MultiLevelCache {
  private l1Cache: Map<string, CacheEntry> = new Map(); // In-memory L1
  private redisCache: RedisCache; // Redis L2
  private l3Cache?: ExternalCache; // Optional external cache

  constructor(redisCache: RedisCache, l3Cache?: ExternalCache) {
    this.redisCache = redisCache;
    this.l3Cache = l3Cache;

    // Cleanup L1 cache periodically
    setInterval(() => this.cleanupL1(), 5 * 60 * 1000); // 5 minutes
  }

  async get<T>(key: string): Promise<T | null> {
    // Check L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry)) {
      return l1Entry.value;
    }

    // Check L2 cache
    const l2Value = await this.redisCache.get<T>(key);
    if (l2Value !== null) {
      // Update L1 cache
      this.l1Cache.set(key, {
        value: l2Value,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });
      return l2Value;
    }

    // Check L3 cache if available
    if (this.l3Cache) {
      const l3Value = await this.l3Cache.get<T>(key);
      if (l3Value !== null) {
        // Update L2 and L1 caches
        await this.redisCache.set(key, l3Value, 10 * 60); // 10 minutes
        this.l1Cache.set(key, {
          value: l3Value,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
        return l3Value;
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // Set in all levels
    this.l1Cache.set(key, {
      value,
      expiresAt: Date.now() + Math.min(ttlSeconds * 1000, 5 * 60 * 1000), // Max 5 min for L1
    });

    await this.redisCache.set(key, value, ttlSeconds);

    if (this.l3Cache) {
      await this.l3Cache.set(key, value, ttlSeconds * 2); // Longer TTL for L3
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  private cleanupL1(): void {
    const now = Date.now();
    for (const [key, entry] of this.l1Cache.entries()) {
      if (now > entry.expiresAt) {
        this.l1Cache.delete(key);
      }
    }
  }
}
```

#### 3.2 Cache-Aside Pattern with Stale-While-Revalidate

```typescript
// lib/cache/CacheAside.ts
export class CacheAside {
  constructor(private cache: ICache, private service: any) {}

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300): Promise<T> {
    // Try to get from cache
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      // Serve stale data while revalidating in background
      this.revalidateInBackground(key, fetcher, ttl);
      return cached;
    }

    // Cache miss - fetch fresh data
    const fresh = await fetcher();
    await this.cache.set(key, fresh, ttl);
    return fresh;
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const fresh = await fetcher();
      await this.cache.set(key, fresh, ttl);
    } catch (error) {
      console.error('Background revalidation failed:', error);
      // Could implement exponential backoff here
    }
  }
}

// Usage in service
export class EstablishmentService {
  private cacheAside: CacheAside;

  constructor(cache: ICache) {
    this.cacheAside = new CacheAside(cache, this);
  }

  async getEstablishments(): Promise<Establishment[]> {
    return this.cacheAside.get(
      'establishments',
      () => this.fetchEstablishmentsFromDB(),
      600 // 10 minutes
    );
  }

  private async fetchEstablishmentsFromDB(): Promise<Establishment[]> {
    await connectDB();
    return EstablishmentModel.find({ isActive: true }).exec();
  }
}
```

#### 3.3 Write-Through and Write-Behind Caching

```typescript
// lib/cache/WriteThroughCache.ts
export class WriteThroughCache {
  constructor(private cache: ICache, private db: any) {}

  async create<T>(key: string, data: T, ttl: number = 300): Promise<T> {
    // Write to database first
    const saved = await this.db.create(data);

    // Then update cache
    await this.cache.set(key, saved, ttl);

    return saved;
  }

  async update<T>(key: string, id: string, data: Partial<T>, ttl: number = 300): Promise<T> {
    // Update database first
    const updated = await this.db.update(id, data);

    // Then update cache
    await this.cache.set(key, updated, ttl);

    // Invalidate related caches
    await this.invalidateRelatedCaches(key);

    return updated;
  }

  private async invalidateRelatedCaches(key: string): Promise<void> {
    // Invalidate pattern-based keys
    const patterns = [`${key}_*`, `*_related_to_${key}`];
    for (const pattern of patterns) {
      await this.cache.invalidatePattern(pattern);
    }
  }
}

// lib/cache/WriteBehindCache.ts
export class WriteBehindCache {
  private queue: Array<{ operation: string; data: any }> = [];
  private processing = false;

  constructor(private cache: ICache, private db: any) {
    // Process queue every 5 seconds
    setInterval(() => this.processQueue(), 5000);
  }

  async create(data: any): Promise<void> {
    // Update cache immediately
    const key = `temp_${Date.now()}`;
    await this.cache.set(key, data, 60); // 1 minute

    // Queue database write
    this.queue.push({ operation: 'create', data });
  }

  async update(id: string, data: any): Promise<void> {
    // Update cache immediately
    await this.cache.set(`item_${id}`, data, 60);

    // Queue database write
    this.queue.push({ operation: 'update', data: { id, ...data } });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      const batch = this.queue.splice(0, 10); // Process in batches

      for (const item of batch) {
        if (item.operation === 'create') {
          await this.db.create(item.data);
        } else if (item.operation === 'update') {
          await this.db.update(item.data.id, item.data);
        }
      }
    } catch (error) {
      console.error('Write-behind processing failed:', error);
      // Re-queue failed items
      // Implementation depends on requirements
    } finally {
      this.processing = false;
    }
  }
}
```

#### 3.4 Cache Invalidation Strategies

```typescript
// lib/cache/CacheInvalidation.ts
export class CacheInvalidationManager {
  constructor(private cache: ICache) {}

  // Time-based invalidation
  async invalidateAfterDelay(key: string, delayMs: number): Promise<void> {
    setTimeout(async () => {
      await this.cache.delete(key);
    }, delayMs);
  }

  // Event-based invalidation
  async invalidateOnEvent(event: string, key: string): Promise<void> {
    // Listen for specific events and invalidate cache
    this.eventEmitter.on(event, async () => {
      await this.cache.delete(key);
    });
  }

  // Pattern-based invalidation
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.cache.getKeysByPattern(pattern);
    await Promise.all(keys.map(key => this.cache.delete(key)));
  }

  // Smart invalidation based on relationships
  async invalidateRelated(entityType: string, entityId: string): Promise<void> {
    const relatedKeys = await this.getRelatedCacheKeys(entityType, entityId);
    await Promise.all(relatedKeys.map(key => this.cache.delete(key)));
  }

  private async getRelatedCacheKeys(entityType: string, entityId: string): Promise<string[]> {
    const relationships = {
      establishment: [
        `establishment_${entityId}`,
        `establishment_${entityId}_accommodations`,
        `establishment_${entityId}_bookings`,
      ],
      booking: [
        `booking_${entityId}`,
        `accommodation_${entityId}_availability`,
      ],
      accommodation: [
        `accommodation_${entityId}`,
        `accommodation_${entityId}_availability`,
        `establishment_*_accommodations`, // Pattern for related establishments
      ],
    };

    return relationships[entityType] || [];
  }
}
```

### Caching Best Practices

1. **Cache Key Naming Convention**: `entityType_entityId_property`
2. **TTL Strategy**: Different TTLs for different data types
3. **Cache Warming**: Pre-populate frequently accessed data
4. **Monitoring**: Track cache hit/miss ratios
5. **Fallback Strategy**: Graceful degradation when cache fails
6. **Memory Management**: Prevent cache from growing indefinitely

## 4. Security Implementations

### Current Implementation Analysis

The platform implements several security measures:
- JWT authentication with access/refresh tokens
- Password hashing with bcrypt
- Rate limiting (in-memory)
- Input validation with Zod
- Middleware for authentication and authorization

### Advanced Security Patterns

#### 4.1 Multi-Factor Authentication (MFA)

```typescript
// lib/auth/mfa.ts
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export class MFAService {
  static async generateSecret(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = speakeasy.generateSecret({
      name: `Ruzizi Hotel (${userId})`,
      issuer: 'Ruzizi Hotel Platform'
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl
    };
  }

  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (30 seconds each)
    });
  }

  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}

// Enhanced AuthService with MFA
export class AuthService {
  static async enableMFA(userId: string): Promise<{ qrCodeUrl: string }> {
    const { secret, qrCodeUrl } = await MFAService.generateSecret(userId);

    // Store secret in database (hashed)
    await UserModel.findByIdAndUpdate(userId, {
      mfaSecret: await bcrypt.hash(secret, 12),
      mfaEnabled: false, // Will be enabled after verification
      mfaBackupCodes: MFAService.generateBackupCodes()
    });

    return { qrCodeUrl };
  }

  static async verifyAndEnableMFA(userId: string, token: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select('+mfaSecret');
    if (!user || !user.mfaSecret) {
      throw new Error('MFA not set up');
    }

    const isValid = MFAService.verifyToken(user.mfaSecret, token);
    if (isValid) {
      user.mfaEnabled = true;
      await user.save();
    }

    return isValid;
  }

  static async loginWithMFA(email: string, password: string, mfaToken?: string): Promise<any> {
    // Regular authentication
    const { user, tokens } = await this.login({ email, password });

    // If MFA is enabled, require MFA token
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return {
          requiresMFA: true,
          user: { id: user.id, email: user.email },
          tempToken: this.generateTempToken(user.id)
        };
      }

      const userWithSecret = await UserModel.findById(user.id).select('+mfaSecret');
      const isValidMFA = MFAService.verifyToken(userWithSecret!.mfaSecret!, mfaToken);

      if (!isValidMFA) {
        throw new Error('Invalid MFA token');
      }
    }

    return { user, tokens };
  }
}
```

#### 4.2 Role-Based Access Control (RBAC) with Permissions

```typescript
// lib/auth/rbac.ts
export enum Permission {
  // Establishment permissions
  VIEW_ESTABLISHMENT = 'view_establishment',
  CREATE_ESTABLISHMENT = 'create_establishment',
  UPDATE_ESTABLISHMENT = 'update_establishment',
  DELETE_ESTABLISHMENT = 'delete_establishment',

  // Booking permissions
  VIEW_BOOKINGS = 'view_bookings',
  CREATE_BOOKING = 'create_booking',
  UPDATE_BOOKING = 'update_booking',
  CANCEL_BOOKING = 'cancel_booking',

  // User management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',

  // System permissions
  MANAGE_SYSTEM = 'manage_system',
  VIEW_ANALYTICS = 'view_analytics',
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  GUEST = 'guest',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.VIEW_ESTABLISHMENT,
    Permission.CREATE_ESTABLISHMENT,
    Permission.UPDATE_ESTABLISHMENT,
    Permission.DELETE_ESTABLISHMENT,
    Permission.VIEW_BOOKINGS,
    Permission.CREATE_BOOKING,
    Permission.UPDATE_BOOKING,
    Permission.CANCEL_BOOKING,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.VIEW_ANALYTICS,
  ],
  [Role.MANAGER]: [
    Permission.VIEW_ESTABLISHMENT,
    Permission.UPDATE_ESTABLISHMENT,
    Permission.VIEW_BOOKINGS,
    Permission.CREATE_BOOKING,
    Permission.UPDATE_BOOKING,
    Permission.CANCEL_BOOKING,
    Permission.VIEW_USERS,
  ],
  [Role.STAFF]: [
    Permission.VIEW_BOOKINGS,
    Permission.CREATE_BOOKING,
    Permission.UPDATE_BOOKING,
    Permission.CANCEL_BOOKING,
  ],
  [Role.GUEST]: [
    Permission.VIEW_ESTABLISHMENT,
  ],
};

export class RBACService {
  static hasPermission(userRole: Role, userPermissions: Permission[], requiredPermission: Permission): boolean {
    // Check if user has the permission directly
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check if user's role includes the permission
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(requiredPermission);
  }

  static hasAnyPermission(userRole: Role, userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some(permission =>
      this.hasPermission(userRole, userPermissions, permission)
    );
  }

  static hasAllPermissions(userRole: Role, userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every(permission =>
      this.hasPermission(userRole, userPermissions, permission)
    );
  }

  static getEffectivePermissions(userRole: Role, userPermissions: Permission[]): Permission[] {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return [...new Set([...rolePermissions, ...userPermissions])];
  }
}

// Middleware for permission checking
export function requirePermission(permission: Permission | Permission[]) {
  return async function (request: NextRequest) {
    const user = await authMiddleware(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithPermissions = await UserModel.findById(user.userId).select('role permissions');
    const hasPermission = Array.isArray(permission)
      ? RBACService.hasAnyPermission(userWithPermissions!.role, userWithPermissions!.permissions, permission)
      : RBACService.hasPermission(userWithPermissions!.role, userWithPermissions!.permissions, permission);

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null; // Continue to next middleware/route
  };
}
```

#### 4.3 API Key Authentication for External Integrations

```typescript
// lib/auth/api-keys.ts
import crypto from 'crypto';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: Permission[];
  expiresAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export class ApiKeyService {
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  static async createApiKey(
    userId: string,
    name: string,
    permissions: Permission[],
    expiresAt?: Date
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const plainKey = this.generateKey();
    const hashedKey = this.hashKey(plainKey);

    const apiKey = await ApiKeyModel.create({
      key: hashedKey,
      name,
      userId,
      permissions,
      expiresAt,
      isActive: true,
    });

    return {
      apiKey: apiKey.toObject(),
      plainKey, // Return plain key only once for user to copy
    };
  }

  static async validateApiKey(key: string): Promise<ApiKey | null> {
    const hashedKey = this.hashKey(key);

    const apiKey = await ApiKeyModel.findOne({
      key: hashedKey,
      isActive: true,
    });

    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      apiKey.isActive = false;
      await apiKey.save();
      return null;
    }

    // Update last used
    apiKey.lastUsed = new Date();
    await apiKey.save();

    return apiKey.toObject();
  }

  static async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await ApiKeyModel.updateOne(
      { _id: keyId, userId },
      { isActive: false }
    );
    return result.modifiedCount > 0;
  }
}

// Middleware for API key authentication
export async function apiKeyMiddleware(request: NextRequest): Promise<ApiKey | null> {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return null;
  }

  return ApiKeyService.validateApiKey(apiKey);
}
```

#### 4.4 Security Headers and CSP

```typescript
// lib/security/headers.ts
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

  // HSTS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

  // Remove server information
  'X-Powered-By': '',

  // Prevent caching of sensitive content
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Enhanced security middleware
export function securityHeadersMiddleware() {
  return function (response: NextResponse) {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

// CSP violation reporting
export async function handleCSPViolation(request: NextRequest) {
  const violation = await request.json();

  // Log CSP violations for monitoring
  console.error('CSP Violation:', {
    documentUri: violation.documentURI,
    violatedDirective: violation.violatedDirective,
    originalPolicy: violation.originalPolicy,
    blockedUri: violation.blockedURI,
    timestamp: new Date().toISOString(),
  });

  // Store in database for analysis
  await SecurityLogModel.create({
    type: 'CSP_VIOLATION',
    details: violation,
    ip: request.ip,
    userAgent: request.headers.get('user-agent'),
  });

  return NextResponse.json({ received: true });
}
```

#### 4.5 Data Encryption at Rest

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits

  constructor(private masterKey: string) {}

  encrypt(text: string): string {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, this.keyLength, 'sha256');
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(salt);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
  }

  decrypt(encryptedText: string): string {
    const data = Buffer.from(encryptedText, 'base64');

    const salt = data.subarray(0, 32);
    const iv = data.subarray(32, 48);
    const tag = data.subarray(48, 64);
    const encrypted = data.subarray(64);

    const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, this.keyLength, 'sha256');

    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Usage for sensitive data
export class SensitiveDataService {
  private encryption: EncryptionService;

  constructor() {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY!;
    this.encryption = new EncryptionService(masterKey);
  }

  async savePaymentInfo(userId: string, paymentData: any): Promise<void> {
    const encryptedData = this.encryption.encrypt(JSON.stringify(paymentData));

    await PaymentInfoModel.create({
      userId,
      encryptedData,
      createdAt: new Date(),
    });
  }

  async getPaymentInfo(userId: string): Promise<any> {
    const record = await PaymentInfoModel.findOne({ userId }).sort({ createdAt: -1 });

    if (!record) return null;

    const decryptedData = this.encryption.decrypt(record.encryptedData);
    return JSON.parse(decryptedData);
  }
}
```

### Security Best Practices

1. **Defense in Depth**: Multiple layers of security
2. **Principle of Least Privilege**: Minimal required permissions
3. **Fail-Safe Defaults**: Secure by default configuration
4. **Security Monitoring**: Log and monitor security events
5. **Regular Security Audits**: Periodic security assessments
6. **Incident Response Plan**: Prepared for security incidents
7. **Dependency Management**: Keep dependencies updated and secure

## 5. Performance Optimization Techniques

### Current Implementation Analysis

The platform includes basic performance optimizations:
- Redis caching
- Database query optimization
- Performance monitoring
- Bundle analysis

### Advanced Performance Patterns

#### 5.1 Database Query Optimization

```typescript
// lib/db/query-optimizer.ts
export class QueryOptimizer {
  // Index usage analysis
  static async analyzeQueryPerformance(query: any, collection: string): Promise<QueryAnalysis> {
    const startTime = Date.now();

    // Execute query with explain
    const explanation = await mongoose.connection.db
      .collection(collection)
      .find(query)
      .explain('executionStats');

    const executionTime = Date.now() - startTime;

    return {
      executionTime,
      totalDocsExamined: explanation.executionStats.totalDocsExamined,
      totalDocsReturned: explanation.executionStats.totalDocsReturned,
      indexesUsed: explanation.executionStats.winningPlan?.inputStage?.indexName,
      isIndexUsed: explanation.executionStats.winningPlan?.inputStage?.stage === 'IXSCAN',
    };
  }

  // Automatic index suggestion
  static suggestIndexes(query: any, collection: string): IndexSuggestion[] {
    const suggestions: IndexSuggestion[] = [];

    // Analyze query for potential indexes
    if (query.$and || query.$or) {
      suggestions.push({
        fields: Object.keys(query).filter(key => !key.startsWith('$')),
        type: 'compound',
      });
    }

    // Text search indexes
    if (query.$text) {
      suggestions.push({
        fields: ['_fts', '_ftsx'],
        type: 'text',
      });
    }

    // Geospatial indexes
    if (query.$near || query.$geoWithin) {
      suggestions.push({
        fields: ['location'],
        type: '2dsphere',
      });
    }

    return suggestions;
  }

  // Query result caching with invalidation
  static async cachedQuery<T>(
    key: string,
    query: () => Promise<T>,
    ttl: number = 300,
    invalidationKeys: string[] = []
  ): Promise<T> {
    const cache = new RedisCache();

    // Check cache first
    const cached = await cache.get<T>(key);
    if (cached) return cached;

    // Execute query
    const result = await query();

    // Cache result
    await cache.set(key, result, ttl);

    // Set up invalidation
    for (const invalidationKey of invalidationKeys) {
      await cache.set(`${key}_invalidates_${invalidationKey}`, true, ttl);
    }

    return result;
  }
}

// Optimized booking queries
export class OptimizedBookingService {
  static async getBookingsWithAnalytics(
    establishmentId: string,
    filters: BookingFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<OptimizedBookingResult> {
    const cacheKey = `bookings_${establishmentId}_${JSON.stringify(filters)}_${page}_${limit}`;

    return QueryOptimizer.cachedQuery(
      cacheKey,
      async () => {
        const pipeline = [
          // Match stage
          { $match: this.buildMatchQuery(establishmentId, filters) },

          // Lookup establishments
          {
            $lookup: {
              from: 'establishments',
              localField: 'establishmentId',
              foreignField: '_id',
              as: 'establishment',
            },
          },

          // Lookup accommodations
          {
            $lookup: {
              from: 'accommodations',
              localField: 'accommodationId',
              foreignField: '_id',
              as: 'accommodation',
            },
          },

          // Add computed fields
          {
            $addFields: {
              duration: {
                $divide: [
                  { $subtract: ['$checkOut', '$checkIn'] },
                  1000 * 60 * 60 * 24, // Convert to days
                ],
              },
              revenue: '$pricingDetails.total',
            },
          },

          // Facet for pagination and analytics
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: (page -
                { $skip: (page - 1) * limit },
                { $limit: limit },
              ],
              analytics: [
                {
                  $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$revenue' },
                    averageBookingValue: { $avg: '$revenue' },
                    statusBreakdown: {
                      $push: '$status',
                    },
                  },
                },
              ],
            },
          },
        ];

        const result = await BookingModel.aggregate(pipeline);

        return {
          data: result[0]?.data || [],
          analytics: result[0]?.analytics[0] || {},
          pagination: {
            page,
            limit,
            total: await this.getTotalCount(establishmentId, filters),
            totalPages: Math.ceil((await this.getTotalCount(establishmentId, filters)) / limit),
          },
        };
      },
      600, // 10 minutes cache
      [`establishment_${establishmentId}_bookings`] // Invalidation keys
    );
  }
}
```

#### 5.2 Connection Pooling and Database Optimization

```typescript
// lib/db/connection-pool.ts
import mongoose from 'mongoose';

export class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private connections: Map<string, mongoose.Connection> = new Map();

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  async getConnection(databaseName: string): Promise<mongoose.Connection> {
    if (this.connections.has(databaseName)) {
      return this.connections.get(databaseName)!;
    }

    const connection = await mongoose.createConnection(process.env.MONGODB_URI!, {
      dbName: databaseName,
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 2,  // Minimum number of connections in the connection pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    });

    this.connections.set(databaseName, connection);
    return connection;
  }

  async closeAllConnections(): Promise<void> {
    for (const [name, connection] of this.connections) {
      await connection.close();
      this.connections.delete(name);
    }
  }
}

// Read/Write separation
export class ReadWriteDatabaseService {
  private readConnection: mongoose.Connection;
  private writeConnection: mongoose.Connection;

  constructor() {
    const pool = DatabaseConnectionPool.getInstance();
    this.readConnection = pool.getConnection('ruzizi_read');
    this.writeConnection = pool.getConnection('ruzizi_write');
  }

  async readQuery(model: any, query: any) {
    return model.find(query).connection(this.readConnection);
  }

  async writeQuery(model: any, query: any) {
    return model.findOneAndUpdate(query).connection(this.writeConnection);
  }
}
```

#### 5.3 CDN and Static Asset Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.ruzizi.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer
    if (!dev && !isServer) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze/client.html',
        })
      );
    }

    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
          },
        },
      },
    };

    return config;
  },
};
```

#### 5.4 Real-time Performance Monitoring

```typescript
// lib/performance/real-time-monitor.ts
export class RealTimePerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Alert[] = [];
  private thresholds = {
    responseTime: 1000, // 1 second
    errorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.7, // 70%
  };

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitor response times
    setInterval(() => this.checkResponseTimes(), 60000); // Every minute

    // Monitor error rates
    setInterval(() => this.checkErrorRates(), 300000); // Every 5 minutes

    // Monitor system resources
    setInterval(() => this.checkSystemResources(), 30000); // Every 30 seconds
  }

  recordMetric(endpoint: string, responseTime: number, success: boolean) {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      endpoint,
      responseTime,
      success,
    };

    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }

    this.metrics.get(endpoint)!.push(metric);

    // Keep only last hour of metrics
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.get(endpoint)!.filter(m => m.timestamp > oneHourAgo);
    this.metrics.set(endpoint, recentMetrics);
  }

  private checkResponseTimes() {
    for (const [endpoint, metrics] of this.metrics) {
      if (metrics.length === 0) continue;

      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;

      if (avgResponseTime > this.thresholds.responseTime) {
        this.createAlert({
          type: 'PERFORMANCE',
          severity: 'WARNING',
          message: `High response time for ${endpoint}: ${avgResponseTime.toFixed(2)}ms`,
          details: { endpoint, avgResponseTime, threshold: this.thresholds.responseTime },
        });
      }
    }
  }

  private checkErrorRates() {
    for (const [endpoint, metrics] of this.metrics) {
      if (metrics.length === 0) continue;

      const errorCount = metrics.filter(m => !m.success).length;
      const errorRate = errorCount / metrics.length;

      if (errorRate > this.thresholds.errorRate) {
        this.createAlert({
          type: 'ERROR_RATE',
          severity: 'CRITICAL',
          message: `High error rate for ${endpoint}: ${(errorRate * 100).toFixed(2)}%`,
          details: { endpoint, errorRate, threshold: this.thresholds.errorRate },
        });
      }
    }
  }

  private async checkSystemResources() {
    const memUsage = process.memoryUsage();
    const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;

    if (memUsagePercent > this.thresholds.memoryUsage) {
      this.createAlert({
        type: 'SYSTEM',
        severity: 'WARNING',
        message: `High memory usage: ${(memUsagePercent * 100).toFixed(2)}%`,
        details: { memUsagePercent, threshold: this.thresholds.memoryUsage },
      });
    }

    // CPU usage check would require additional libraries like 'pidusage'
  }

  private createAlert(alert: Omit<Alert, 'id' | 'timestamp'>) {
    const newAlert: Alert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.alerts.push(newAlert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Send alert to monitoring service
    this.sendAlert(newAlert);
  }

  private async sendAlert(alert: Alert) {
    // Send to external monitoring service (e.g., DataDog, New Relic)
    console.error('ALERT:', alert);

    // Could also send email, Slack notification, etc.
  }

  getMetrics(endpoint?: string): PerformanceMetric[] {
    if (endpoint) {
      return this.metrics.get(endpoint) || [];
    }

    return Array.from(this.metrics.values()).flat();
  }

  getAlerts(): Alert[] {
    return this.alerts;
  }
}

// Middleware for performance monitoring
export function performanceMonitoringMiddleware() {
  const monitor = new RealTimePerformanceMonitor();

  return async function (request: NextRequest, response: NextResponse) {
    const startTime = Date.now();
    const endpoint = request.nextUrl.pathname;

    try {
      // Continue with request processing
      const result = await next();

      const responseTime = Date.now() - startTime;
      monitor.recordMetric(endpoint, responseTime, true);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      monitor.recordMetric(endpoint, responseTime, false);

      throw error;
    }
  };
}
```

## 6. Guidelines for Future Development

### 6.1 Code Organization Principles

#### Directory Structure Guidelines

```
src/
├── app/                    # Next.js app router
│   ├── (auth)/            # Route groups for organization
│   ├── (dashboard)/
│   ├── api/               # API routes
│   └── globals.css
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (buttons, inputs, etc.)
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── domain/           # Domain-specific components
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication utilities
│   ├── db/              # Database utilities
│   ├── cache/           # Caching utilities
│   ├── validation/      # Validation schemas
│   └── utils/           # General utilities
├── services/            # Business logic services
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
├── stores/              # State management (Zustand, Redux, etc.)
├── constants/           # Application constants
└── styles/              # Global styles and themes
```

#### Naming Conventions

```typescript
// Files and directories: kebab-case
// user-profile.tsx, booking-service.ts

// Components: PascalCase
export function UserProfile() { }

// Functions and variables: camelCase
const getUserProfile = () => { };

// Types and interfaces: PascalCase
interface UserProfile { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Enums: PascalCase
enum BookingStatus { }
```

### 6.2 Development Workflow

#### Git Branching Strategy

```bash
# Main branches
main        # Production-ready code
develop     # Integration branch

# Feature branches
feature/user-authentication
feature/booking-system
feature/payment-integration

# Release branches
release/v1.2.0

# Hotfix branches
hotfix/critical-security-patch
```

#### Commit Message Convention

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Testing
- chore: Maintenance

Examples:
feat(auth): add MFA support
fix(booking): resolve double booking issue
docs(api): update authentication endpoints
```

#### Code Review Checklist

- [ ] Code follows established patterns and conventions
- [ ] Unit tests are included and passing
- [ ] Integration tests are included where applicable
- [ ] Documentation is updated
- [ ] Security considerations are addressed
- [ ] Performance impact is considered
- [ ] Database migrations are included if needed
- [ ] Breaking changes are clearly documented

### 6.3 Testing Strategy

#### Testing Pyramid

```typescript
// 1. Unit Tests (Bottom layer - most numerous)
import { BookingService } from '@/services/BookingService';

describe('BookingService', () => {
  describe('calculatePricing', () => {
    it('should calculate nightly pricing correctly', () => {
      const result = BookingService.calculatePricing(
        'accommodation-id',
        new Date('2024-01-01'),
        new Date('2024-01-03')
      );

      expect(result.mode).toBe('nightly');
      expect(result.quantity).toBe(2);
    });
  });
});

// 2. Integration Tests (Middle layer)
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/bookings/route';

describe('/api/bookings', () => {
  it('should create booking successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        accommodationId: 'acc-123',
        checkIn: '2024-01-01',
        checkOut: '2024-01-03',
      },
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(201);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
  });
});

// 3. End-to-End Tests (Top layer - least numerous)
import { test, expect } from '@playwright/test';

test('complete booking flow', async ({ page }) => {
  await page.goto('/establishments');
  await page.click('[data-testid="establishment-card"]');
  await page.click('[data-testid="book-accommodation"]');

  // Fill booking form
  await page.fill('[data-testid="check-in"]', '2024-01-01');
  await page.fill('[data-testid="check-out"]', '2024-01-03');
  await page.fill('[data-testid="guest-name"]', 'John Doe');

  await page.click('[data-testid="submit-booking"]');

  await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
});
```

#### Test Coverage Requirements

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### 6.4 Deployment and DevOps

#### CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Build and push Docker image
        run: |
          docker build -t ruzizi-hotel-platform:${{ github.sha }} .
          docker tag ruzizi-hotel-platform:${{ github.sha }} 123456789.dkr.ecr.us-east-1.amazonaws.com/ruzizi-hotel-platform:${{ github.sha }}
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
          docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ruzizi-hotel-platform:${{ github.sha }}

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster ruzizi-cluster --service ruzizi-service --force-new-deployment --query 'service.deployments[0].id'
```

#### Infrastructure as Code

```typescript
// infrastructure/main.ts (using CDK)
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

export class RuziziHotelPlatformStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'RuziziVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // RDS MongoDB
    const mongoCluster = new rds.DatabaseCluster(this, 'MongoDB', {
      engine: rds.DatabaseClusterEngine.mongodb({
        version: rds.MongodbEngineVersion.COMMUNITY_5_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Redis Cluster
    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      engine: 'redis',
      engineVersion: '6.2',
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'RuziziCluster', {
      vpc,
    });

    // ECS Service
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'RuziziTask', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Add container
    taskDefinition.addContainer('RuziziContainer', {
      image: ecs.ContainerImage.fromRegistry('ruzizi-hotel-platform'),
      environment: {
        MONGODB_URI: mongoCluster.clusterEndpoint.socketAddress,
        REDIS_URL: redisCluster.attrRedisEndpointAddress,
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ruzizi' }),
    });

    new ecs.FargateService(this, 'RuziziService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });
  }
}
```

### 6.5 Monitoring and Observability

#### Application Monitoring Setup

```typescript
// lib/monitoring/application-insights.ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

export class ApplicationMonitoring {
  private appInsights: ApplicationInsights;

  constructor() {
    this.appInsights = new ApplicationInsights({
      config: {
        instrumentationKey: process.env.APPLICATION_INSIGHTS_KEY,
        enableAutoRouteTracking: true,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        correlationHeaderExcludedDomains: ['*.queue.core.windows.net'],
      },
    });

    this.appInsights.loadAppInsights();
    this.setupCustomTracking();
  }

  private setupCustomTracking() {
    // Track user interactions
    this.trackUserActions();

    // Track performance metrics
    this.trackPerformanceMetrics();

    // Track errors
    this.trackErrors();
  }

  private trackUserActions() {
    // Track button clicks, form submissions, etc.
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-track]')) {
        this.appInsights.trackEvent({
          name: 'UserAction',
          properties: {
            action: target.getAttribute('data-track'),
            element: target.tagName,
            page: window.location.pathname,
          },
        });
      }
    });
  }

  private trackPerformanceMetrics() {
    // Track Core Web Vitals
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => this.trackWebVital('CLS', metric));
        getFID((metric) => this.trackWebVital('FID', metric));
        getFCP((metric) => this.trackWebVital('FCP', metric));
        getLCP((metric) => this.trackWebVital('LCP', metric));
        getTTFB((metric) => this.trackWebVital('TTFB', metric));
      });
    }
  }

  private trackWebVital(name: string, metric: any) {
    this.appInsights.trackMetric({
      name: `WebVital_${name}`,
      average: metric.value,
      properties: {
        rating: metric.rating,
        page: window.location.pathname,
      },
    });
  }

  private trackErrors() {
    window.addEventListener('error', (event) => {
      this.appInsights.trackException({
        exception: event.error,
        properties: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.appInsights.trackException({
        exception: event.reason,
        properties: {
          type: 'UnhandledPromiseRejection',
        },
      });
    });
  }

  trackCustomEvent(name: string, properties?: { [key: string]: any }) {
    this.appInsights.trackEvent({ name, properties });
  }

  trackCustomMetric(name: string, value: number, properties?: { [key: string]: any }) {
    this.appInsights.trackMetric({ name, average: value, properties });
  }
}

// Initialize monitoring
export const monitoring = new ApplicationMonitoring();
```

#### Log Aggregation and Analysis

```typescript
// lib/logging/structured-logger.ts
import winston from 'winston';

export class StructuredLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'ruzizi-hotel-platform' },
      transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),

        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({ filename: 'logs/combined.log' }),

        // Console logging for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    // If we're not in production, log to the console with a simpler format
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple(),
      }));
    }
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  // Request logging middleware
  requestLogger() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?.id,
        });
      });

      next();
    };
  }

  // Performance logging
  performanceLogger(operation: string, duration: number, meta?: any) {
    this.logger.info('Performance', {
      operation,
      duration,
      ...meta,
    });
  }

  // Security event logging
  securityLogger(event: string, details: any) {
    this.logger.warn('Security Event', {
      event,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new StructuredLogger();
```

## Summary of Recommendations

This architectural guide provides comprehensive recommendations for enhancing the Ruzizi Hotel Platform with modern best practices across multiple domains:

### Service Layer Enhancements
- Repository pattern for data access abstraction
- Dependency injection for better testability
- Unit of Work pattern for transaction management
- Interface segregation for modular design

### API Design Improvements
- RESTful resource design with proper HTTP methods
- API versioning strategy for backward compatibility
- Standardized response formats with consistent error handling
- Optional GraphQL implementation for complex queries

### Advanced Caching Strategies
- Multi-level caching (L1 in-memory, L2 Redis, L3 external)
- Cache-aside pattern with stale-while-revalidate
- Write-through and write-behind caching for data consistency
- Intelligent cache invalidation strategies

### Security Implementations
- Multi-factor authentication (MFA) with TOTP
- Role-based access control (RBAC) with granular permissions
- API key authentication for external integrations
- Comprehensive security headers and CSP
- Data encryption at rest for sensitive information

### Performance Optimizations
- Database query optimization with aggregation pipelines
- Connection pooling and read/write separation
- CDN integration and static asset optimization
- Real-time performance monitoring and alerting

### Development Guidelines
- Consistent code organization and naming conventions
- Git branching strategy and commit message standards
- Comprehensive testing strategy following the testing pyramid
- CI/CD pipeline with automated testing and deployment
- Infrastructure as Code using AWS CDK
- Application monitoring and structured logging

### Key Benefits
1. **Scalability**: Multi-level caching and database optimizations
2. **Security**: Defense-in-depth approach with MFA, RBAC, and encryption
3. **Maintainability**: Clean architecture patterns and comprehensive testing
4. **Performance**: Real-time monitoring and optimization techniques
5. **Reliability**: Proper error handling, logging, and monitoring
6. **Developer Experience**: Clear guidelines, automation, and tooling

These recommendations provide a solid foundation for scaling the Ruzizi Hotel Platform to handle increased load while maintaining security, performance, and code quality. Implementation should be prioritized based on business needs and current pain points.