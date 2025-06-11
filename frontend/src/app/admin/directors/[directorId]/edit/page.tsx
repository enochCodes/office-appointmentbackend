'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Director } from '@/types/director';
// import apiService from '@/services/api';

// Based on AdminDirectorUpdateRequest (simplified)
type DirectorUpdateData = Partial<Omit<Director, 'id' | 'createdAt' | 'updatedAt'>>;

// Dummy data for simulation (should be consistent with list page's dummy data)
const dummyDirectorsForEditPage: Director[] = [
  { id: 'dir1', name: 'Dr. Eve Director', email: 'eve@example.com', createdAt: '2023-02-01', updatedAt: '2023-02-01' },
  { id: 'dir2', name: 'Mr. Frank Director', email: 'frank@example.com', createdAt: '2023-02-02', updatedAt: '2023-02-02' },
];

const EditDirectorPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const directorId = params.directorId as string;

  const [formData, setFormData] = useState<DirectorUpdateData>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (directorId) {
      console.log(`Simulating fetch director for edit: ${directorId}`);
      setFetching(true);
      setTimeout(() => {
        const dummyDirector = dummyDirectorsForEditPage.find(d => d.id === directorId);
        if (dummyDirector) {
          setFormData({ name: dummyDirector.name, email: dummyDirector.email });
        } else {
          setError("Director not found.");
        }
        setFetching(false);
      }, 500);
      // TODO: Fetch director data: GET /admin/directors/{directorId}
      // apiService.get<Director>(\`/admin/directors/\${directorId}\`)
      //   .then(response => {
      //     setFormData({ name: response.data.name, email: response.data.email });
      //   })
      //   .catch(err => {
      //     console.error("Failed to fetch director", err);
      //     setError("Failed to load director data.");
      //   })
      //   .finally(() => setFetching(false));
    }
  }, [directorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // TODO: Call API: PUT /admin/directors/{directorId} with formData
    console.log(`Simulating update director ${directorId}:`, formData);
    setTimeout(() => {
        setLoading(false);
        router.push('/admin/directors');
    }, 1000);
  };

  if (fetching) return <div className="text-center py-10">Loading director data...</div>;
  if (error && !formData.name) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' */}
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Director {formData.name || directorId}</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Example)</label>
            <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          {/* Add other fields from AdminDirectorUpdateRequest schema here */}
          <button type="submit" disabled={loading || fetching} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150 ease-in-out">
            {loading ? 'Updating...' : 'Update Director'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default EditDirectorPage;
