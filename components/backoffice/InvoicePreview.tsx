'use client';

import type { InvoiceResponse } from '@/types/invoice.types';

interface InvoicePreviewProps {
  invoice: InvoiceResponse;
  establishment?: {
    name: string;
    location: {
      address: string;
      city: string;
      country: string;
    };
    contacts: {
      phone: string;
      email: string;
    };
  };
}

export default function InvoicePreview({ invoice, establishment }: InvoicePreviewProps) {
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Espèces';
      case 'mobile_money':
        return 'Mobile Money';
      case 'card':
        return 'Carte';
      case 'bank_transfer':
        return 'Virement bancaire';
      default:
        return method;
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto" id="invoice-preview">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-luxury-dark mb-2">FACTURE</h1>
          <p className="text-lg text-luxury-text">{invoice.invoiceNumber}</p>
        </div>
        {establishment && (
          <div className="text-right">
            <h2 className="text-xl font-bold text-luxury-dark">{establishment.name}</h2>
            <p className="text-sm text-luxury-text">{establishment.location.address}</p>
            <p className="text-sm text-luxury-text">
              {establishment.location.city}, {establishment.location.country}
            </p>
            <p className="text-sm text-luxury-text mt-2">{establishment.contacts.phone}</p>
            <p className="text-sm text-luxury-text">{establishment.contacts.email}</p>
          </div>
        )}
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">FACTURÉ À</h3>
          <p className="font-medium text-luxury-dark">{invoice.clientInfo.name}</p>
          <p className="text-sm text-luxury-text">{invoice.clientInfo.email}</p>
          <p className="text-sm text-luxury-text">{invoice.clientInfo.phone}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-sm text-luxury-text">Date d'émission: </span>
            <span className="font-medium text-luxury-dark">
              {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          {invoice.dueDate && (
            <div className="mb-2">
              <span className="text-sm text-luxury-text">Date d'échéance: </span>
              <span className="font-medium text-luxury-dark">
                {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          <div>
            <span className="text-sm text-luxury-text">Statut: </span>
            <span
              className={`font-medium ${
                invoice.status === 'paid'
                  ? 'text-green-600'
                  : invoice.status === 'partial'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {invoice.status === 'paid'
                ? 'Payé'
                : invoice.status === 'partial'
                  ? 'Partiellement payé'
                  : 'Non payé'}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 text-sm font-semibold text-gray-700">DESCRIPTION</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700">QTÉ</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700">
                PRIX UNITAIRE
              </th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 text-luxury-dark">{item.description}</td>
                <td className="py-3 text-right text-luxury-dark">{item.quantity}</td>
                <td className="py-3 text-right text-luxury-dark">
                  {item.unitPrice.toLocaleString()} BIF
                </td>
                <td className="py-3 text-right font-medium text-luxury-dark">
                  {item.total.toLocaleString()} BIF
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="text-luxury-text">Sous-total:</span>
            <span className="font-medium text-luxury-dark">
              {invoice.subtotal.toLocaleString()} BIF
            </span>
          </div>
          {invoice.discount && (
            <div className="flex justify-between py-2">
              <span className="text-luxury-text">
                Remise{invoice.discount.reason && ` (${invoice.discount.reason})`}:
              </span>
              <span className="font-medium text-green-600">
                -{invoice.discount.amount.toLocaleString()} BIF
              </span>
            </div>
          )}
          {invoice.tax && (
            <div className="flex justify-between py-2">
              <span className="text-luxury-text">Taxes ({invoice.tax.rate}%):</span>
              <span className="font-medium text-luxury-dark">
                {invoice.tax.amount.toLocaleString()} BIF
              </span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-200">
            <span className="text-lg font-semibold text-luxury-dark">TOTAL:</span>
            <span className="text-lg font-bold text-luxury-dark">
              {invoice.total.toLocaleString()} BIF
            </span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">PAIEMENTS</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-luxury-text">DATE</th>
                <th className="text-left py-2 text-xs font-semibold text-luxury-text">MÉTHODE</th>
                <th className="text-left py-2 text-xs font-semibold text-luxury-text">RÉFÉRENCE</th>
                <th className="text-right py-2 text-xs font-semibold text-luxury-text">MONTANT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 text-sm text-luxury-dark">
                    {new Date(payment.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2 text-sm text-luxury-dark">
                    {getPaymentMethodLabel(payment.method)}
                  </td>
                  <td className="py-2 text-sm text-luxury-text">{payment.reference || '-'}</td>
                  <td className="py-2 text-sm text-right font-medium text-luxury-dark">
                    {payment.amount.toLocaleString()} BIF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="flex justify-end mt-4">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-luxury-text">Total payé:</span>
                <span className="font-medium text-green-600">
                  {invoice.payments
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}{' '}
                  BIF
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="font-semibold text-luxury-dark">Solde restant:</span>
                <span
                  className={`font-bold ${invoice.balance === 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {invoice.balance.toLocaleString()} BIF
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
        <p>Merci pour votre confiance</p>
        <p className="mt-1">Cette facture a été générée électroniquement</p>
      </div>
    </div>
  );
}
