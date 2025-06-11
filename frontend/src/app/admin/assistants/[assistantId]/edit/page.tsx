'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Assistant } from '@/types/assistant';
// import apiService from '@/services/api';

// Based on AdminAssistantUpdateRequest (simplified)
type AssistantUpdateData = Partial<Omit<Assistant, 'id' | 'createdAt' | 'updatedAt'>>;

// Dummy data for simulation
const dummyAssistantsForEditPage: Assistant[] = [
  { id: 'asst1', name: 'Grace Assistant', email: 'grace@example.com', directorId: 'dir1', createdAt: '2023-03-01', updatedAt: '2023-03-01' },
  { id: 'asst2', name: 'Henry Assistant', email: 'henry@example.com', directorId: 'dir2', createdAt: '2023-03-02', updatedAt: '2023-03-02' },
];

const EditAssistantPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const assistantId = params.assistantId as string;

  const [formData, setFormData] = useState<AssistantUpdateData>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (assistantId) {
      console.log(`Simulating fetch assistant for edit: ${assistantId}`);
      setFetching(true);
      setTimeout(() => {
        const dummyAssistant = dummyAssistantsForEditPage.find(a => a.id === assistantId);
        if (dummyAssistant) {
          setFormData({ name: dummyAssistant.name, email: dummyAssistant.email, directorId: dummyAssistant.directorId });
        } else {
          setError("Assistant not found.");
        }
        setFetching(false);
      }, 500);
      // TODO: Fetch assistant data: GET /admin/assistants/{assistantId}
      // apiService.get<Assistant>(\`/admin/assistants/\${assistantId}\`)
      //   .then(response => {
      //     setFormData({ name: response.data.name, email: response.data.email, directorId: response.data.directorId });
      //   })
      //   .catch(err => {
      //     console.error("Failed to fetch assistant", err);
      //     setError("Failed to load assistant data.");
      //   })
      //   .finally(() => setFetching(false));
    }
  }, [assistantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // TODO: Call API: PUT /admin/assistants/{assistantId} with formData
    console.log(`Simulating update assistant ${assistantId}:`, formData);
    setTimeout(() => {
        setLoading(false);
        router.push('/admin/assistants');
    }, 1000);
  };

  if (fetching) return <div className="text-center py-10">Loading assistant data...</div>;
  if (error && !formData.name) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' or 'director' */}
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Assistant {formData.name || assistantId}</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="directorId" className="block text-sm font-medium text-gray-700 mb-1">Director ID (Optional)</label>
            <input type="text" name="directorId" id="directorId" value={formData.directorId || ''} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          {/* Add other fields from AdminAssistantUpdateRequest schema here */}
          <button type="submit" disabled={loading || fetching} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150 ease-in-out">
            {loading ? 'Updating...' : 'Update Assistant'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default EditAssistantPage;
