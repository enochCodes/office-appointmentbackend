'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { User } from '@/types/user';
// import apiService from '@/services/api';

// For edit, password is not directly handled. Separate flow for password reset.
type UserUpdateFormData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password'>;

// Re-define dummyUsers here for simulation if not fetching from a shared state or API
const dummyUsersForEditPage: User[] = [
  { id: '1', name: 'Alice Admin', email: 'alice@example.com', role: 'admin', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '2', name: 'Bob Director', email: 'bob@example.com', role: 'director', createdAt: '2023-01-02', updatedAt: '2023-01-02' },
  { id: '3', name: 'Charlie Assistant', email: 'charlie@example.com', role: 'assistant', createdAt: '2023-01-03', updatedAt: '2023-01-03' },
];

const EditUserPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [formData, setFormData] = useState<Partial<UserUpdateFormData>>({}); // Partial for initial empty state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (userId) {
      console.log(`Simulating fetch user for edit: ${userId}`);
      setFetching(true);
      setTimeout(() => {
        const dummyUser = dummyUsersForEditPage.find(u => u.id === userId);
        if (dummyUser) {
          setFormData({ name: dummyUser.name, email: dummyUser.email, role: dummyUser.role });
        } else {
          setError("User not found.");
        }
        setFetching(false);
      }, 500);
      // TODO: Fetch user data: GET /admin/users/{userId}
      // apiService.get<User>(`/admin/users/${userId}`)
      //   .then(response => {
      //     setFormData({ name: response.data.name, email: response.data.email, role: response.data.role });
      //   })
      //   .catch(err => {
      //     console.error("Failed to fetch user", err);
      //     setError("Failed to load user data.");
      //   })
      //   .finally(() => setFetching(false));
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // TODO: Call API: PUT /admin/users/{userId} with formData
    // try {
    //   await apiService.put(`/admin/users/${userId}`, formData);
    //   router.push('/admin/users');
    // } catch (err: any) {
    //   console.error("Failed to update user", err);
    //   setError("Failed to update user. " + (err.response?.data?.message || err.message));
    // } finally {
    //   setLoading(false);
    // }
    console.log(`Simulating update user ${userId}:`, formData);
     setTimeout(() => { // Simulate API delay
        setLoading(false);
        router.push('/admin/users');
    }, 1000);
  };

  if (fetching) return <div className="text-center py-10">Loading user data...</div>;
  // If error is set and form data (e.g. name) hasn't been populated, it means user wasn't found.
  if (error && !formData.name) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' */}
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit User {formData.name || userId}</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select name="role" id="role" value={formData.role || 'user'} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 capitalize">
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
              <option value="director">Director</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading || fetching} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150 ease-in-out">
            {loading ? 'Updating...' : 'Update User'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default EditUserPage;
