'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUser as updateUserAction } from '@/app/actions/user';
import { getUsers } from '@/app/actions/user';
import { User } from '@/types';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['User', 'Admin', 'Developer']),
  status: z.enum(['Active', 'Inactive']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function EditUserPage() {
  const { currentUser } = useAppStore();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const userId = params?.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const users = await getUsers();
        const found = users.find(u => u.id === userId);
        setUser(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  const isDeveloper = currentUser?.role === 'Developer';
  const isAdmin = currentUser?.role === 'Admin';

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'User',
      status: 'Active',
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role,
        status: user.status,
      });
    }
  }, [user, reset]);

  const roleValue = watch('role');
  const statusValue = watch('status');

  const onSubmit = async (data: UserFormValues) => {
    if (!user) return;

    // Security check: Admins cannot modify Developer/Admin accounts
    if (!isDeveloper && (user.role === 'Admin' || user.role === 'Developer')) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to modify this account.",
      });
      return;
    }

    // Security check: Admins cannot upgrade users to Admin/Developer
    if (!isDeveloper && (data.role === 'Admin' || data.role === 'Developer')) {
      toast({
        title: "Permission Denied",
        description: "Only Developers can assign Admin or Developer roles.",
      });
      return;
    }
    
    try {
      await updateUserAction(user.id, {
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role as any,
        status: data.status as any,
      });
      
      toast({
        title: "Success",
        description: "User credentials updated successfully.",
      });
      
      router.push('/users');
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update user.",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading user...</div>;
  }

  if (!user) {
    return (
      <RoleGuard roles={['Admin', 'Developer']}>
        <div className="text-center py-12">User not found</div>
      </RoleGuard>
    );
  }

  // Double check UI guard in case they navigate directly to the edit route
  if (!isDeveloper && (user.role === 'Admin' || user.role === 'Developer')) {
    return (
      <RoleGuard roles={['Admin', 'Developer']}>
        <div className="text-center py-12 text-red-500 font-medium">Access Denied: You cannot edit protected accounts.</div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. John Doe" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" {...register('username')} placeholder="e.g. johndoe" />
                {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" {...register('email')} placeholder="e.g. john@example.com" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="text" {...register('password')} placeholder="******" />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                <p className="text-xs text-slate-500">Visible for admin convenience. Change to update.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Role & Access</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select onValueChange={(val: any) => setValue('role', val, { shouldValidate: true })} value={roleValue} disabled={!isDeveloper && user.role !== 'User'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    {isDeveloper && <SelectItem value="Admin">Admin</SelectItem>}
                    {isDeveloper && <SelectItem value="Developer">Developer</SelectItem>}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select onValueChange={(val: any) => setValue('status', val, { shouldValidate: true })} value={statusValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button type="submit">Update User</Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
