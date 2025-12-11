import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import EstablishmentSelector from '@/components/admin/EstablishmentSelector';

// Mock fetch
global.fetch = jest.fn();

const mockEstablishments = [
  { id: 'est1', name: 'Hotel Ruzizi', location: { city: 'Bujumbura' } },
  { id: 'est2', name: 'Hotel Burundi', location: { city: 'Gitega' } },
  { id: 'est3', name: 'Hotel Tanganyika', location: { city: 'Rumonge' } }
];

const mockApiResponse = {
  success: true,
  data: {
    data: mockEstablishments,
    pagination: { page: 1, limit: 10, total: 3 }
  }
};

describe('EstablishmentSelector - Role-based Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });
  });

  describe('Admin Users (root/super_admin)', () => {
    test('should show ALL establishments for root admin', async () => {
      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="root"
          userEstablishmentId="est1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hotel Ruzizi - Bujumbura')).toBeInTheDocument();
        expect(screen.getByText('Hotel Burundi - Gitega')).toBeInTheDocument();
        expect(screen.getByText('Hotel Tanganyika - Rumonge')).toBeInTheDocument();
      });

      // Should show admin message
      expect(screen.getByText(/administrateur.*accès à tous les établissements.*3 disponibles/)).toBeInTheDocument();
    });

    test('should show ALL establishments for super_admin', async () => {
      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="super_admin"
          userEstablishmentId="est2"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hotel Ruzizi - Bujumbura')).toBeInTheDocument();
        expect(screen.getByText('Hotel Burundi - Gitega')).toBeInTheDocument();
        expect(screen.getByText('Hotel Tanganyika - Rumonge')).toBeInTheDocument();
      });

      // Should show admin message
      expect(screen.getByText(/administrateur.*accès à tous les établissements.*3 disponibles/)).toBeInTheDocument();
    });

    test('should allow admin to select any establishment', async () => {
      const mockOnChange = jest.fn();
      
      render(
        <EstablishmentSelector
          value=""
          onChange={mockOnChange}
          userRole="root"
          userEstablishmentId="est1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hotel Ruzizi - Bujumbura')).toBeInTheDocument();
      });

      // Select should not be disabled
      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });
  });

  describe('Non-Admin Users (manager/staff)', () => {
    test('should show ONLY assigned establishment for manager', async () => {
      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="manager"
          userEstablishmentId="est2"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hotel Burundi - Gitega')).toBeInTheDocument();
      });

      // Should NOT show other establishments
      expect(screen.queryByText('Hotel Ruzizi - Bujumbura')).not.toBeInTheDocument();
      expect(screen.queryByText('Hotel Tanganyika - Rumonge')).not.toBeInTheDocument();

      // Should show restriction message
      expect(screen.getByText(/accès est limité à votre établissement assigné/)).toBeInTheDocument();
    });

    test('should show ONLY assigned establishment for staff', async () => {
      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="staff"
          userEstablishmentId="est3"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hotel Tanganyika - Rumonge')).toBeInTheDocument();
      });

      // Should NOT show other establishments
      expect(screen.queryByText('Hotel Ruzizi - Bujumbura')).not.toBeInTheDocument();
      expect(screen.queryByText('Hotel Burundi - Gitega')).not.toBeInTheDocument();
    });

    test('should auto-select user establishment for non-admin', async () => {
      const mockOnChange = jest.fn();
      
      render(
        <EstablishmentSelector
          value=""
          onChange={mockOnChange}
          userRole="manager"
          userEstablishmentId="est2"
        />
      );

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('est2');
      });
    });

    test('should disable selection for non-admin users', async () => {
      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="manager"
          userEstablishmentId="est1"
        />
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeDisabled();
      });

      // Should show pre-selected message
      expect(screen.getByText('(Pré-sélectionné)')).toBeInTheDocument();
    });

    test('should show error when user has no assigned establishment', async () => {
      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="manager"
          userEstablishmentId={undefined}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Aucun établissement assigné à votre compte/)).toBeInTheDocument();
      });
    });

    test('should show error when assigned establishment not found', async () => {
      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="manager"
          userEstablishmentId="nonexistent"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/établissement assigné n'a pas été trouvé/)).toBeInTheDocument();
      });
    });
  });

  describe('Role Detection', () => {
    test('should correctly identify admin roles', async () => {
      const adminRoles = ['root', 'super_admin'];
      const nonAdminRoles = ['manager', 'staff', 'user'];

      for (const role of adminRoles) {
        render(
          <EstablishmentSelector
            key={role}
            value=""
            onChange={jest.fn()}
            userRole={role as any}
            userEstablishmentId="est1"
          />
        );

        await waitFor(() => {
          expect(screen.getByText(/administrateur/)).toBeInTheDocument();
        });

        cleanup();
      }

      for (const role of nonAdminRoles) {
        render(
          <EstablishmentSelector
            key={role}
            value=""
            onChange={jest.fn()}
            userRole={role as any}
            userEstablishmentId="est1"
          />
        );

        await waitFor(() => {
          expect(screen.getByText(/accès est limité/)).toBeInTheDocument();
        });

        cleanup();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="root"
          userEstablishmentId="est1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('should handle invalid API response structure', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }) // Invalid structure
      });

      render(
        <EstablishmentSelector
          value=""
          onChange={jest.fn()}
          userRole="root"
          userEstablishmentId="est1"
        />
      );

      await waitFor(() => {
        // Should handle gracefully and show no establishments
        expect(screen.getByText(/Sélectionner un établissement/)).toBeInTheDocument();
      });
    });
  });
});