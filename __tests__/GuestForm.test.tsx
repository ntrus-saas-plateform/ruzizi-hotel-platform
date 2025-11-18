import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GuestForm from '../components/booking/GuestForm';

describe('GuestForm', () => {
  const mockGuest = {
    firstName: '',
    lastName: '',
    gender: 'M' as const,
    dateOfBirth: new Date('2000-01-01'),
    nationality: '',
    idType: 'passport' as const,
    idNumber: '',
    idExpiryDate: undefined,
    relationshipToMainClient: 'spouse' as const,
    relationshipDetails: '',
    notes: '',
    isMinor: false,
  };

  const mockOnChange = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnRemove.mockClear();
  });

  it('renders the form correctly', () => {
    render(<GuestForm guest={mockGuest} index={0} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date de naissance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nationalité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type de pièce d'identité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/numéro de pièce d'identité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lien avec le client principal/i)).toBeInTheDocument();
  });

  it('fills form fields and calls onChange', () => {
    render(<GuestForm guest={mockGuest} index={0} onChange={mockOnChange} />);

    // Fill first name
    fireEvent.change(screen.getByLabelText(/prénom/i), {
      target: { value: 'John' },
    });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockGuest,
      firstName: 'John',
    });

    // Fill last name
    fireEvent.change(screen.getByLabelText(/nom/i), {
      target: { value: 'Doe' },
    });

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockGuest,
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('calculates isMinor based on dateOfBirth', () => {
    render(<GuestForm guest={mockGuest} index={0} onChange={mockOnChange} />);

    // Set date of birth for a minor (under 18)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 10); // 10 years ago

    fireEvent.change(screen.getByLabelText(/date de naissance/i), {
      target: { value: birthDate.toISOString().split('T')[0] },
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOfBirth: birthDate,
        isMinor: true,
      })
    );
  });

  it('shows relationship details field when other is selected', () => {
    const guestWithOther = { ...mockGuest, relationshipToMainClient: 'other' as const };
    render(<GuestForm guest={guestWithOther} index={0} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/précisez la relation/i)).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    render(<GuestForm guest={mockGuest} index={0} onChange={mockOnChange} onRemove={mockOnRemove} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('displays guest index correctly', () => {
    render(<GuestForm guest={mockGuest} index={2} onChange={mockOnChange} />);

    expect(screen.getByText('Invité 3')).toBeInTheDocument();
  });

  it('displays minor indicator when isMinor is true', () => {
    const minorGuest = { ...mockGuest, isMinor: true };
    render(<GuestForm guest={minorGuest} index={0} onChange={mockOnChange} />);

    expect(screen.getByText('(Mineur)')).toBeInTheDocument();
  });
});