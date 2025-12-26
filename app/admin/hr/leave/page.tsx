'use client';

import { useState, useEffect } from 'react';
import type { LeaveResponse } from '@/types/leave.types';

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    employeeId: '',
    type: '',
    status: '',
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'annual' as const,
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [currentPage, filters]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?limit=100');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });
      const response = await fetch(`/api/leave?${params}`);
      const data = await response.json();
      if (data.success) {
        setLeaves(data.data.data || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowForm(false);
        setFormData({
          employeeId: '',
          type: 'annual',
          startDate: '',
          endDate: '',
          reason: '',
        });
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/leave/${id}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/leave/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-orange-100 text-orange-800',
      maternity: 'bg-pink-100 text-pink-800',
      paternity: 'bg-purple-100 text-purple-800',
      unpaid: 'bg-gray-100 text-gray-800',
      other: 'bg-indigo-100 text-indigo-800',
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-luxury-dark">Gestion des Congés</h1>
            <p className="text-luxury-text mt-2">Gérer les demandes de congés</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-md "
          >
            {showForm ? 'Annuler' : 'Nouvelle demande'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-luxury-text">Total demandes</p>
            <p className="mt-1 text-2xl font-bold text-luxury-dark">{leaves.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-luxury-text">En attente</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {leaves.filter((l) => l.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-luxury-text">Approuvées</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {leaves.filter((l) => l.status === 'approved').length}
            </p>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Nouvelle demande de congé</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employé</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="annual">Congé annuel</option>
                  <option value="sick">Congé maladie</option>
                  <option value="maternity">Congé maternité</option>
                  <option value="paternity">Congé paternité</option>
                  <option value="unpaid">Congé sans solde</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-md "
                >
                  Soumettre la demande
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters((prev) => ({ ...prev, employeeId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les employés</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                </option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les types</option>
              <option value="annual">Congé annuel</option>
              <option value="sick">Congé maladie</option>
              <option value="maternity">Congé maternité</option>
              <option value="paternity">Congé paternité</option>
              <option value="unpaid">Congé sans solde</option>
              <option value="other">Autre</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Rejeté</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune demande trouvée</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-luxury-dark">
                          {(leave as any).employeeId?.personalInfo?.firstName}{' '}
                          {(leave as any).employeeId?.personalInfo?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(
                            leave.type
                          )}`}
                        >
                          {leave.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(leave.startDate).toLocaleDateString('fr-FR')} -{' '}
                        {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{leave.days} jours</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            leave.status
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(leave.id)}
                              className="text-green-600 hover:text-green-900 mr-2"
                            >
                              Approuver
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
