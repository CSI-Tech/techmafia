"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminSocketProvider } from '@/components/providers/AdminSocketContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
    if (sessionStorage.getItem('adminAuthenticated') !== 'true') {
      router.replace('/');
    }
  }, [router]);

  if (!mounted) return null; // Avoid hydration mismatch on initial render

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    router.replace('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Generate Team', path: '/admin/generate-team' },
    { name: 'Live Games', path: '/admin/games' },
    { name: 'Game History', path: '/admin/history' },
    { name: 'Game Logs', path: '/admin/logs' },
  ];

  return (
    <AdminSocketProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col space-y-8 md:min-h-screen">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">MAFIA</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Admin Portal</p>
          </div>
          
          <nav className="flex-1 space-y-2 flex flex-col">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-4 py-3 rounded-lg font-semibold transition-colors ${
                    isActive 
                      ? 'bg-red-50 text-primary' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            <button
              id="btn-admin-logout"
              onClick={handleLogout}
              className="mt-auto w-full px-4 py-3 rounded-lg text-left text-gray-400 hover:bg-red-50 hover:text-primary font-semibold transition-colors text-sm"
            >
              ← Logout
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </div>
    </AdminSocketProvider>
  );
}
