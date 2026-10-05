import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent flex flex-col relative overflow-x-hidden selection:bg-indigo-900 selection:text-white">
      <Navbar onMobileMenuToggle={() => setMobileSidebarOpen(true)} />
      
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative z-10">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
