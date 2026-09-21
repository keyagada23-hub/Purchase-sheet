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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const vendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export default function NewVendorPage() {
  const { addVendor, categories } = useAppStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      country: 'India'
    }
  });

  const onSubmit = (data: VendorFormValues) => {
    addVendor({
      id: `v${Date.now()}`,
      name: data.name,
      code: data.code || `V-${Date.now().toString().slice(-4)}`,
      categoryId: data.categoryId,
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email,
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      taxId: data.taxId || '',
      website: data.website || '',
      status: 'Active'
    });
    router.push('/vendors');
  };

  const vendorCategories = categories.filter(c => c.type === 'Vendor');

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Add New Vendor</h1>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. ABC Technologies" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Vendor Code</Label>
                <Input id="code" {...register('code')} placeholder="e.g. V-001" />
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select onValueChange={(val: string | null) => setValue('categoryId', val || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" {...register('contactPerson')} placeholder="e.g. John Doe" />
                {errors.contactPerson && <p className="text-sm text-red-500">{errors.contactPerson.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register('phone')} placeholder="e.g. 9876543210" />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" {...register('email')} placeholder="e.g. contact@vendor.com" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Location & Other Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register('address')} placeholder="e.g. 123 Tech Park" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} placeholder="e.g. Mumbai" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register('state')} placeholder="e.g. Maharashtra" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register('country')} placeholder="e.g. India" />
                {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / GST</Label>
                <Input id="taxId" {...register('taxId')} placeholder="e.g. 27AAAAA0000A1Z5" />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register('website')} placeholder="e.g. https://www.vendor.com" />
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button type="submit">Save Vendor</Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
