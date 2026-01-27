'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notifiche, setNotifiche] = useState(3);
  const [dropdown, setDropdown] = useState(false);

  const pagine = [
    { href: '/dashboard/miei-dati', nome: 'I Miei Dati', icon: '📌' },
    { href: '/dashboard/calendario', nome: 'Calendario', icon: '📅' },
    { href: '/dashboard/approvazioni', nome: 'Approvazioni', icon: '✅' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const iniziali = user?.name ?
    user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD';

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Navigazione sinistra */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Indietro"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <nav className="hidden md:flex gap-1">
              {pagine.map((pagina) => (
                <a
                  key={pagina.href}
                  href={pagina.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === pagina.href
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {pagina.icon} {pagina.nome}
                </a>
              ))}
            </nav>
          </div>

          {/* Header destro */}
          <div className="flex items-center gap-4">

            {/* Campanello notifiche */}
            <div className="relative">
              <button className="p-2 relative hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifiche > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {notifiche}
                  </span>
                )}
              </button>
            </div>

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-full"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {iniziali}
                </div>
                <div className="hidden md:block">
                  <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role?.toUpperCase()}</p>
                </div>
              </button>

              {dropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b text-xs text-gray-500">
                    {user?.team}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

