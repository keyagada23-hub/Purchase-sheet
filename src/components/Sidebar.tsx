'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { LayoutDashboard, Package, Users, FileText, ShoppingCart, Settings, Shield, BarChart3, Database, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAppStore();
  const mounted = useMounted();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['User', 'Admin', 'Developer'] },
    { name: 'Enquiries', href: '/enquiries', icon: FileText, roles: ['User', 'Admin', 'Developer'] },
    { name: 'Vendors', href: '/vendors', icon: Database, roles: ['User', 'Admin', 'Developer'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['User', 'Admin', 'Developer'] },
    { name: 'Purchases', href: '/purchases', icon: ShoppingCart, roles: ['User', 'Admin', 'Developer'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['Admin', 'Developer'] },
    { name: 'Master Data', href: '/master-data', icon: Layers, roles: ['Developer'] },
    { name: 'Users & Access', href: '/users', icon: Users, roles: ['Admin', 'Developer'] },
    { name: 'System Settings', href: '/settings', icon: Settings, roles: ['Developer'] },
  ];

  if (!mounted || !currentUser) return null;

  return (
    <div className="w-72 h-full bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl relative z-10 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/60 bg-slate-900/50">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Megha<span className="text-indigo-400">Infotech</span></h1>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">{currentUser.role} Portal</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main Menu</div>
        {links.filter(link => link.roles.includes(currentUser.role)).map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden", 
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                  : "hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />}
              <Icon size={18} className={cn("transition-colors", isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200")} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/30">
        <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3 border border-slate-700/50">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
