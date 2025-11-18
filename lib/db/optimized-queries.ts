import mongoose from 'mongoose';
import { cache } from '@/lib/performance/cache';

/**
 * Optimized database queries using advanced aggregation pipelines
 * Includes caching for frequently accessed data
 */

export interface OptimizedQueryOptions {
  useCache?: boolean;
  cacheTtl?: number;
}

/**
 * Get establishments with aggregated statistics
 */
export async function getEstablishmentsWithStats(options: OptimizedQueryOptions = {}) {
  const cacheKey = 'establishments_with_stats';
  const { useCache = true, cacheTtl = 600 } = options;

  if (useCache) {
    const cached = await cache.getEstablishments();
    if (cached) {
      return cached;
    }
  }

  const pipeline = [
    {
      $match: { isActive: true }
    },
    {
      $lookup: {
        from: 'accommodations',
        localField: '_id',
        foreignField: 'establishmentId',
        as: 'accommodations',
        pipeline: [
          {
            $match: { status: 'available' }
          },
          {
            $group: {
              _id: null,
              totalRooms: { $sum: 1 },
              minPrice: { $min: '$pricing.basePrice' },
              maxPrice: { $max: '$pricing.basePrice' },
              avgPrice: { $avg: '$pricing.basePrice' }
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'establishmentId',
        as: 'bookings',
        pipeline: [
          {
            $match: {
              status: { $in: ['confirmed', 'completed'] },
              checkIn: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            }
          },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalRevenue: { $sum: '$pricingDetails.total' }
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'establishmentId',
        as: 'staff',
        pipeline: [
          {
            $match: { role: { $in: ['manager', 'staff'] } }
          },
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ]
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        location: 1,
        contacts: 1,
        pricingMode: 1,
        images: 1,
        amenities: 1,
        policies: 1,
        managerId: 1,
        staffIds: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        stats: {
          totalRooms: { $ifNull: [{ $arrayElemAt: ['$accommodations.totalRooms', 0] }, 0] },
          availableRooms: { $ifNull: [{ $arrayElemAt: ['$accommodations.totalRooms', 0] }, 0] },
          minPrice: { $ifNull: [{ $arrayElemAt: ['$accommodations.minPrice', 0] }, 0] },
          maxPrice: { $ifNull: [{ $arrayElemAt: ['$accommodations.maxPrice', 0] }, 0] },
          avgPrice: { $ifNull: [{ $arrayElemAt: ['$accommodations.avgPrice', 0] }, 0] },
          recentBookings: { $ifNull: [{ $arrayElemAt: ['$bookings.totalBookings', 0] }, 0] },
          recentRevenue: { $ifNull: [{ $arrayElemAt: ['$bookings.totalRevenue', 0] }, 0] },
          totalStaff: { $size: '$staff' }
        }
      }
    },
    {
      $sort: { 'stats.recentBookings': -1 as const, createdAt: -1 as const }
    }
  ];

  const result = await mongoose.model('Establishment').aggregate(pipeline);

  if (useCache) {
    await cache.setEstablishments(result, cacheTtl);
  }

  return result;
}

/**
 * Get user permissions with role-based access control
 */
export async function getUserPermissionsOptimized(userId: string, options: OptimizedQueryOptions = {}) {
  const cacheKey = `user_permissions_${userId}`;
  const { useCache = true, cacheTtl = 300 } = options;

  if (useCache) {
    const cached = await cache.getUserPermissions(userId);
    if (cached) {
      return cached;
    }
  }

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(userId) }
    },
    {
      $lookup: {
        from: 'establishments',
        localField: 'establishmentId',
        foreignField: '_id',
        as: 'establishment',
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              location: 1,
              isActive: 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: 'name',
        as: 'roleDetails'
      }
    },
    {
      $project: {
        _id: 1,
        email: 1,
        role: 1,
        establishmentId: 1,
        permissions: {
          $ifNull: [
            { $arrayElemAt: ['$roleDetails.permissions', 0] },
            []
          ]
        },
        establishment: { $arrayElemAt: ['$establishment', 0] },
        profile: 1,
        isActive: 1
      }
    }
  ];

  const result = await mongoose.model('User').aggregate(pipeline);
  const permissions = result.length > 0 ? result[0] : null;

  if (useCache && permissions) {
    await cache.setUserPermissions(userId, permissions, cacheTtl);
  }

  return permissions;
}

/**
 * Get booking analytics with advanced aggregation
 */
export async function getBookingAnalytics(
  establishmentId?: string,
  dateRange?: { start: Date; end: Date },
  options: OptimizedQueryOptions = {}
) {
  const cacheKey = `booking_analytics_${establishmentId || 'all'}_${dateRange?.start?.toISOString()}_${dateRange?.end?.toISOString()}`;
  const { useCache = true, cacheTtl = 300 } = options;

  if (useCache) {
    const cached = await cache.getCommonQuery(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const matchConditions: any = {
    status: { $in: ['confirmed', 'completed'] }
  };

  if (establishmentId) {
    matchConditions.establishmentId = new mongoose.Types.ObjectId(establishmentId);
  }

  if (dateRange) {
    matchConditions.checkIn = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }

  const pipeline = [
    { $match: matchConditions },
    {
      $lookup: {
        from: 'establishments',
        localField: 'establishmentId',
        foreignField: '_id',
        as: 'establishment'
      }
    },
    {
      $lookup: {
        from: 'accommodations',
        localField: 'accommodationId',
        foreignField: '_id',
        as: 'accommodation'
      }
    },
    {
      $unwind: { path: '$establishment', preserveNullAndEmptyArrays: true }
    },
    {
      $unwind: { path: '$accommodation', preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: {
          establishment: '$establishmentId',
          establishmentName: '$establishment.name',
          month: { $dateToString: { format: '%Y-%m', date: '$checkIn' } },
          bookingType: '$bookingType'
        },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricingDetails.total' },
        avgRevenue: { $avg: '$pricingDetails.total' },
        totalGuests: { $sum: '$numberOfGuests' },
        bookingTypes: {
          $push: '$bookingType'
        }
      }
    },
    {
      $group: {
        _id: {
          establishment: '$_id.establishment',
          establishmentName: '$_id.establishmentName',
          month: '$_id.month'
        },
        bookingTypes: {
          $push: {
            type: '$_id.bookingType',
            count: '$totalBookings',
            revenue: '$totalRevenue'
          }
        },
        totalBookings: { $sum: '$totalBookings' },
        totalRevenue: { $sum: '$totalRevenue' },
        avgRevenue: { $avg: '$avgRevenue' },
        totalGuests: { $sum: '$totalGuests' }
      }
    },
    {
      $project: {
        _id: 0,
        establishmentId: '$_id.establishment',
        establishmentName: '$_id.establishmentName',
        month: '$_id.month',
        totalBookings: 1,
        totalRevenue: 1,
        avgRevenue: 1,
        totalGuests: 1,
        bookingTypeBreakdown: '$bookingTypes'
      }
    },
    {
      $sort: { month: -1 as const, totalRevenue: -1 as const }
    }
  ];

  const result = await mongoose.model('Booking').aggregate(pipeline);

  if (useCache) {
    await cache.setCommonQuery(cacheKey, result, cacheTtl);
  }

  return result;
}

/**
 * Get accommodation availability with optimized query
 */
export async function getAccommodationAvailability(
  establishmentId: string,
  startDate: Date,
  endDate: Date,
  options: OptimizedQueryOptions = {}
) {
  const cacheKey = `accommodation_availability_${establishmentId}_${startDate.toISOString()}_${endDate.toISOString()}`;
  const { useCache = true, cacheTtl = 300 } = options;

  if (useCache) {
    const cached = await cache.getCommonQuery(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const pipeline = [
    {
      $match: {
        establishmentId: new mongoose.Types.ObjectId(establishmentId),
        status: 'available'
      }
    },
    {
      $lookup: {
        from: 'bookings',
        let: { accommodationId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$accommodationId', '$$accommodationId'] },
              status: { $in: ['confirmed', 'pending'] },
              $or: [
                { checkIn: { $lt: endDate }, checkOut: { $gt: startDate } }
              ]
            }
          }
        ],
        as: 'conflictingBookings'
      }
    },
    {
      $addFields: {
        isAvailable: { $eq: [{ $size: '$conflictingBookings' }, 0] }
      }
    },
    {
      $match: { isAvailable: true }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        type: 1,
        capacity: 1,
        pricing: 1,
        images: 1,
        amenities: 1,
        description: 1
      }
    },
    {
      $sort: { 'pricing.basePrice': 1 as const }
    }
  ];

  const result = await mongoose.model('Accommodation').aggregate(pipeline);

  if (useCache) {
    await cache.setCommonQuery(cacheKey, result, cacheTtl);
  }

  return result;
}

/**
 * Get dashboard statistics with single optimized query
 */
export async function getDashboardStats(
  establishmentId?: string,
  options: OptimizedQueryOptions = {}
) {
  const cacheKey = `dashboard_stats_${establishmentId || 'all'}`;
  const { useCache = true, cacheTtl = 300 } = options;

  if (useCache) {
    const cached = await cache.getCommonQuery(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const matchConditions: any = {};
  if (establishmentId) {
    matchConditions.establishmentId = new mongoose.Types.ObjectId(establishmentId);
  }

  const pipeline = [
    {
      $facet: {
        // Current bookings
        currentBookings: [
          {
            $match: {
              ...matchConditions,
              status: 'confirmed',
              checkIn: { $lte: new Date() },
              checkOut: { $gte: new Date() }
            }
          },
          { $count: 'count' }
        ],
        // Today's check-ins
        todaysCheckIns: [
          {
            $match: {
              ...matchConditions,
              status: 'confirmed',
              checkIn: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
              }
            }
          },
          { $count: 'count' }
        ],
        // Today's check-outs
        todaysCheckOuts: [
          {
            $match: {
              ...matchConditions,
              status: 'confirmed',
              checkOut: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
              }
            }
          },
          { $count: 'count' }
        ],
        // Revenue this month
        monthlyRevenue: [
          {
            $match: {
              ...matchConditions,
              status: { $in: ['confirmed', 'completed'] },
              checkIn: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$pricingDetails.total' }
            }
          }
        ],
        // Total accommodations
        totalAccommodations: [
          { $match: matchConditions },
          { $count: 'count' }
        ],
        // Occupancy rate
        occupancyRate: [
          {
            $match: {
              ...matchConditions,
              status: { $in: ['confirmed', 'reserved'] }
            }
          },
          {
            $group: {
              _id: null,
              occupied: { $sum: 1 }
            }
          }
        ]
      }
    },
    {
      $project: {
        currentBookings: { $ifNull: [{ $arrayElemAt: ['$currentBookings.count', 0] }, 0] },
        todaysCheckIns: { $ifNull: [{ $arrayElemAt: ['$todaysCheckIns.count', 0] }, 0] },
        todaysCheckOuts: { $ifNull: [{ $arrayElemAt: ['$todaysCheckOuts.count', 0] }, 0] },
        monthlyRevenue: { $ifNull: [{ $arrayElemAt: ['$monthlyRevenue.total', 0] }, 0] },
        totalAccommodations: { $ifNull: [{ $arrayElemAt: ['$totalAccommodations.count', 0] }, 0] },
        occupiedAccommodations: { $ifNull: [{ $arrayElemAt: ['$occupancyRate.occupied', 0] }, 0] }
      }
    },
    {
      $addFields: {
        occupancyRate: {
          $cond: {
            if: { $gt: ['$totalAccommodations', 0] },
            then: { $multiply: [{ $divide: ['$occupiedAccommodations', '$totalAccommodations'] }, 100] },
            else: 0
          }
        }
      }
    }
  ];

  const result = await mongoose.model('Booking').aggregate(pipeline);
  const stats = result.length > 0 ? result[0] : {};

  if (useCache) {
    await cache.setCommonQuery(cacheKey, stats, cacheTtl);
  }

  return stats;
}