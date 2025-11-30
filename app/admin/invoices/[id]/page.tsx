'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import InvoicePreview from '@/components/backoffice/InvoicePreview';
import type { InvoiceResponse } from '@/types/invoice.types';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash' as 'cash' | 'mobile_money' | 'card' | 'bank_transfer',
    reference: '',
  });

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch invoice');
      }

      setInvoice(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setActionSuccess('');

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          method: paymentData.method,
          reference: paymentData.reference || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to add payment');
      }

      setActionSuccess('Paiement ajouté avec succès');
      setShowPaymentForm(false);
      setPaymentData({ amount: '', method: 'cash', reference: '' });
      fetchInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
          <p className="mt-4 text-luxury-text">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/invoices')}
            className="mt-4 px-4 py-2 bg-luxury-gold text-luxury-cream rounded-md "
          >
            Retour aux factures
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 print:hidden">
          <button
            onClick={() => router.push('/invoices')}
            className="text-luxury-gold  mb-2"
          >
            ← Retour aux factures
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-luxury-dark">Facture {invoice.invoiceNumber}</h1>
            <div className="flex gap-3">
              {invoice.balance > 0 && (
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="px-4 py-2 bg-green-600 text-luxury-cream rounded-md hover:bg-green-700"
                >
                  Ajouter un paiement
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-md "
              >
                Imprimer
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded print:hidden">
            {error}
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded print:hidden">
            {actionSuccess}
          </div>
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 print:hidden">
            <h2 className="text-lg font-semibold text-luxury-dark mb-4">Ajouter un paiement</h2>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    required
                    max={invoice.balance}
                    placeholder={`Max: ${invoice.balance.toLocaleString()} BIF`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Méthode de paiement *
                  </label>
                  <select
                    value={paymentData.method}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        method: e.target.value as any,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Carte</option>
                    <option value="bank_transfer">Virement bancaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence (optionnel)
                  </label>
                  <input
                    type="text"
                    value={paymentData.reference}
                    onChange={(e) =>
                      setPaymentData((prev) => ({ ...prev, reference: e.target.value }))
                    }
                    placeholder="Numéro de transaction..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-luxury-cream rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Ajout en cours...' : 'Ajouter le paiement'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invoice Preview */}
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
}
