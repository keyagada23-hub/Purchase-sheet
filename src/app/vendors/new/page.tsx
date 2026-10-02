'use client';

import RoleGuard from '@/components/RoleGuard';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { getCategories, createCategory } from '@/app/actions/category';
import { createVendor, getVendors } from '@/app/actions/vendor';
import { MasterCategory, Vendor } from '@/types';
import { CreatableCombobox } from '@/components/CreatableCombobox';
import { useToast } from '@/hooks/use-toast';

const vendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export default function NewVendorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getVendors().then(setVendors).catch(console.error);
  }, []);

  const vendorCategories = categories.filter(c => c.type === 'Vendor');
  const distributorCategory = vendorCategories.find(c => c.name.toLowerCase() === 'distributor');

  const { register, handleSubmit, formState: { errors } } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      country: 'India',
      categoryId: ''
    }
  });



  const onSubmit = async (data: VendorFormValues) => {
    const isDuplicate = vendors.some(v => v.name.toLowerCase() === data.name.toLowerCase());
    
    if (isDuplicate) {
      toast({
        title: "Duplicate Vendor",
        description: "A vendor with this name already exists in the system.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createVendor({
        name: data.name,
        categoryId: data.categoryId,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        taxId: data.taxId || '',
        website: data.website || '',
        status: 'Active'
      });
      router.push('/vendors');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (name: string) => {
    const newCat = await createCategory({ name, type: 'Vendor' });
    setCategories(prev => [...prev, newCat]);
    return newCat.id;
  };



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
                <Label htmlFor="taxId">GSTNIN / UIN</Label>
                <Input id="taxId" {...register('taxId')} placeholder="e.g. 27AAAAA0000A1Z5" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register('phone')} placeholder="e.g. 9876543210" />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
