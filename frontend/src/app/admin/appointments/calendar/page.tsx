'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Appointment } from '@/types/appointment';
// import apiService from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const dummyCalendarAppointments: Appointment[] = [
  { id: 'appt1v', directorId: 'dir1', name: 'John Doe', email: 'john@example.com', requestedDate: '2024-01-15T10:00:00.000Z', reason: 'Consultation', status: 'verified', createdAt: '2024-01-10', updatedAt: '2024-01-14' },
  { id: 'appt4v', directorId: 'dir1', name: 'Another Client', email: 'another@example.com', requestedDate: '2024-01-15T14:00:00.000Z', reason: 'Meeting', status: 'verified', createdAt: '2024-01-12', updatedAt: '2024-01-13' },
  { id: 'appt5v', directorId: 'dir2', name: 'Busy Bee', email: 'busy@example.com', requestedDate: '2024-01-18T11:00:00.000Z', reason: 'Project Update', status: 'verified', createdAt: '2024-01-15', updatedAt: '2024-01-17' },
];


const DirectorCalendarPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDirectorId, setSelectedDirectorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Manage loading state for calendar data
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let directorIdToUse = selectedDirectorId;
    if (user?.role === 'director') {
      // directorIdToUse = user.id; // Or user.directorProfileId or similar
      // If director is logged in, default to their calendar unless admin overrides
      if (!selectedDirectorId) directorIdToUse = 'dir1'; // Simulate director 'dir1' is logged in
    }

    if (directorIdToUse) {
      console.log(`Simulating fetch calendar for director: ${directorIdToUse}`);
      setLoading(true);
      setTimeout(() => {
        setAppointments(dummyCalendarAppointments.filter(a => a.directorId === directorIdToUse && a.status === 'verified'));
        setLoading(false);
      }, 500);
      // TODO: Fetch calendar: GET /appointments/directors/{directorId}/calendar
      // apiService.get<Appointment[]>(`/appointments/directors/\${directorIdToUse}/calendar`)
      //   .then(response => setAppointments(response.data.filter(a => a.status === 'verified')))
      //   .catch(err => setError("Failed to load calendar data."))
      //   .finally(() => setLoading(false));
    } else if (user?.role !== 'admin') {
        setAppointments([]);
        setLoading(false);
    } else {
        setAppointments([]); // Admin needs to select a director
        setLoading(false);
    }
  }, [selectedDirectorId, user]);

  if (loading) return <div className="text-center py-10">Loading calendar...</div>;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <ProtectedRoute> {/* TODO: Add role='admin' or 'director' */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Director Calendar</h1>

        {user?.role === 'admin' && (
          <div className="mb-6">
            <label htmlFor="directorSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Director:</label>
            <select
              id="directorSelect"
              value={selectedDirectorId || ''}
              onChange={(e) => setSelectedDirectorId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="">-- Select a Director --</option>
              {/* TODO: Populate this select with actual directors from an API call */}
              <option value="dir1">Dr. Eve Director (dir1)</option>
              <option value="dir2">Mr. Frank Director (dir2)</option>
            </select>
          </div>
        )}

        {(!selectedDirectorId && user?.role === 'admin') && <p className="text-gray-600">Please select a director to view their calendar.</p>}
        {(selectedDirectorId || user?.role === 'director') && appointments.length === 0 && !loading && <p className="text-gray-600">No appointments found for this director's calendar.</p>}

        <div className="space-y-4">
          {appointments.map(appt => (
            <div key={appt.id} className="bg-white p-5 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-indigo-700">{appt.name} with Director {appt.directorId}</h3>
              <p className="text-sm text-gray-600">Date: {new Date(appt.requestedDate).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Reason: {appt.reason}</p>
              <p className="text-sm font-semibold text-green-600">Status: {appt.status}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-500 italic">
          Note: This is a basic list view for verified appointments. A full calendar component (e.g., React Big Calendar) would be implemented for a richer UI.
        </p>
      </div>
    </ProtectedRoute>
  );
};

export default DirectorCalendarPage;
