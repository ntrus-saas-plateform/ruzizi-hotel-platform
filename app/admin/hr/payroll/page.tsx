'use client';

import { useState, useEffect } from 'react';
import type { PayrollResponse } from '@/types/payroll.types';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchPayrolls();
    fetchSummary();
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

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });
      const response = await fetch(`/api/payroll?${params}`);
      const data = await response.json();
      if (data.success) {
        setPayrolls(data.data.data || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!filters.year || !filters.month) return;
    try {
      const response = await fetch(
        `/api/payroll/summary?year=${filters.year}&month=${filters.month}`
      );
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!filters.year || !filters.month) {
      alert('Veuillez sélectionner une année et un mois');
      return;
    }
    try {
      const response = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: parseInt(filters.year),
          month: parseInt(filters.month),
        }),
      });
      if (response.ok) {
        fetchPayrolls();
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/payroll/${id}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchPayrolls();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePay = async (id: string) => {
    try {
      const response = await fetch(`/api/payroll/${id}/pay`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchPayrolls();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion de la Paie</h1>
            <p className="text-gray-600 mt-2">Gérer les salaires des employés</p>
          </div>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Générer la paie
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Employés</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalEmployees}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Salaire brut total</p>
              <p className="text-2xl font-bold text-gray-900">${summary.totalGross.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Déductions totales</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summary.totalDeductions.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Salaire net total</p>
              <p className="text-2xl font-bold text-green-600">${summary.totalNet.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="paid">Payé</option>
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filters.month}
              onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun enregistrement trouvé</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Salaire brut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Déductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Salaire net
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
                  {payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(payroll as any).employeeId?.personalInfo?.firstName}{' '}
                          {(payroll as any).employeeId?.personalInfo?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(payroll.period.year, payroll.period.month - 1).toLocaleString(
                          'fr-FR',
                          { month: 'long', year: 'numeric' }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ${payroll.totalGross.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ${payroll.totalDeductions.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${payroll.netSalary.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            payroll.status
                          )}`}
                        >
                          {payroll.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payroll.status === 'draft' && (
                          <button
                            onClick={() => handleApprove(payroll.id)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            Approuver
                          </button>
                        )}
                        {payroll.status === 'approved' && (
                          <button
                            onClick={() => handlePay(payroll.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Marquer payé
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
