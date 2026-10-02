'use client';

import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMounted } from '@/hooks/use-mounted';

export default function Header() {
  const { currentUser, logout } = useAppStore();
  const router = useRouter();
  const mounted = useMounted();

  if (!mounted || !currentUser) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Welcome back, {currentUser.name.split(' ')[0]}!</h2>
        <p className="text-sm text-slate-500 font-medium">Here is what&apos;s happening with your store today.</p>
      </div>
      
      <div className="flex items-center gap-6">

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
