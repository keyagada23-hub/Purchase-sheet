
'use client';
import RoleGuard from '@/components/RoleGuard';

export default function ReportsPage() {
  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-slate-500">Charts and Data Exports would be implemented here.</p>
      </div>
    </RoleGuard>
  );
}
