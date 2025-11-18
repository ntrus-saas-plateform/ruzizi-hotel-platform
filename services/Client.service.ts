import { ClientModel } from '@/models/Client.model';
import { BookingModel } from '@/models/Booking.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult } from '@/lib/db/utils';
import type {
  CreateClientInput,
  UpdateClientInput,
  ClientResponse,
  ClientFilterOptions,
} from '@/types/client.types';
import type { BookingResponse } from '@/types/booking.types';

/**
 * Client Service
 * Handles all client-related operations
 */
export class ClientService {
  /**
   * Create a new client
   */
  static async create(data: CreateClientInput): Promise<ClientResponse> {
    await connectDB();

    // Check if client already exists
    const existing = await ClientModel.findByEmail(data.personalInfo.email);

    if (existing) {
      throw new Error('A client with this email already exists');
    }

    // Create client
    const client = await ClientModel.create(data);

    return client.toJSON() as unknown as ClientResponse;
  }

  /**
   * Get client by ID with optional booking history loading
   */
  static async getById(
    id: string,
    includeBookingHistory: boolean = false,
    bookingHistoryPage: number = 1,
    bookingHistoryLimit: number = 10
  ): Promise<ClientResponse | null> {
    await connectDB();

    let clientQuery = ClientModel.findById(id);

    if (includeBookingHistory) {
      // Populate booking history with pagination
      clientQuery = clientQuery.populate({
        path: 'bookingHistory',
        options: {
          sort: { createdAt: -1 },
          skip: (bookingHistoryPage - 1) * bookingHistoryLimit,
          limit: bookingHistoryLimit,
        },
        select: 'bookingCode status checkIn checkOut pricingDetails createdAt',
      });
    }

    const client = await clientQuery;

    if (!client) {
      return null;
    }

    return client.toJSON() as unknown as ClientResponse;
  }

  /**
   * Get client by email
   */
  static async getByEmail(email: string): Promise<ClientResponse | null> {
    await connectDB();

    const client = await ClientModel.findByEmail(email);

    if (!client) {
      return null;
    }

    return client.toJSON() as unknown as ClientResponse;
  }

  /**
   * Get all clients with filters and pagination
   */
  static async getAll(
    filters: ClientFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<ClientResponse>> {
    await connectDB();

    // Build query
    const query: any = {};

    if (filters.classification) {
      query.classification = filters.classification;
    }

    if (filters.email) {
      query['personalInfo.email'] = filters.email.toLowerCase();
    }

    if (filters.phone) {
      query['personalInfo.phone'] = filters.phone;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Execute query with pagination
    const result = await paginate(ClientModel.find(query), {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: result.data.map((client) => client.toJSON() as unknown as ClientResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Update client
   */
  static async update(id: string, data: UpdateClientInput): Promise<ClientResponse | null> {
    await connectDB();

    const client = await ClientModel.findById(id);

    if (!client) {
      return null;
    }

    // If email is being changed, check if new email is available
    if (data.personalInfo?.email && data.personalInfo.email !== client.personalInfo.email) {
      const existing = await ClientModel.findByEmail(data.personalInfo.email);
      if (existing) {
        throw new Error('A client with this email already exists');
      }
    }

    // Update fields
    if (data.personalInfo) {
      Object.assign(client.personalInfo, data.personalInfo);
    }

    if (data.classification) {
      client.classification = data.classification;
    }

    if (data.preferences) {
      client.preferences = data.preferences;
    }

    if (data.debt !== undefined) {
      client.debt = data.debt;
    }

    if (data.discounts) {
      client.discounts = data.discounts;
    }

    if (data.notes !== undefined) {
      client.notes = data.notes;
    }

    await client.save();

    return client.toJSON() as unknown as ClientResponse;
  }

  /**
   * Delete client
   */
  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const client = await ClientModel.findById(id);

    if (!client) {
      return false;
    }

    await client.deleteOne();

    return true;
  }

  /**
   * Get clients by classification with pagination
   */
  static async getByClassification(
    classification: 'regular' | 'walkin' | 'corporate',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<ClientResponse>> {
    await connectDB();

    // Execute query with pagination
    const result = await paginate(
      ClientModel.find({ classification })
        .hint({ classification: 1 })
        .select('personalInfo classification totalStays totalSpent debt createdAt'),
      {
        page,
        limit,
        sort: { totalSpent: -1 }, // Sort by spending
      }
    );

    return {
      data: result.data.map((client) => client.toJSON() as unknown as ClientResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Add discount to client
   */
  static async addDiscount(
    id: string,
    discount: { type: string; percentage: number; validUntil?: Date }
  ): Promise<ClientResponse | null> {
    await connectDB();

    const client = await ClientModel.findById(id);

    if (!client) {
      return null;
    }

    client.discounts.push(discount);
    await client.save();

    return client.toJSON() as unknown as ClientResponse;
  }

  /**
   * Remove discount from client
   */
  static async removeDiscount(id: string, discountIndex: number): Promise<ClientResponse | null> {
    await connectDB();

    const client = await ClientModel.findById(id);

    if (!client) {
      return null;
    }

    if (discountIndex >= 0 && discountIndex < client.discounts.length) {
      client.discounts.splice(discountIndex, 1);
      await client.save();
    }

    return client.toJSON() as unknown as ClientResponse;
  }

  /**
   * Get top clients by total spent
   */
  static async getTopClients(limit: number = 10): Promise<ClientResponse[]> {
    await connectDB();

    const clients = await ClientModel.find().sort({ totalSpent: -1 }).limit(limit);

    return clients.map((client) => client.toJSON() as unknown as ClientResponse);
  }

  /**
   * Get client's booking history with lazy loading
   */
  static async getClientBookingHistory(
    clientId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<BookingResponse>> {
    await connectDB();

    const client = await ClientModel.findById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    // Get booking history IDs with pagination
    const bookingIds = client.bookingHistory.slice(
      (page - 1) * limit,
      page * limit
    );

    if (bookingIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: client.bookingHistory.length,
          totalPages: Math.ceil(client.bookingHistory.length / limit),
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      };
    }

    // Fetch booking details
    const bookings = await BookingModel.find({
      _id: { $in: bookingIds },
    })
      .select('bookingCode status paymentStatus bookingType checkIn checkOut numberOfGuests pricingDetails createdAt')
      .sort({ createdAt: -1 });

    return {
      data: bookings.map((booking) => booking.toJSON() as unknown as BookingResponse),
      pagination: {
        page,
        limit,
        total: client.bookingHistory.length,
        totalPages: Math.ceil(client.bookingHistory.length / limit),
        hasNextPage: page * limit < client.bookingHistory.length,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Search clients with pagination
   */
  static async search(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<ClientResponse>> {
    await connectDB();

    const query = {
      $text: { $search: searchTerm },
    };

    // Execute query with pagination
    const result = await paginate(
      ClientModel.find(query).select(
        'personalInfo classification totalStays totalSpent debt createdAt'
      ),
      {
        page,
        limit,
        sort: { score: { $meta: 'textScore' } } as any, // Sort by relevance
      }
    );

    return {
      data: result.data.map((client) => client.toJSON() as unknown as ClientResponse),
      pagination: result.pagination,
    };
  }
}

export default ClientService;
