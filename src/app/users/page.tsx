'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUsers, deleteUser as deleteUserAction } from '@/app/actions/user';
import { User } from '@/types';
import Link from 'next/link';

export default function UsersPage() {
  const { currentUser } = useAppStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  
  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUserAction(id);
      loadUsers();
    }
  };

  const isDeveloper = currentUser?.role === 'Developer';
  const isAdmin = currentUser?.role === 'Admin';
  
  // Both Admin and Developer can view and edit, but with restrictions on who they can edit
  const canManage = isDeveloper || isAdmin;

  const canEditUser = (userRole: string) => {
    if (isDeveloper) return true; // Developer can edit anyone
    if (isAdmin && userRole === 'User') return true; // Admin can only edit 'User' role
    return false;
  };

  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
          {canManage && (
            <Link href="/users/new">
              <Button><Plus className="mr-2 h-4 w-4" /> Add User</Button>
            </Link>
          )}
        </div>

        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} className="text-center py-8">No users found</TableCell>
                </TableRow>
              ) : (
                users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'Developer' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'Admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.id === currentUser?.id ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Online
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.status === 'Active' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>
                          {user.status}
                        </span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right space-x-2">
                        {canEditUser(user.role) ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/users/${user.id}/edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {currentUser?.id !== user.id && ( // Prevent deleting oneself
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Protected</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </RoleGuard>
  );
}
