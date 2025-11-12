import { ClientModel } from '@/models/Client.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult } from '@/lib/db/utils';
import type {
  CreateClientInput,
  UpdateClientInput,
  ClientResponse,
  ClientFilterOptions,
} from '@/types/client.types';

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
   * Get client by ID
   */
  static async getById(id: string): Promise<ClientResponse | null> {
    await connectDB();

    const client = await ClientModel.findById(id).populate('bookingHistory');

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
   * Get clients by classification
   */
  static async getByClassification(
    classification: 'regular' | 'walkin' | 'corporate'
  ): Promise<ClientResponse[]> {
    await connectDB();

    const clients = await ClientModel.findByClassification(classification);

    return clients.map((client) => client.toJSON() as unknown as ClientResponse);
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
   * Search clients
   */
  static async search(searchTerm: string): Promise<ClientResponse[]> {
    await connectDB();

    const clients = await ClientModel.find({
      $text: { $search: searchTerm },
    });

    return clients.map((client) => client.toJSON() as unknown as ClientResponse);
  }
}

export default ClientService;
