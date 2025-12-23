'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface JobPost {
  id: string;
  title: string;
  department: string;
  position: string;
  status: 'draft' | 'published' | 'closed' | 'filled';
  applicationsCount: number;
  location: string;
  employmentType: string;
  createdAt: string;
}

export default function RecruitmentPage() {
  const router = useRouter();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
  });

  useEffect(() => {
    fetchJobPosts();
  }, [filters]);

  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      );
      const response = await fetch(`/api/hr/recruitment/job-posts?${params}`);
      const data = await response.json();
      if (data.success !== false) {
        setJobPosts(data);
      }
    } catch (err) {
      console.error('Error fetching job posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-luxury-dark">Recrutement</h1>
            <p className="text-luxury-text mt-2">Gérer les offres d'emploi et les candidatures</p>
          </div>
          <button
            onClick={() => router.push('/admin/hr/recruitment/create')}
            className="px-4 py-2.5 bg-luxury-gold text-luxury-cream rounded-lg hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle Offre
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="closed">Fermé</option>
              <option value="filled">Pourvu</option>
            </select>
            <input
              type="text"
              placeholder="Département"
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/hr/recruitment/candidates')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir Candidatures
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            </div>
          ) : jobPosts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune offre d'emploi trouvée</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Département
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Candidatures
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
                  {jobPosts.map((jobPost) => (
                    <tr key={jobPost.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-luxury-dark">
                          {jobPost.title}
                        </div>
                        <div className="text-sm text-gray-500">{jobPost.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {jobPost.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {jobPost.employmentType === 'full_time' ? 'Temps plein' :
                         jobPost.employmentType === 'part_time' ? 'Temps partiel' :
                         jobPost.employmentType === 'contract' ? 'Contrat' : 'Temporaire'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {jobPost.applicationsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            jobPost.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : jobPost.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : jobPost.status === 'closed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {jobPost.status === 'published' ? 'Publié' :
                           jobPost.status === 'draft' ? 'Brouillon' :
                           jobPost.status === 'closed' ? 'Fermé' : 'Pourvu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/admin/hr/recruitment/${jobPost.id}/edit`)}
                            className="text-luxury-gold hover:text-blue-900"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => router.push(`/admin/hr/recruitment/${jobPost.id}/candidates`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Candidatures
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}