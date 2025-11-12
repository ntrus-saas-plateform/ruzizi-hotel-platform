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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURE</h1>
          <p className="text-lg text-gray-600">{invoice.invoiceNumber}</p>
        </div>
        {establishment && (
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">{establishment.name}</h2>
            <p className="text-sm text-gray-600">{establishment.location.address}</p>
            <p className="text-sm text-gray-600">
              {establishment.location.city}, {establishment.location.country}
            </p>
            <p className="text-sm text-gray-600 mt-2">{establishment.contacts.phone}</p>
            <p className="text-sm text-gray-600">{establishment.contacts.email}</p>
          </div>
        )}
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">FACTURÉ À</h3>
          <p className="font-medium text-gray-900">{invoice.clientInfo.name}</p>
          <p className="text-sm text-gray-600">{invoice.clientInfo.email}</p>
          <p className="text-sm text-gray-600">{invoice.clientInfo.phone}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-sm text-gray-600">Date d'émission: </span>
            <span className="font-medium text-gray-900">
              {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          {invoice.dueDate && (
            <div className="mb-2">
              <span className="text-sm text-gray-600">Date d'échéance: </span>
              <span className="font-medium text-gray-900">
                {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          <div>
            <span className="text-sm text-gray-600">Statut: </span>
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
      <div className="mb-8">
        <table className="w-full">
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
                <td className="py-3 text-gray-900">{item.description}</td>
                <td className="py-3 text-right text-gray-900">{item.quantity}</td>
                <td className="py-3 text-right text-gray-900">
                  {item.unitPrice.toLocaleString()} BIF
                </td>
                <td className="py-3 text-right font-medium text-gray-900">
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
            <span className="text-gray-600">Sous-total:</span>
            <span className="font-medium text-gray-900">
              {invoice.subtotal.toLocaleString()} BIF
            </span>
          </div>
          {invoice.discount && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">
                Remise{invoice.discount.reason && ` (${invoice.discount.reason})`}:
              </span>
              <span className="font-medium text-green-600">
                -{invoice.discount.amount.toLocaleString()} BIF
              </span>
            </div>
          )}
          {invoice.tax && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Taxes ({invoice.tax.rate}%):</span>
              <span className="font-medium text-gray-900">
                {invoice.tax.amount.toLocaleString()} BIF
              </span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-200">
            <span className="text-lg font-semibold text-gray-900">TOTAL:</span>
            <span className="text-lg font-bold text-gray-900">
              {invoice.total.toLocaleString()} BIF
            </span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">PAIEMENTS</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-gray-600">DATE</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-600">MÉTHODE</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-600">RÉFÉRENCE</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-600">MONTANT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 text-sm text-gray-900">
                    {new Date(payment.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2 text-sm text-gray-900">
                    {getPaymentMethodLabel(payment.method)}
                  </td>
                  <td className="py-2 text-sm text-gray-600">{payment.reference || '-'}</td>
                  <td className="py-2 text-sm text-right font-medium text-gray-900">
                    {payment.amount.toLocaleString()} BIF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Total payé:</span>
                <span className="font-medium text-green-600">
                  {invoice.payments
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}{' '}
                  BIF
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Solde restant:</span>
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
