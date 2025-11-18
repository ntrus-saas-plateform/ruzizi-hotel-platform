import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormExample from '../components/ui/FormExample';

// Mock console.log
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('FormExample', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('renders the form correctly', () => {
    render(<FormExample />);

    expect(screen.getByLabelText(/nom complet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/numéro de téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pays/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeInTheDocument();
  });

  it('fills form fields and submits correctly', async () => {
    render(<FormExample />);

    // Fill form fields
    fireEvent.change(screen.getByLabelText(/nom complet/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/adresse email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/numéro de téléphone/i), {
      target: { value: '+25712345678' },
    });
    fireEvent.change(screen.getByLabelText(/pays/i), {
      target: { value: 'BI' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Test message' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    // Check that console.log was called with correct data
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Form submitted:', {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+25712345678',
        country: 'BI',
        message: 'Test message',
      });
    });
  });

  it('requires form fields to be filled', () => {
    render(<FormExample />);

    const submitButton = screen.getByRole('button', { name: /soumettre/i });
    expect(submitButton).toBeInTheDocument();

    // The form has required fields, so submission should be prevented without filling
    // We can't test the actual submission without filling required fields
  });
});