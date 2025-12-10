'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import EstablishmentSelector from '@/components/admin/EstablishmentSelector';
import type { InvoiceItem } from '@/types/invoice.types';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    bookingId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    dueDate: '',
    discountAmount: '',
    discountReason: '',
    taxRate: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  useEffect(() => {
    if (selectedEstablishment) {
      fetchBookings();
    }
  }, [selectedEstablishment]);

  useEffect(() => {
    if (formData.bookingId) {
      const booking = bookings.find((b) => b.id === formData.bookingId);
      setSelectedBooking(booking);
      if (booking) {
        setFormData((prev) => ({
          ...prev,
          clientName: `${booking.clientInfo.firstName} ${booking.clientInfo.lastName}`,
          clientEmail: booking.clientInfo.email,
          clientPhone: booking.clientInfo.phone,
        }));
        setItems([
          {
            description: `Hébergement - ${booking.pricingDetails.quantity} ${
              booking.pricingDetails.mode === 'nightly' ? 'nuit(s)' : 'mois'
            }`,
            quantity: booking.pricingDetails.quantity,
            unitPrice: booking.pricingDetails.unitPrice,
            total: booking.pricingDetails.subtotal,
          },
        ]);
      }
    }
  }, [formData.bookingId, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/bookings?establishmentId=${selectedEstablishment}&status=confirmed&limit=100`
      );
      const data = await response.json();
      if (data.success) {
        setBookings(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    let total = calculateSubtotal();
    if (formData.discountAmount) {
      total -= parseFloat(formData.discountAmount);
    }
    if (formData.taxRate) {
      const taxAmount = (total * parseFloat(formData.taxRate)) / 100;
      total += taxAmount;
    }
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Client-side validation for establishment
      if (!selectedEstablishment) {
        throw new Error('Veuillez sélectionner un établissement');
      }

      // Validate establishment permissions for non-admin users
      if (user && user.role !== 'root' && user.role !== 'super_admin') {
        if (selectedEstablishment !== user.establishmentId) {
          throw new Error('Vous ne pouvez créer des factures que pour votre établissement assigné');
        }
      }

      const invoiceData: any = {
        establishmentId: selectedEstablishment,
        bookingId: formData.bookingId || undefined,
        clientInfo: {
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone,
        },
        items: items.filter((item) => item.description && item.quantity > 0),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      };

      if (formData.discountAmount) {
        invoiceData.discount = {
          amount: parseFloat(formData.discountAmount),
          reason: formData.discountReason || undefined,
        };
      }

      if (formData.taxRate) {
        const subtotal = calculateSubtotal();
        const discountedSubtotal = formData.discountAmount
          ? subtotal - parseFloat(formData.discountAmount)
          : subtotal;
        const taxAmount = (discountedSubtotal * parseFloat(formData.taxRate)) / 100;
        invoiceData.tax = {
          rate: parseFloat(formData.taxRate),
          amount: taxAmount,
        };
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create invoice');
      }

      router.push(`/invoices/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/invoices')}
            className="text-luxury-gold  mb-2"
          >
            ← Retour aux factures
          </button>
          <h1 className="text-3xl font-bold text-luxury-dark">Nouvelle Facture</h1>
          <p className="text-luxury-text mt-2">Créer une facture manuellement</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Establishment and Booking */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-luxury-dark mb-4">Informations de base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EstablishmentSelector
                value={selectedEstablishment}
                onChange={(establishmentId) => {
                  setSelectedEstablishment(establishmentId);
                  setSelectedBooking(null);
                  setFormData(prev => ({ ...prev, bookingId: '' }));
                }}
                required
                userRole={user?.role}
                userEstablishmentId={user?.establishmentId}
                label="Établissement"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réservation (optionnel)
                </label>
                <select
                  name="bookingId"
                  value={formData.bookingId}
                  onChange={handleInputChange}
                  disabled={!selectedEstablishment || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Sélectionner une réservation</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.bookingCode} - {booking.clientInfo.firstName}{' '}
                      {booking.clientInfo.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-luxury-dark mb-4">Informations Client</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-luxury-dark">Articles</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-luxury-gold text-luxury-cream text-sm rounded-md "
              >
                + Ajouter un article
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qté</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                      }
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix unitaire
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                    <input
                      type="text"
                      value={item.total.toLocaleString()}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full px-3 py-2 bg-red-600 text-luxury-cream rounded-md hover:bg-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount and Tax */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-luxury-dark mb-4">Remise et Taxes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant de remise
                </label>
                <input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison de la remise
                </label>
                <input
                  type="text"
                  name="discountReason"
                  value={formData.discountReason}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux de taxe (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-luxury-dark mb-4">Résumé</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-luxury-text">Sous-total:</span>
                <span className="font-medium">{calculateSubtotal().toLocaleString()} BIF</span>
              </div>
              {formData.discountAmount && (
                <div className="flex justify-between">
                  <span className="text-luxury-text">Remise:</span>
                  <span className="font-medium text-green-600">
                    -{parseFloat(formData.discountAmount).toLocaleString()} BIF
                  </span>
                </div>
              )}
              {formData.taxRate && (
                <div className="flex justify-between">
                  <span className="text-luxury-text">Taxes ({formData.taxRate}%):</span>
                  <span className="font-medium">
                    {(
                      ((calculateSubtotal() -
                        (formData.discountAmount ? parseFloat(formData.discountAmount) : 0)) *
                        parseFloat(formData.taxRate)) /
                      100
                    ).toLocaleString()}{' '}
                    BIF
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-luxury-gold">
                  {calculateTotal().toLocaleString()} BIF
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 bg-luxury-gold text-luxury-cream font-medium rounded-md  disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Création en cours...' : 'Créer la facture'}
          </button>
        </form>
      </div>
    </div>
  );
}
