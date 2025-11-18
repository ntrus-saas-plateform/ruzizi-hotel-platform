import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MainClientForm from '../components/booking/MainClientForm';

describe('MainClientForm', () => {
  const mockClient = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'M' as const,
    dateOfBirth: new Date('1990-01-01'),
    nationality: '',
    idType: 'passport' as const,
    idNumber: '',
    idExpiryDate: undefined,
    address: '',
    city: '',
    country: '',
    postalCode: '',
    preferredLanguage: 'fr',
    customerType: 'individual' as const,
    companyName: '',
    loyaltyCardNumber: '',
    notes: '',
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the form correctly', () => {
    render(<MainClientForm client={mockClient} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date de naissance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse complète/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ville/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pays/i)).toBeInTheDocument();
  });

  it('fills form fields and calls onChange', () => {
    render(<MainClientForm client={mockClient} onChange={mockOnChange} />);

    // Fill first name
    fireEvent.change(screen.getByLabelText(/prénom/i), {
      target: { value: 'John' },
    });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockClient,
      firstName: 'John',
    });

    // Fill email
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockClient,
      firstName: 'John',
      email: 'john@example.com',
    });
  });

  it('shows company name field when corporate customer type is selected', () => {
    const corporateClient = { ...mockClient, customerType: 'corporate' as const };
    render(<MainClientForm client={corporateClient} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/nom de l'entreprise/i)).toBeInTheDocument();
  });

  it('shows company name field when agency customer type is selected', () => {
    const agencyClient = { ...mockClient, customerType: 'agency' as const };
    render(<MainClientForm client={agencyClient} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/nom de l'entreprise/i)).toBeInTheDocument();
  });

  it('does not show company name field for individual customers', () => {
    render(<MainClientForm client={mockClient} onChange={mockOnChange} />);

    expect(screen.queryByLabelText(/nom de l'entreprise/i)).not.toBeInTheDocument();
  });

  it('handles date of birth input correctly', () => {
    render(<MainClientForm client={mockClient} onChange={mockOnChange} />);

    const birthDate = new Date('1985-05-15');
    fireEvent.change(screen.getByLabelText(/date de naissance/i), {
      target: { value: birthDate.toISOString().split('T')[0] },
    });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockClient,
      dateOfBirth: birthDate,
    });
  });

  it('handles ID expiry date input correctly', () => {
    render(<MainClientForm client={mockClient} onChange={mockOnChange} />);

    const expiryDate = new Date('2030-12-31');
    fireEvent.change(screen.getByLabelText(/date d'expiration/i), {
      target: { value: expiryDate.toISOString().split('T')[0] },
    });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockClient,
      idExpiryDate: expiryDate,
    });
  });

  it('displays the main client form title', () => {
    render(<MainClientForm client={mockClient} onChange={mockOnChange} />);

    expect(screen.getByText(/informations du client principal/i)).toBeInTheDocument();
  });
});