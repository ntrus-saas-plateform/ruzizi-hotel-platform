import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from '../components/frontoffice/ContactForm';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'fr'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<ContactForm />);

    expect(screen.getByPlaceholderText(/votre nom complet/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/votre@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+257 xx xx xx xx/i)).toBeInTheDocument();
    expect(screen.getByText(/sujet/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/décrivez votre demande/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer le message/i })).toBeInTheDocument();
  });

  it('fills form fields and submits successfully', async () => {
    const mockOnSubmit = jest.fn();
    render(<ContactForm onSubmit={mockOnSubmit} />);

    // Fill form fields
    fireEvent.change(screen.getByPlaceholderText(/votre nom complet/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText(/votre@email.com/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+257 xx xx xx xx/i), {
      target: { value: '+25712345678' },
    });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Réservation' },
    });
    fireEvent.change(screen.getByPlaceholderText(/décrivez votre demande/i), {
      target: { value: 'Test message' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /envoyer le message/i }));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/message envoyé avec succès/i)).toBeInTheDocument();
    });

    // Check that onSubmit was called with correct data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+25712345678',
      subject: 'Réservation',
      message: 'Test message',
      preferredContact: 'email',
    });
  });

  it('shows validation error for missing required fields', async () => {
    render(<ContactForm />);

    // Submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /envoyer le message/i }));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/ce champ est requis/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<ContactForm />);

    // Fill with invalid email
    fireEvent.change(screen.getByPlaceholderText(/votre nom complet/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText(/votre@email.com/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Réservation' },
    });
    fireEvent.change(screen.getByPlaceholderText(/décrivez votre demande/i), {
      target: { value: 'Test message' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /envoyer le message/i }));

    // Check for email error
    await waitFor(() => {
      expect(screen.getByText(/adresse email invalide/i)).toBeInTheDocument();
    });
  });
});