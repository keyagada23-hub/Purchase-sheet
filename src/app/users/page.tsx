
'use client';
import RoleGuard from '@/components/RoleGuard';

export default function UsersPage() {
  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-slate-500">User creation and role assignment would be implemented here.</p>
      </div>
    </RoleGuard>
  );
}
