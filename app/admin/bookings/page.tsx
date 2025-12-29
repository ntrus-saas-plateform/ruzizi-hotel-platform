'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookings, useEstablishments } from '@/hooks/useQueries';
import type { BookingResponse } from '@/types/booking.types';
import type { EstablishmentResponse } from '@/types/establishment.types';

export default function BookingsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    bookingType: '',
    establishmentId: '',
    checkInFrom: '',
    checkInTo: '',
  });

  // React Query hooks
  const { data: bookingsData, isLoading: loading, error: bookingsError } = useBookings({
    ...filters,
    page: currentPage,
    limit: 10,
  });

  const { data: establishmentsData } = useEstablishments();

  const bookings = bookingsData?.data || [];
  const totalPages = bookingsData?.pagination?.totalPages || 1;
  const error = bookingsError?.message || '';
  const establishments = establishmentsData?.data || [];


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      bookingType: '',
      establishmentId: '',
      checkInFrom: '',
      checkInTo: '',
    });
    setCurrentPage(1); // Reset to first page when filters are reset
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmée',
      accepted: 'Acceptée',
      pending: 'En attente',
      cancelled: 'Annulée',
      completed: 'Terminée',
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Payé',
      partial: 'Partiel',
      unpaid: 'Non payé',
    };
    return labels[status] || status;
  };

  // New functions for booking management
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('ruzizi_access_token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh bookings data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'acceptation');
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Erreur lors de l\'acceptation de la réservation');
    }
  };

  const handleGenerateInvoice = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('ruzizi_access_token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`/api/bookings/${bookingId}/invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-reservation-${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Erreur lors de la génération de la facture');
    }
  };

  const handleGenerateClientsList = async (includeFullInfo: boolean = true) => {
    console.log('=== handleGenerateClientsList called ===');
    console.log('includeFullInfo:', includeFullInfo);
    
    try {
      const requestBody = {
        includeFullInfo,
        establishmentId: filters.establishmentId || undefined,
        dateFrom: filters.checkInFrom || undefined,
        dateTo: filters.checkInTo || undefined,
      };
      
      console.log('Request body:', requestBody);

      // Use absolute URL to avoid any routing issues
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}/api/bookings/clients-list`;
      console.log('Full URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const blob = await response.blob();
        console.log('Blob size:', blob.size);
        
        // Create unique filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `liste-clients-${includeFullInfo ? 'complet' : 'simple'}-${timestamp}.pdf`;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`PDF downloaded successfully: ${filename}`);
        console.log(`PDF size: ${blob.size} bytes`);
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Erreur lors de la génération' };
        }
        alert(error.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('=== CATCH BLOCK ===');
      console.error('Error type:', typeof error);
      console.error('Error name:', (error as any)?.name);
      console.error('Error message:', (error as any)?.message);
      console.error('Full error:', error);
      
      if (error instanceof Error && error.message.includes('fetch')) {
        alert('Erreur de connexion au serveur. Détails: ' + error.message);
      } else {
        alert('Erreur lors de la génération de la liste des clients: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-luxury-dark">Réservations</h1>
              <p className="text-luxury-text mt-1 text-sm sm:text-base">
                Gérer toutes les réservations
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/admin/bookings/create')}
                className="px-4 py-2.5 bg-luxury-gold text-luxury-cream rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle Réservation
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateClientsList(true)}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Liste Clients (Complet)
                </button>
                <button
                  onClick={() => handleGenerateClientsList(false)}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Liste Clients (Simple)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6" aria-labelledby="filters-heading">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="filters-heading" className="text-base sm:text-lg font-semibold text-luxury-dark flex items-center">
                <svg className="w-5 h-5 mr-2 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtres
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-3 py-2 text-sm text-luxury-gold hover:bg-blue-50 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={showFilters}
                aria-controls="filters-content"
              >
                {showFilters ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            
            <div id="filters-content" className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recherche
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Code, nom, email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Établissement
                  </label>
                  <select
                    name="establishmentId"
                    value={filters.establishmentId}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    {establishments.map((est: EstablishmentResponse, index: number) => (
                      <option key={est.id + '-' + index} value={est.id}>{est.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="pending">En attente</option>
                    <option value="accepted">Acceptée</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="cancelled">Annulée</option>
                    <option value="completed">Terminée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paiement
                  </label>
                  <select
                    name="paymentStatus"
                    value={filters.paymentStatus}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="unpaid">Non payé</option>
                    <option value="partial">Partiel</option>
                    <option value="paid">Payé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    name="bookingType"
                    value={filters.bookingType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="online">En ligne</option>
                    <option value="onsite">Sur place</option>
                    <option value="walkin">Passage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrivée (de)
                  </label>
                  <input
                    type="date"
                    name="checkInFrom"
                    value={filters.checkInFrom}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrivée (à)
                  </label>
                  <input
                    type="date"
                    name="checkInTo"
                    value={filters.checkInTo}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* View Toggle & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-luxury-text">
              <span className="font-semibold text-luxury-dark">{bookings.length}</span> réservation(s)
            </div>
          </div>
          
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 rounded transition-all ${
                viewMode === 'cards' 
                  ? 'bg-luxury-gold text-luxury-cream' 
                  : 'text-luxury-text hover:text-luxury-gold'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded transition-all ${
                viewMode === 'table' 
                  ? 'bg-luxury-gold text-luxury-cream' 
                  : 'text-luxury-text hover:text-luxury-gold'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="mt-4 text-luxury-text">Chargement...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-luxury-text text-lg font-medium">Aucune réservation trouvée</p>
            <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos filtres</p>
          </div>
        ) : viewMode === 'table' ? (
          <>
            {/* Table View - Desktop only */}
            <div className="hidden md:block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking: BookingResponse) => (
                        <tr key={booking.bookingCode} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-luxury-dark">{booking.bookingCode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-luxury-dark">{booking.clientInfo.firstName} {booking.clientInfo.lastName}</div>
                            <div className="text-sm text-gray-500">{booking.clientInfo.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-luxury-dark">{new Date(booking.checkIn).toLocaleDateString('fr-FR')}</div>
                            <div className="text-sm text-gray-500">au {new Date(booking.checkOut).toLocaleDateString('fr-FR')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-luxury-dark">{booking.pricingDetails.total.toLocaleString()} BIF</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(booking.paymentStatus)}`}>
                              {getPaymentStatusLabel(booking.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <button
                                  onClick={() => booking.id && handleAcceptBooking(booking.id)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-xs"
                                  disabled={!booking.id}
                                >
                                  Accepter
                                </button>
                              )}
                              <button
                                onClick={() => booking.id && handleGenerateInvoice(booking.id)}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium text-xs"
                                disabled={!booking.id}
                              >
                                Facture
                              </button>
                              <button
                                onClick={() => booking.id && router.push(`/admin/bookings/${booking.id}`)}
                                className="px-2 py-1 bg-luxury-gold text-luxury-cream rounded hover:bg-blue-900 transition font-medium text-xs"
                                disabled={!booking.id}
                              >
                                Détails
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Mobile-friendly message for table view */}
            <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <svg className="w-8 h-8 text-luxury-gold mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-blue-800 font-medium">Vue tableau non disponible</p>
              <p className="text-luxury-gold text-sm mt-1">Utilisez un écran plus large ou passez en vue cartes</p>
              <button
                onClick={() => setViewMode('cards')}
                className="mt-3 px-4 py-2 bg-luxury-gold text-luxury-cream text-sm rounded-lg  transition"
              >
                Passer en vue cartes
              </button>
            </div>
          </>
        ) : (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking: BookingResponse) => (
              <div
                key={booking.bookingCode}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Code</p>
                      <p className="text-lg font-bold text-luxury-dark">{booking.bookingCode}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {getPaymentStatusLabel(booking.paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-luxury-dark font-medium">
                        {booking.clientInfo.firstName} {booking.clientInfo.lastName}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-luxury-text">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {booking.clientInfo.email}
                    </div>

                    <div className="flex items-center text-sm text-luxury-text">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(booking.checkIn).toLocaleDateString('fr-FR')} → {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Montant total</p>
                      <p className="text-xl font-bold text-luxury-gold">
                        {booking.pricingDetails.total.toLocaleString()} <span className="text-sm">BIF</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => booking.id && handleAcceptBooking(booking.id)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                          disabled={!booking.id}
                        >
                          Accepter
                        </button>
                      )}
                      <button
                        onClick={() => booking.id && handleGenerateInvoice(booking.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                        disabled={!booking.id}
                      >
                        Facture
                      </button>
                      <button
                        onClick={() => booking.id && router.push(`/admin/bookings/${booking.id}`)}
                        className="px-3 py-2 bg-luxury-gold text-luxury-cream rounded-lg  transition font-medium text-sm"
                        disabled={!booking.id}
                      >
                        Détails
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
