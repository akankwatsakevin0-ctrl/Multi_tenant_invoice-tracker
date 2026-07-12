import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../../store/uiStore';
import { Toaster } from 'react-hot-toast';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <Sidebar mobile onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content area */}
      <div className="lg:pl-[260px]">
        <Header />

        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
          },
        }}
      />
    </div>
  );
};
