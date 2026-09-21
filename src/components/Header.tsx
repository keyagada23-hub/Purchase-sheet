'use client';

import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Header() {
  const { currentUser, logout } = useAppStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Welcome back, {currentUser.name.split(' ')[0]}!</h2>
        <p className="text-sm text-slate-500 font-medium">Here is what's happening with your store today.</p>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        </button>
        
        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
            <UserIcon size={14} className="text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider">{currentUser.role}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout} 
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors rounded-full px-4"
          >
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
