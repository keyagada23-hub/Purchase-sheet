'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createUser } from '@/app/actions/user';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['User', 'Admin', 'Developer']),
  status: z.enum(['Active', 'Inactive']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function NewUserPage() {
  const { currentUser } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const isDeveloper = currentUser?.role === 'Developer';

  const { register, handleSubmit, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'User',
      status: 'Active',
    }
  });

  const onSubmit = async (data: UserFormValues) => {
    // Extra guard just in case
    if (!isDeveloper && (data.role === 'Admin' || data.role === 'Developer')) {
      toast({
        title: "Permission Denied",
        description: "Only Developers can create Admin or Developer accounts.",
      });
      return;
    }

    try {
      await createUser({
        ...data,
        lastLogin: ''
      });
      
      toast({
        title: "Success",
        description: "User created successfully.",
      });
      
      router.push('/users');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
      });
    }
  };

  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Add New User</h1>
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
                <Input id="password" type="password" {...register('password')} placeholder="******" />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select 
                  id="role"
                  {...register('role')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="User">User</option>
                  {isDeveloper && <option value="Admin">Admin</option>}
                  {isDeveloper && <option value="Developer">Developer</option>}
                </select>
                {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select 
                  id="status"
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-4">
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
