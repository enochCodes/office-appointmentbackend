import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext'; // Corrected import path
import Layout from '@/components/layout/Layout'; // Corrected import path

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Appointment System',
  description: 'Manage your appointments efficiently.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Layout> {/* Wrap children with Layout */}
            {children}
          </Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
