'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Appointment } from '@/types/appointment';
// import apiService from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const dummyAppointments: Appointment[] = [
  { id: 'appt1', directorId: 'dir1', name: 'John Doe', email: 'john@example.com', requestedDate: '2024-01-15', reason: 'Consultation', status: 'unverified', createdAt: '2024-01-10', updatedAt: '2024-01-10' },
  { id: 'appt2', directorId: 'dir1', name: 'Jane Smith', email: 'jane@example.com', requestedDate: '2024-01-16', reason: 'Follow-up', status: 'unverified', createdAt: '2024-01-11', updatedAt: '2024-01-11' },
  { id: 'appt3', directorId: 'dir2', name: 'Peter Pan', email: 'peter@example.com', requestedDate: '2024-01-17', reason: 'New Project', status: 'unverified', createdAt: '2024-01-12', updatedAt: '2024-01-12' },
];

const UnverifiedAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log("Simulating fetch unverified appointments...");
    setTimeout(() => {
      // Filter dummy data or based on user role if needed for simulation
      // For an admin, they might see all. For a director, only their own.
      let relevantAppointments = dummyAppointments;
      if (user?.role === 'director') {
        // Assuming director's own ID is stored in user.id or a specific directorProfileId field
        // relevantAppointments = dummyAppointments.filter(a => a.directorId === user.id);
      }
      setAppointments(relevantAppointments.filter(a => a.status === 'unverified'));
      setLoading(false);
    }, 500);
    // TODO: Fetch unverified appointments
    // setLoading(true);
    // let url = '/admin/appointments/unverified'; // Admin gets all or needs a filter
    // if (user?.role === 'director') {
    //   url = \`/appointments/directors/\${user.id}/unverified\`; // Director gets their own
    // }
    // apiService.get<Appointment[]>(url)
    //   .then(response => setAppointments(response.data.filter(a => a.status === 'unverified')))
    //   .catch(err => setError("Failed to load unverified appointments."))
    //   .finally(() => setLoading(false));
  }, [user]);

  const handleVerify = async (appointmentId: string) => {
    // TODO: Call API: POST /appointments/{appointmentId}/verify
    console.log(`Simulating verify appointment: ${appointmentId}`);
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    // In a real app, you might re-fetch or update status locally if API confirms.
  };

  const handleReject = async (appointmentId: string) => {
    // TODO: Call API: POST /appointments/{appointmentId}/reject
    console.log(`Simulating reject appointment: ${appointmentId}`);
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
  };

  if (loading) return <div className="text-center py-10">Loading appointments...</div>;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' or 'director' */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Unverified Appointments</h1>
        {appointments.length === 0 && <p className="text-gray-600">No unverified appointments found.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map(appt => (
            <div key={appt.id} className="bg-white p-6 rounded-xl shadow-lg space-y-3 border border-gray-200">
              <h2 className="text-xl font-semibold text-indigo-700">{appt.name}</h2>
              <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(appt.requestedDate).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600"><strong>Email:</strong> {appt.email}</p>
              {appt.phone && <p className="text-sm text-gray-600"><strong>Phone:</strong> {appt.phone}</p>}
              <p className="text-sm text-gray-600"><strong>Director ID:</strong> {appt.directorId}</p>
              <p className="text-sm text-gray-600"><strong>Reason:</strong> {appt.reason}</p>
              <p className="text-sm font-medium">Status: <span className="capitalize text-orange-600 font-semibold">{appt.status}</span></p>
              <div className="flex space-x-3 pt-4">
                <button onClick={() => handleVerify(appt.id)} className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 shadow-sm transition duration-150 ease-in-out">Verify</button>
                <button onClick={() => handleReject(appt.id)} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 shadow-sm transition duration-150 ease-in-out">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UnverifiedAppointmentsPage;
