'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Assistant } from '@/types/assistant';
// import apiService from '@/services/api';

const dummyAssistants: Assistant[] = [
  { id: 'asst1', name: 'Grace Assistant', email: 'grace@example.com', directorId: 'dir1', createdAt: '2023-03-01', updatedAt: '2023-03-01' },
  { id: 'asst2', name: 'Henry Assistant', email: 'henry@example.com', directorId: 'dir2', createdAt: '2023-03-02', updatedAt: '2023-03-02' },
];

const AdminAssistantsPage: React.FC = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching assistants
    console.log("Simulating fetch assistants...");
    setTimeout(() => {
      setAssistants(dummyAssistants);
      setLoading(false);
    }, 500);
    // TODO: Fetch assistants from API: GET /admin/assistants
    // setLoading(true);
    // apiService.get<Assistant[]>('/admin/assistants')
    //   .then(response => setAssistants(response.data))
    //   .catch(err => setError("Failed to load assistants."))
    //   .finally(() => setLoading(false));
  }, []);

  const handleDeleteAssistant = async (assistantId: string) => {
    if (window.confirm('Are you sure you want to delete this assistant?')) {
      // TODO: Call API: DELETE /admin/assistants/{assistantId}
      console.log(`Simulating delete assistant: ${assistantId}`);
      setAssistants(currentAssistants => currentAssistants.filter(a => a.id !== assistantId));
    }
  };

  if (loading) return <div className="text-center py-10">Loading assistants...</div>;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' or 'director' based on requirements */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Assistant Management</h1>
          <Link href="/admin/assistants/create" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out">
            Create New Assistant
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase">Name</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase">Email</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase">Director ID</th>
                <th className="py-3 px-6 text-center text-sm font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {assistants.map((assistant, index) => (
                <tr key={assistant.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition duration-150 ease-in-out`}>
                  <td className="py-4 px-6 text-left whitespace-nowrap">{assistant.name}</td>
                  <td className="py-4 px-6 text-left">{assistant.email || 'N/A'}</td>
                  <td className="py-4 px-6 text-left">{assistant.directorId || 'N/A'}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex item-center justify-center space-x-3">
                      <Link href={`/admin/assistants/${assistant.id}/edit`} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteAssistant(assistant.id)}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {assistants.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">No assistants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminAssistantsPage;
