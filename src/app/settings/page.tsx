
'use client';
import RoleGuard from '@/components/RoleGuard';

export default function SettingsPage() {
  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings & Master Data</h1>
        <p className="text-slate-500">Master data management (Categories, Brands, Units) would be implemented here.</p>
      </div>
    </RoleGuard>
  );
}
