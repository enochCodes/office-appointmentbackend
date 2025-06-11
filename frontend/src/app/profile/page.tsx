'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
// import apiService from '@/services/api'; // Will be created later

const ProfilePage: React.FC = () => {
  const { user, token, logout, login } = useAuth(); // Added login to update user in context
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    // TODO: Fetch full profile details from /auth/me if 'user' from context is minimal
    // const fetchProfile = async () => {
    //   try {
    //     // const profileData = await apiService.get('/auth/me');
    //     // setName(profileData.name);
    //     // setEmail(profileData.email);
    //   } catch (error) {
    //     console.error('Failed to fetch profile', error);
    //     setErrorMessage('Failed to load profile data.');
    //   }
    // };
    // if (token && !user?.name) { // Example condition to fetch if user details are minimal
    //    fetchProfile();
    // }
  }, [user, token]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    try {
      // TODO: Call PUT /auth/me
      console.log("Simulating profile update with:", { name, email });
      // const updatedUserData = await apiService.put('/auth/me', { name, email });
      // For simulation, assume the API returns the updated user or we construct it
      const updatedUserData = { ...user, name, email };
      // Update user in AuthContext by calling login with existing token but new user data
      if (token) {
        login(token, updatedUserData);
      }
      setMessage('Profile updated successfully!');
    } catch (error) {
      setErrorMessage('Failed to update profile.');
      console.error(error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    if (!currentPassword || !newPassword) {
      setErrorMessage('Both current and new password are required.');
      return;
    }
    try {
      // TODO: Call POST /auth/me/change-password
      console.log("Simulating password change...");
      // await apiService.post('/auth/me/change-password', { currentPassword, newPassword });
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setErrorMessage('Failed to change password. Ensure current password is correct.');
      console.error(error);
    }
  };

  // ProtectedRoute handles loading and initial auth check
  // We might still want to show a loading state if user data is being fetched specifically for this page.
  // if (!user) { // This check might be redundant due to ProtectedRoute
  //   return <p>Loading profile...</p>;
  // }

  return (
    <ProtectedRoute>
      <div className="space-y-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center">Your Profile</h1>
        {message && <p className="text-green-600 bg-green-100 p-3 rounded-md text-center">{message}</p>}
        {errorMessage && <p className="text-red-600 bg-red-100 p-3 rounded-md text-center">{errorMessage}</p>}

        <section>
          <h2 className="text-2xl font-semibold mb-4">Account Details</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Update Profile</button>
          </form>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Change Password</button>
          </form>
        </section>

        <div className="text-center">
          <button
            onClick={logout}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
