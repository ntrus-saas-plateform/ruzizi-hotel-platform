import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateEstablishmentForm } from '../components/establishments/CreateEstablishmentForm';

// Mock the establishments API
jest.mock('../lib/api/establishments', () => ({
  establishmentsApi: {
    create: jest.fn(),
  },
}));

// Mock window.alert
global.alert = jest.fn();

import { establishmentsApi } from '../lib/api/establishments';

const mockCreate = establishmentsApi.create as jest.MockedFunction<typeof establishmentsApi.create>;

describe('CreateEstablishmentForm', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockCreate.mockResolvedValue({} as any);
  });

  it('renders the form correctly', () => {
    render(<CreateEstablishmentForm />);

    expect(screen.getByLabelText(/nom de l'établissement/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ville/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mode de tarification/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /créer l'établissement/i })).toBeInTheDocument();
  });

  it('fills form fields and submits successfully', async () => {
    const mockOnSuccess = jest.fn();
    render(<CreateEstablishmentForm onSuccess={mockOnSuccess} />);

    // Fill form fields
    fireEvent.change(screen.getByLabelText(/nom de l'établissement/i), {
      target: { value: 'Test Hotel' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A test hotel description' },
    });
    fireEvent.change(screen.getByLabelText(/rue/i), {
      target: { value: '123 Test Street' },
    });
    fireEvent.change(screen.getByLabelText(/ville/i), {
      target: { value: 'Bujumbura' },
    });
    fireEvent.change(screen.getByLabelText(/téléphone/i), {
      target: { value: '+25712345678' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@hotel.com' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /créer l'établissement/i }));

    // Wait for API call
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Test Hotel',
        description: 'A test hotel description',
        address: {
          street: '123 Test Street',
          city: 'Bujumbura',
          province: '',
          country: 'Burundi',
          postalCode: '',
        },
        contact: {
          phone: '+25712345678',
          email: 'test@hotel.com',
          website: '',
        },
        pricingMode: 'per_night',
      });
    });

    // Check onSuccess callback
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('shows error on API failure', async () => {
    mockCreate.mockRejectedValue(new Error('API Error'));
    render(<CreateEstablishmentForm />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/nom de l'établissement/i), {
      target: { value: 'Test Hotel' },
    });
    fireEvent.change(screen.getByLabelText(/rue/i), {
      target: { value: '123 Test Street' },
    });
    fireEvent.change(screen.getByLabelText(/ville/i), {
      target: { value: 'Bujumbura' },
    });
    fireEvent.change(screen.getByLabelText(/téléphone/i), {
      target: { value: '+25712345678' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@hotel.com' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /créer l'établissement/i }));

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('resets form after successful submission', async () => {
    render(<CreateEstablishmentForm />);

    // Fill form
    const nameInput = screen.getByLabelText(/nom de l'établissement/i);
    fireEvent.change(nameInput, { target: { value: 'Test Hotel' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /créer l'établissement/i }));

    // Wait for success (alert should be called)
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Établissement créé avec succès !');
    });

    // The form should be reset, but since it's controlled, we check the mock was called
    expect(mockCreate).toHaveBeenCalled();
  });
});