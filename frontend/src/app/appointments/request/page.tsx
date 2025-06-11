'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicAppointmentRequest } from '@/types/appointment';
// import apiService from '@/services/api';

const PublicAppointmentRequestPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<PublicAppointmentRequest>({
    directorId: '',
    name: '',
    email: '',
    phone: '',
    requestedDate: '',
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    // TODO: Call API: POST /appointments/public with formData
    console.log('Simulating public appointment request:', formData);
    setTimeout(() => {
      setLoading(false);
      // Simulate success
      setSuccessMessage('Your appointment request has been submitted successfully! We will contact you soon.');
      // Optionally clear form or redirect
      // setFormData({ directorId: '', name: '', email: '', phone: '', requestedDate: '', reason: '' });
      // router.push('/');
    }, 1500);
    // try {
    //   // const response = await apiService.post('/appointments/public', formData);
    //   // setSuccessMessage(response.data.message || 'Request submitted successfully!');
    //   // Potentially clear form or redirect
    // } catch (err: any) { // Explicitly type err
    //   console.error("Failed to submit appointment request", err);
    //   setError("Failed to submit request. " + (err.response?.data?.message || err.message));
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Request an Appointment</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-center">{error}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded-md mb-4 text-center">{successMessage}</p>}

      {!successMessage && ( // Hide form on success
        <form onSubmit={handleSubmit} className="bg-white max-w-lg mx-auto p-8 rounded-lg shadow-xl space-y-6">
          <div>
            <label htmlFor="directorId" className="block text-sm font-medium text-gray-700 mb-1">Director ID (or Select Director)</label>
            {/* TODO: Replace with a select dropdown fetched from /admin/directors if possible, or user needs to know ID */}
            <input type="text" name="directorId" id="directorId" value={formData.directorId} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
            <input type="date" name="requestedDate" id="requestedDate" value={formData.requestedDate} onChange={handleChange} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Appointment</label>
            <textarea name="reason" id="reason" value={formData.reason} onChange={handleChange} rows={4} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>
          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150 ease-in-out">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}
    </div>
  );
};

export default PublicAppointmentRequestPage;
