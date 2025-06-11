'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { User } from '@/types/user';
// import apiService from '@/services/api';

// Assuming AdminUserCreateRequest might be different, e.g. includes password
interface UserCreateFormData {
  name: string;
  email: string;
  role: User['role'];
  password?: string; // Optional password field for creation
}

const CreateUserPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<UserCreateFormData>({
    name: '',
    email: '',
    role: 'user', // Default role
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // TODO: Call API: POST /admin/users with formData
    // try {
    //   await apiService.post('/admin/users', formData);
    //   router.push('/admin/users');
    // } catch (err: any) { // Explicitly type err
    //   console.error("Failed to create user", err);
    //   setError("Failed to create user. " + (err.response?.data?.message || err.message));
    // } finally {
    //   setLoading(false);
    // }
    console.log('Simulating create user:', formData);
    setTimeout(() => { // Simulate API delay
        setLoading(false);
        router.push('/admin/users');
    }, 1000);
  };

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' */}
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New User</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="password">Password (required for new user)</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 capitalize">
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
              <option value="director">Director</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150 ease-in-out">
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default CreateUserPage;
