'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import type { EmployeeResponse } from '@/types/employee.types';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params.id as string;

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`);
      
      if (!response.ok) {
        throw new Error('Employé non trouvé');
      }

      const data = await response.json();
      if (data.success) {
        setEmployee(data.data);
      } else {
        throw new Error(data.error?.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/hr/employees/${employeeId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/hr/employees');
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-luxury-gold"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-600">{error || 'Employé non trouvé'}</p>
            <button
              onClick={() => router.push('/admin/hr/employees')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-luxury-dark">
                  {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {employee.employmentInfo.position} - {employee.employmentInfo.department}
                </p>
                <p className="text-sm text-gray-500">
                  N° Employé: {employee.employmentInfo.employeeNumber}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-luxury-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => router.push('/admin/hr/employees')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations personnelles */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-luxury-dark mb-4">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.personalInfo.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.personalInfo.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(employee.personalInfo.dateOfBirth).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Genre</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {employee.personalInfo.gender === 'male' ? 'Masculin' : 
                     employee.personalInfo.gender === 'female' ? 'Féminin' : 'Autre'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationalité</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.personalInfo.nationality}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° Pièce d'identité</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.personalInfo.idNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.personalInfo.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.personalInfo.email}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.personalInfo.address}</p>
                </div>
              </div>
            </div>

            {/* Informations d'emploi */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-luxury-dark mb-4">
                Informations d'emploi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° Employé</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {employee.employmentInfo.employeeNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Poste</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employmentInfo.position}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Département</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employmentInfo.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'embauche</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(employee.employmentInfo.hireDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de contrat</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {employee.employmentInfo.contractType === 'permanent' ? 'Permanent' :
                     employee.employmentInfo.contractType === 'temporary' ? 'Temporaire' : 'Contrat'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salaire</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">
                    {employee.employmentInfo.salary.toLocaleString('fr-FR')} BIF
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.employmentInfo.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : employee.employmentInfo.status === 'inactive'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.employmentInfo.status === 'active' ? 'Actif' :
                     employee.employmentInfo.status === 'inactive' ? 'Inactif' : 'Terminé'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-luxury-dark mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin/hr/payroll?employee=${employeeId}`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gestion de paie
                </button>
                <button
                  onClick={() => router.push(`/admin/hr/attendance?employee=${employeeId}`)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Présences
                </button>
                <button
                  onClick={() => router.push(`/admin/hr/leave?employee=${employeeId}`)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Congés
                </button>
                <button
                  onClick={() => alert('Fonctionnalité en développement')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Documents
                </button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-luxury-dark mb-4">Informations</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Créé le</span>
                  <span className="text-sm text-gray-900">
                    {new Date(employee.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Modifié le</span>
                  <span className="text-sm text-gray-900">
                    {new Date(employee.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {employee.documents && employee.documents.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Documents</span>
                    <span className="text-sm text-gray-900">{employee.documents.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}