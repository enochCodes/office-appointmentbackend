'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Director } from '@/types/director';
// import apiService from '@/services/api';

const dummyDirectors: Director[] = [
  { id: 'dir1', name: 'Dr. Eve Director', email: 'eve@example.com', createdAt: '2023-02-01', updatedAt: '2023-02-01' },
  { id: 'dir2', name: 'Mr. Frank Director', email: 'frank@example.com', createdAt: '2023-02-02', updatedAt: '2023-02-02' },
];

const AdminDirectorsPage: React.FC = () => {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching directors
    console.log("Simulating fetch directors...");
    setTimeout(() => {
      setDirectors(dummyDirectors);
      setLoading(false);
    }, 500);
    // TODO: Fetch directors from API: GET /admin/directors
    // setLoading(true);
    // apiService.get<Director[]>('/admin/directors')
    //   .then(response => setDirectors(response.data))
    //   .catch(err => setError("Failed to load directors."))
    //   .finally(() => setLoading(false));
  }, []);

  const handleDeleteDirector = async (directorId: string) => {
    if (window.confirm('Are you sure you want to delete this director?')) {
      // TODO: Call API: DELETE /admin/directors/{directorId}
      console.log(`Simulating delete director: ${directorId}`);
      setDirectors(currentDirectors => currentDirectors.filter(d => d.id !== directorId));
    }
  };

  if (loading) return <div className="text-center py-10">Loading directors...</div>;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Director Management</h1>
          <Link href="/admin/directors/create" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out">
            Create New Director
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase">Name</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase">Email (Example)</th>
                <th className="py-3 px-6 text-center text-sm font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {directors.map((director, index) => (
                <tr key={director.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition duration-150 ease-in-out`}>
                  <td className="py-4 px-6 text-left whitespace-nowrap">{director.name}</td>
                  <td className="py-4 px-6 text-left">{director.email || 'N/A'}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex item-center justify-center space-x-3">
                      <Link href={`/admin/directors/${director.id}/edit`} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteDirector(director.id)}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {directors.length === 0 && (
                 <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-500">No directors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDirectorsPage;
