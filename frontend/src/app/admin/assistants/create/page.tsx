'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Assistant } from '@/types/assistant';
// import apiService from '@/services/api';

// Based on AdminAssistantCreateRequest (simplified)
type AssistantCreateData = Omit<Assistant, 'id' | 'createdAt' | 'updatedAt'>;

const CreateAssistantPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<AssistantCreateData>({
    name: '',
    email: '',
    directorId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // TODO: Call API: POST /admin/assistants with formData
    console.log('Simulating create assistant:', formData);
    setTimeout(() => {
        setLoading(false);
        router.push('/admin/assistants');
    }, 1000);
  };

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' or 'director' */}
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Assistant</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="directorId" className="block text-sm font-medium text-gray-700 mb-1">Director ID (Optional)</label>
            <input type="text" name="directorId" id="directorId" value={formData.directorId || ''} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          {/* Add other fields from AdminAssistantCreateRequest schema here */}
          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150 ease-in-out">
            {loading ? 'Creating...' : 'Create Assistant'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default CreateAssistantPage;
