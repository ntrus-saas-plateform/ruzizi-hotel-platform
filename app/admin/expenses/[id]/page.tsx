'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ExpenseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expense, setExpense] = useState<any>(null);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/expenses/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur de chargement');
      }

      setExpense(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      router.push('/admin/expenses');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      utilities: 'Services publics',
      maintenance: 'Maintenance',
      supplies: 'Fournitures',
      salaries: 'Salaires',
      marketing: 'Marketing',
      food: 'Alimentation',
      other: 'Autre',
    };
    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      bank_transfer: 'Virement bancaire',
      mobile_money: 'Mobile Money',
      check: 'Chèque',
      card: 'Carte',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
          <p className="mt-4 text-luxury-text">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error || 'Dépense non trouvée'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-luxury-text hover:text-luxury-dark flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-luxury-dark">{expense.title}</h1>
            <p className="text-luxury-text mt-2">
              {getCategoryLabel(expense.category)} - {new Date(expense.date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/admin/expenses/${id}/edit`)}
              className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-lg  flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-luxury-cream rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-luxury-dark mb-4">Détails de la dépense</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Titre</label>
                <p className="text-luxury-dark text-lg font-semibold">{expense.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Catégorie</label>
                  <p className="text-luxury-dark">{getCategoryLabel(expense.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-luxury-dark">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Mode de paiement</label>
                  <p className="text-luxury-dark">{getPaymentMethodLabel(expense.paymentMethod)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Établissement</label>
                  <p className="text-luxury-dark">{expense.establishmentId?.name || 'N/A'}</p>
                </div>
              </div>

              {expense.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-luxury-dark">{expense.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Créé par</label>
                <p className="text-luxury-dark">
                  {expense.createdBy?.firstName} {expense.createdBy?.lastName} - {new Date(expense.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-luxury-dark mb-4">Montant</h2>
            
            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg text-center">
              <div className="text-4xl font-bold text-red-600">
                {expense.amount?.toLocaleString()} BIF
              </div>
              <div className="text-sm text-red-700 mt-2">Montant total</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-luxury-dark mb-4">Statut</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-luxury-text">Statut</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  expense.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : expense.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {expense.status === 'approved' ? 'Approuvée' : expense.status === 'rejected' ? 'Rejetée' : 'En attente'}
                </span>
              </div>

              {expense.approvedBy && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-luxury-text mb-1">Approuvée par</div>
                  <div className="text-sm font-medium text-luxury-dark">
                    {expense.approvedBy.firstName} {expense.approvedBy.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(expense.approvedAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
