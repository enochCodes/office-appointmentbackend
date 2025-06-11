'use client';

import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-gray-300 transition-colors">AppointmentSys</Link>
        <div className="space-x-2 md:space-x-3 text-sm md:text-base">
          <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <Link href="/appointments/request" className="hover:text-gray-300 transition-colors">New Request</Link>

          {!loading && isAuthenticated ? (
            <>
              {/* Admin specific links */}
              {user?.role === 'admin' && (
                <>
                  <Link href="/admin/users" className="hover:text-gray-300 transition-colors">Users</Link>
                  <Link href="/admin/directors" className="hover:text-gray-300 transition-colors">Directors</Link>
                  <Link href="/admin/assistants" className="hover:text-gray-300 transition-colors">Assistants</Link>
                  <Link href="/admin/appointments/unverified" className="hover:text-gray-300 transition-colors">Unverified</Link>
                  <Link href="/admin/appointments/calendar" className="hover:text-gray-300 transition-colors">Calendars</Link>
                </>
              )}
              {/* TODO: Add Director specific links e.g. /directors/me/appointments/unverified, /directors/me/calendar */}
              {/* Example for a director seeing their own unverified list if not admin */}
              {user?.role === 'director' && ! (user?.role === 'admin') && (
                 <Link href="/admin/appointments/unverified" className="hover:text-gray-300 transition-colors">My Unverified</Link>
                 // <Link href={`/directors/\${user.id}/calendar`} className="hover:text-gray-300 transition-colors">My Calendar</Link>
              )}
              <Link href="/profile" className="hover:text-gray-300 transition-colors">Profile</Link>
              <button onClick={logout} className="hover:text-gray-300 transition-colors cursor-pointer">Logout</button>
            </>
          ) : !loading ? (
            <Link href="/auth/login" className="hover:text-gray-300 transition-colors">Login</Link>
          ) : (
            <span className="text-sm text-gray-400">Loading...</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
