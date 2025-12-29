'use client';

import { Lock, User, Calendar, CreditCard, FileText, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  establishmentId?: string;
  employeeId?: string;
}

interface EmployeeData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: string;
  };
  employmentInfo: {
    position: string;
    department: string;
    hireDate: string;
    salary: number;
    status: string;
  };
  benefits: {
    healthInsurance: boolean;
    retirementPlan: boolean;
    paidLeaveDays: number;
    sickLeaveDays: number;
  };
}

interface LeaveRequest {
  type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
}

interface PayrollRecord {
  id: string;
  period: {
    month: number;
    year: number;
  };
  baseSalary: number;
  netSalary: number;
  status: string;
  paidAt?: string;
  acknowledgedAt?: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [leaveForm, setLeaveForm] = useState<LeaveRequest>({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [user, setUser] = useState<User>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Check if user is an employee
      if (parsedUser.employeeId) {
        setIsEmployee(true);
        await loadEmployeeData(parsedUser.employeeId);
        await loadLeaveRequests();
        await loadPayrollHistory();
      }
    }
  };

  const loadEmployeeData = async (employeeId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployeeData(data);
      }
    } catch (err) {
      console.error('Error loading employee data:', err);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/leave', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.data || []);
      }
    } catch (err) {
      console.error('Error loading leave requests:', err);
    }
  };

  const loadPayrollHistory = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payroll', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPayrollHistory(data.data || []);
      }
    } catch (err) {
      console.error('Error loading payroll history:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.data));
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de mot de passe');
      }

      setSuccess('Mot de passe changé avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(leaveForm),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la demande de congé');
      }

      setSuccess('Demande de congé soumise avec succès');
      setLeaveForm({
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: ''
      });
      await loadLeaveRequests(); // Reload leave requests
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeSalary = async (payrollId: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/payroll/${payrollId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation de réception');
      }

      setSuccess('Réception du salaire validée avec succès');
      await loadPayrollHistory(); // Reload payroll history
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayrollPDF = async (payrollId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/payroll/${payrollId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin-paie-${payrollId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Erreur lors du téléchargement du bulletin PDF');
      }
    } catch (err) {
      console.error('Error downloading payroll PDF:', err);
      setError('Erreur de téléchargement PDF');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-800' },
      receptionist: { label: 'Réceptionniste', color: 'bg-green-100 text-green-800' },
      staff: { label: 'Personnel', color: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-luxury-dark">Mon Profil</h1>
        <p className="text-luxury-text mt-2">Gérer vos informations personnelles</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Profile Header */}
        <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-card-luxury border border-amber-100 p-6 mb-6">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-gradient-luxury rounded-full flex items-center justify-center text-luxury-cream text-3xl font-bold">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-luxury-dark">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-luxury-text mt-1">{user.email}</p>
              <div className="mt-3">{getRoleBadge(user.role)}</div>
            </div>
          </div>
        </div>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-card-luxury border border-amber-100">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 lg:px-6 py-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-luxury-gold text-luxury-gold'
                    : 'border-transparent text-luxury-text hover:text-luxury-dark'
                }`}
              >
                <User className="size-4" /> Informations personnelles
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-4 lg:px-6 py-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'password'
                    ? 'border-luxury-gold text-luxury-gold'
                    : 'border-transparent text-luxury-text hover:text-luxury-dark'
                }`}
              >
                <Lock className="size-4" /> Mot de passe
              </button>
              {isEmployee && (
                <>
                  <button
                    onClick={() => setActiveTab('leave')}
                    className={`px-4 lg:px-6 py-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'leave'
                        ? 'border-luxury-gold text-luxury-gold'
                        : 'border-transparent text-luxury-text hover:text-luxury-dark'
                    }`}
                  >
                    <Calendar className="size-4" /> Congés
                  </button>
                  <button
                    onClick={() => setActiveTab('payroll')}
                    className={`px-4 lg:px-6 py-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'payroll'
                        ? 'border-luxury-gold text-luxury-gold'
                        : 'border-transparent text-luxury-text hover:text-luxury-dark'
                    }`}
                  >
                    <CreditCard className="size-4" /> Paie
                  </button>
                  <button
                    onClick={() => setActiveTab('benefits')}
                    className={`px-4 lg:px-6 py-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'benefits'
                        ? 'border-luxury-gold text-luxury-gold'
                        : 'border-transparent text-luxury-text hover:text-luxury-dark'
                    }`}
                  >
                    <Briefcase className="size-4" /> Avantages
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={user.firstName}
                      onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={user.lastName}
                      onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={user.phone || ''}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-luxury-gold text-luxury-cream rounded-lg hover:bg-luxury-gold disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-luxury-gold text-luxury-cream rounded-lg hover:bg-luxury-gold disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Changement...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'leave' && isEmployee && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Demander un congé</h3>
                    <form onSubmit={handleLeaveRequest} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Type de congé
                        </label>
                        <select
                          value={leaveForm.type}
                          onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Date de début
                          </label>
                          <input
                            type="date"
                            value={leaveForm.startDate}
                            onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Date de fin
                          </label>
                          <input
                            type="date"
                            value={leaveForm.endDate}
                            onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Motif
                        </label>
                        <textarea
                          value={leaveForm.reason}
                          onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-luxury-gold text-luxury-cream rounded-lg hover:bg-luxury-gold disabled:opacity-50 font-medium"
                      >
                        {loading ? 'Soumission...' : 'Soumettre la demande'}
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Historique des congés</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {leaveRequests.length === 0 ? (
                        <p className="text-gray-500">Aucun congé demandé</p>
                      ) : (
                        leaveRequests.map((leave: any) => (
                          <div key={leave.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium capitalize">{leave.type}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">{leave.reason}</p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  leave.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : leave.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {leave.status === 'approved' ? 'Approuvé' :
                                 leave.status === 'pending' ? 'En attente' : 'Rejeté'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payroll' && isEmployee && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Historique de paie</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Période
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Salaire de base
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Salaire net
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Payé le
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Réception
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          PDF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payrollHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Aucun historique de paie disponible
                          </td>
                        </tr>
                      ) : (
                        payrollHistory.map((payroll) => (
                          <tr key={`${payroll.period.year}-${payroll.period.month}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(payroll.period.year, payroll.period.month - 1).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payroll.baseSalary.toLocaleString()} BIF
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {payroll.netSalary.toLocaleString()} BIF
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  payroll.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : payroll.status === 'approved'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {payroll.status === 'paid' ? 'Payé' :
                                 payroll.status === 'approved' ? 'Approuvé' : 'En attente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {(payroll.status === 'approved' || payroll.status === 'paid') && (
                                <button
                                  onClick={() => downloadPayrollPDF(payroll.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Télécharger le bulletin PDF"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payroll.status === 'paid' ? (
                                payroll.acknowledgedAt ? (
                                  <div className="flex items-center">
                                    <span className="text-green-600 mr-2">✓ Confirmé</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(payroll.acknowledgedAt).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => acknowledgeSalary(payroll.id)}
                                    disabled={loading}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Confirmer réception
                                  </button>
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && isEmployee && employeeData && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Mes avantages sociaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Couverture sociale</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Assurance santé</span>
                        <span className={employeeData.benefits.healthInsurance ? 'text-green-600' : 'text-red-600'}>
                          {employeeData.benefits.healthInsurance ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retraite</span>
                        <span className={employeeData.benefits.retirementPlan ? 'text-green-600' : 'text-red-600'}>
                          {employeeData.benefits.retirementPlan ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Congés</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Congés annuels</span>
                        <span>{employeeData.benefits.paidLeaveDays} jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Congés maladie</span>
                        <span>{employeeData.benefits.sickLeaveDays} jours</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Informations d'emploi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Poste</label>
                      <p className="mt-1 text-sm text-gray-900">{employeeData.employmentInfo.position}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Département</label>
                      <p className="mt-1 text-sm text-gray-900">{employeeData.employmentInfo.department}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date d'embauche</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(employeeData.employmentInfo.hireDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Salaire annuel</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {employeeData.employmentInfo.salary.toLocaleString()} BIF
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
