'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { User } from '@/types/user'; // Import User type
// import apiService from '@/services/api'; // To be used later

// Dummy data for now
const dummyUsers: User[] = [
  { id: '1', name: 'Alice Admin', email: 'alice@example.com', role: 'admin', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '2', name: 'Bob Director', email: 'bob@example.com', role: 'director', createdAt: '2023-01-02', updatedAt: '2023-01-02' },
  { id: '3', name: 'Charlie Assistant', email: 'charlie@example.com', role: 'assistant', createdAt: '2023-01-03', updatedAt: '2023-01-03' },
];

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching users from API
    console.log("Simulating fetch users...");
    setTimeout(() => {
      setUsers(dummyUsers);
      setLoading(false);
    }, 500); // Simulate network delay
    // TODO: Fetch users from API: GET /admin/users
    // setLoading(true);
    // apiService.get<User[]>('/admin/users')
    //   .then(response => setUsers(response.data))
    //   .catch(err => {
    //     console.error("Failed to fetch users", err);
    //     setError("Failed to load users.");
    //   })
    //   .finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // TODO: Call API: DELETE /admin/users/{userId}
      // try {
      //   await apiService.delete(`/admin/users/${userId}`);
      //   setUsers(users.filter(user => user.id !== userId));
      // } catch (err) {
      //   console.error("Failed to delete user", err);
      //   setError("Failed to delete user.");
      // }
      console.log();
      setUsers(currentUsers => currentUsers.filter(user => user.id !== userId)); // Optimistic UI update
    }
  };

  // ProtectedRoute should ideally handle the main loading/auth state.
  // This loading is for the data fetching specific to this page.
  if (loading) return <div className="text-center py-10">Loading users...</div>;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    // TODO: Add role='admin' check here or enhance ProtectedRoute
    // For example: <ProtectedRoute requiredRole="admin">
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <Link href="/admin/users/create" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out">
            Create New User
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase">Name</th>
                <th className="py-3 px-6 text-left text-sm font-semibold uppercase">Email</th>
                <th className="py-3 px-6 text-center text-sm font-semibold uppercase">Role</th>
                <th className="py-3 px-6 text-center text-sm font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {users.map((user, index) => (
                <tr key={user.id} className={}>
                  <td className="py-4 px-6 text-left whitespace-nowrap">{user.name}</td>
                  <td className="py-4 px-6 text-left">{user.email}</td>
                  <td className="py-4 px-6 text-center capitalize">{user.role}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex item-center justify-center space-x-3">
                      <Link href={} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition duration-150 ease-in-out"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminUsersPage;
