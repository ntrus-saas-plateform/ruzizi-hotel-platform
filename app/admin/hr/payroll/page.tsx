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
    minSalary: '',
    maxSalary: '',
    department: '',
  });
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchPayrolls();
    fetchSummary();
  }, [currentPage, filters]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/employees?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/employees?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        const uniqueDepartments = [...new Set(
          (data.data.data || [])
            .map((emp: any) => emp.employmentInfo?.department)
            .filter(Boolean)
        )] as string[];
        setDepartments(uniqueDepartments);
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
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/payroll?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPayrolls(data.data.data || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
        }
      } else if (response.status === 401) {
        // Token expired - prompt user to re-login
        console.error('Authentication token expired in fetchPayrolls');
        alert('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
        window.location.href = '/backoffice/login';
      } else {
        console.error('Failed to fetch payrolls:', response.status);
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
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/payroll/summary?year=${filters.year}&month=${filters.month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
    console.log('🚀 Generate button clicked!');
    console.log('📊 Current filters:', filters);
    
    if (!filters.year || !filters.month) {
      alert('Veuillez sélectionner une année et un mois');
      return;
    }
    
    try {
      console.log('📤 Sending request to /api/payroll/generate');
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          year: parseInt(filters.year),
          month: parseInt(filters.month),
        }),
      });
      
      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📋 Response data:', data);
      
      if (response.ok) {
        alert('Paie générée avec succès!');
        fetchPayrolls();
        fetchSummary();
      } else {
        alert('Erreur lors de la génération: ' + (data.error?.message || 'Erreur inconnue'));
      }
    } catch (err) {
      console.error('💥 Error in handleGenerate:', err);
      alert('Erreur de connexion');
    }
  };

  const handleApprovePeriod = async () => {
    if (!filters.year || !filters.month) {
      alert('Veuillez sélectionner une année et un mois');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payroll/period/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          year: parseInt(filters.year),
          month: parseInt(filters.month),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Période ${filters.month}/${filters.year} approuvée pour ${data.data?.count ?? 0} fiches`);
        fetchPayrolls();
        fetchSummary();
      } else {
        alert('Erreur lors de l\'approbation: ' + (data.error?.message || 'Erreur inconnue'));
      }
    } catch (err) {
      console.error('💥 Error in handleApprovePeriod:', err);
      alert('Erreur de connexion');
    }
  };

  const handlePayPeriod = async () => {
    if (!filters.year || !filters.month) {
      alert('Veuillez sélectionner une année et un mois');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payroll/period/pay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          year: parseInt(filters.year),
          month: parseInt(filters.month),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Période ${filters.month}/${filters.year} marquée payée pour ${data.data?.count ?? 0} fiches`
        );
        fetchPayrolls();
        fetchSummary();
      } else {
        alert('Erreur lors du marquage payé: ' + (data.error?.message || 'Erreur inconnue'));
      }
    } catch (err) {
      console.error('💥 Error in handlePayPeriod:', err);
      alert('Erreur de connexion');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found');
        alert('Erreur: Vous devez être connecté pour approuver la fiche');
        return;
      }

      const response = await fetch(`/api/payroll/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchPayrolls();
      } else {
        const errorText = await response.text();
        console.error('Approve failed:', response.status, errorText);
        alert(`Erreur lors de l'approbation: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error approving payroll:', err);
      alert('Erreur lors de l\'approbation: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handlePay = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found');
        alert('Erreur: Vous devez être connecté pour marquer la fiche comme payée');
        return;
      }

      const response = await fetch(`/api/payroll/${id}/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchPayrolls();
      } else {
        const errorText = await response.text();
        console.error('Pay failed:', response.status, errorText);
        alert(`Erreur lors du marquage payé: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error marking payroll as paid:', err);
      alert('Erreur lors du marquage payé: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleDownloadSlip = async (id: string) => {
    try {
      console.log('🔄 Starting slip download for ID:', id);
      
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found');
        alert('Erreur: Vous devez être connecté pour télécharger le bulletin de paie');
        return;
      }

      console.log('✅ Token available, length:', token.length);
      
      const url = `/api/payroll/${id}/pdf`;
      console.log('🌐 Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        console.log('✅ Response OK, processing blob...');
        const blob = await response.blob();
        console.log('📦 Blob created, size:', blob.size, 'type:', blob.type);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin-paie-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ Download completed successfully');
      } else if (response.status === 401) {
        // Token expired - prompt user to re-login
        console.error('🚨 Authentication token expired');
        alert('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
        window.location.href = '/backoffice/login';
      } else {
        const errorText = await response.text();
        console.error('❌ Download failed with status:', response.status);
        console.error('❌ Error response:', errorText);
        alert(`Erreur lors du téléchargement du bulletin: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('💥 Error downloading payroll slip:', err);
      if (err instanceof Error) {
        console.error('💥 Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }
      alert('Erreur de téléchargement: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  // Test function to check server connectivity
  const testServerConnection = async () => {
    try {
      console.log('🧪 Testing server connection...');
      const response = await fetch('/api/debug/test');
      const data = await response.json();
      console.log('✅ Server test response:', data);
      return data.success;
    } catch (err) {
      console.error('❌ Server test failed:', err);
      return false;
    }
  };

  const handleDownloadReport = async (type: 'monthly' | 'annual') => {
    try {
      console.log('🔄 Starting report download for type:', type);
      
      // Test server connectivity first
      const isServerReachable = await testServerConnection();
      if (!isServerReachable) {
        console.error('❌ Server is not reachable');
        alert('Erreur: Le serveur n\'est pas accessible. Veuillez vérifier votre connexion.');
        return;
      }
      
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found');
        alert('Erreur: Vous devez être connecté pour télécharger le rapport');
        return;
      }

      console.log('✅ Token available, length:', token.length);

      const params = new URLSearchParams({
        type,
        year: filters.year,
      });
      if (type === 'monthly' && filters.month) {
        params.append('month', filters.month);
      }

      const url = `/api/payroll/report/pdf?${params}`;
      console.log('🌐 Making request to:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        console.log('✅ Response OK, processing blob...');
        const blob = await response.blob();
        console.log('📦 Blob created, size:', blob.size, 'type:', blob.type);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = type === 'monthly'
          ? `rapport-paie-${filters.year}-${filters.month}.pdf`
          : `rapport-paie-annuel-${filters.year}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ Download completed successfully');
      } else if (response.status === 401) {
        // Token expired - prompt user to re-login
        console.error('🚨 Authentication token expired');
        alert('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
        window.location.href = '/backoffice/login';
      } else {
        const errorText = await response.text();
        console.error('❌ Report download failed:', response.status, errorText);
        alert(`Erreur lors du téléchargement du rapport: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('💥 Error in handleDownloadReport:', err);
      if (err instanceof Error) {
        console.error('💥 Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }
      alert('Erreur de téléchargement: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(payrolls.map(p => p.id));
    } else {
      setSelectedPayrolls([]);
    }
  };

  const handleSelectPayroll = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(prev => [...prev, id]);
    } else {
      setSelectedPayrolls(prev => prev.filter(p => p !== id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) {
      alert('Veuillez sélectionner au moins une fiche de paie');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const promises = selectedPayrolls.map(id =>
        fetch(`/api/payroll/${id}/approve`, { 
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      await Promise.all(promises);
      alert(`${selectedPayrolls.length} fiches approuvées avec succès`);
      setSelectedPayrolls([]);
      fetchPayrolls();
      fetchSummary();
    } catch (err) {
      console.error('Error in bulk approve:', err);
      alert('Erreur lors de l\'approbation en masse');
    }
  };

  const handleBulkPay = async () => {
    if (selectedPayrolls.length === 0) {
      alert('Veuillez sélectionner au moins une fiche de paie');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const promises = selectedPayrolls.map(id =>
        fetch(`/api/payroll/${id}/pay`, { 
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      await Promise.all(promises);
      alert(`${selectedPayrolls.length} fiches marquées payées avec succès`);
      setSelectedPayrolls([]);
      fetchPayrolls();
      fetchSummary();
    } catch (err) {
      console.error('Error in bulk pay:', err);
      alert('Erreur lors du marquage payé en masse');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedPayrolls.length === 0) {
      alert('Veuillez sélectionner au moins une fiche de paie');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found');
        alert('Erreur: Vous devez être connecté pour télécharger les bulletins');
        return;
      }

      for (const id of selectedPayrolls) {
        const response = await fetch(`/api/payroll/${id}/pdf`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bulletin-paie-${id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (response.status === 401) {
          // Token expired - prompt user to re-login
          console.error('Authentication token expired');
          alert('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
          window.location.href = '/backoffice/login';
          return; // Stop the bulk download process
        } else {
          console.error(`Failed to download payroll ${id}:`, response.status);
        }
      }
      alert(`${selectedPayrolls.length} bulletins téléchargés`);
    } catch (err) {
      console.error('Error in bulk download:', err);
      alert('Erreur lors du téléchargement en masse: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
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
        <div className="div max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-luxury-dark">Gestion de la Paie</h1>
            <p className="text-luxury-text mt-2">Gérer les salaires des employés</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-md hover:bg-luxury-gold/90"
            >
              Générer la paie
            </button>
            <button
              onClick={handleApprovePeriod}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Approuver le mois
            </button>
            <button
              onClick={handlePayPeriod}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Marquer le mois payé
            </button>
            <button
              onClick={() => handleDownloadReport('monthly')}
              className="px-4 py-2 border border-luxury-gold text-luxury-gold rounded-md hover:bg-luxury-gold hover:text-luxury-cream"
            >
              Rapport Mensuel PDF
            </button>
            <button
              onClick={() => handleDownloadReport('annual')}
              className="px-4 py-2 border border-luxury-gold text-luxury-gold rounded-md hover:bg-luxury-gold hover:text-luxury-cream"
            >
              Rapport Annuel PDF
            </button>
          </div>

          {selectedPayrolls.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedPayrolls.length} fiche(s) sélectionnée(s)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkApprove}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Approuver sélection
                  </button>
                  <button
                    onClick={handleBulkPay}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Marquer payé
                  </button>
                  <button
                    onClick={handleBulkDownload}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                  >
                    Télécharger bulletins
                  </button>
                  <button
                    onClick={() => setSelectedPayrolls([])}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Désélectionner
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-luxury-text">Employés</p>
              <p className="text-2xl font-bold text-luxury-dark">{summary.totalEmployees}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-luxury-text">Salaire brut total</p>
              <p className="text-2xl font-bold text-luxury-dark">${summary.totalGross.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-luxury-text">Déductions totales</p>
              <p className="text-2xl font-bold text-luxury-dark">
                ${summary.totalDeductions.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-luxury-text">Salaire net total</p>
              <p className="text-2xl font-bold text-green-600">${summary.totalNet.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les départements</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
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
            <input
              type="number"
              placeholder="Salaire min"
              value={filters.minSalary}
              onChange={(e) => setFilters((prev) => ({ ...prev, minSalary: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Salaire max"
              value={filters.maxSalary}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxSalary: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun enregistrement trouvé</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.length === payrolls.length && payrolls.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Département
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
                        <input
                          type="checkbox"
                          checked={selectedPayrolls.includes(payroll.id)}
                          onChange={(e) => handleSelectPayroll(payroll.id, e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-luxury-dark">
                          {(payroll as any).employeeId?.personalInfo?.firstName}{' '}
                          {(payroll as any).employeeId?.personalInfo?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(payroll as any).employeeId?.employmentInfo?.department || 'N/A'}
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
                        <div className="flex items-center gap-2">
                          {payroll.status === 'draft' && (
                            <button
                              onClick={() => handleApprove(payroll.id)}
                              className="text-luxury-gold hover:text-blue-900"
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
                          {(payroll.status === 'approved' || payroll.status === 'paid') && (
                            <button
                              onClick={() => handleDownloadSlip(payroll.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Télécharger le bulletin PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
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
