// @ts-nocheck
'use client';

import RoleGuard from '@/components/RoleGuard';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCategories } from '@/app/actions/category';
import { getVendors, updateVendor } from '@/app/actions/vendor';
import { MasterCategory, Vendor } from '@/types';

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

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const vendorId = params?.id as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getVendors(),
      getCategories()
    ]).then(([fetchedVendors, fetchedCategories]) => {
      const foundVendor = fetchedVendors.find(v => v.id === vendorId);
      if (foundVendor) setVendor(foundVendor);
      setCategories(fetchedCategories);
      setIsLoading(false);
    }).catch((err) => {
      console.error(err);
      setIsLoading(false);
    });
  }, [vendorId]);

  const vendorCategories = categories.filter(c => c.type === 'Vendor');
  const distributorCategory = vendorCategories.find(c => c.name.toLowerCase() === 'distributor');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      country: 'India',
      categoryId: ''
    }
  });

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name,
        categoryId: vendor.categoryId || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        country: vendor.country || '',
        taxId: vendor.taxId || '',
        website: vendor.website || '',
      });
    }
  }, [vendor, reset]);

  const onSubmit = async (data: VendorFormValues) => {
    if (!vendor) return;
    
    try {
      await updateVendor(vendor.id, {
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        taxId: data.taxId || '',
        website: data.website || '',
      });
      
      toast({
        title: "Success",
        description: "Vendor updated successfully.",
      });
      
      router.push('/vendors');
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update vendor.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <RoleGuard roles={['User', 'Admin', 'Developer']}>
        <div className="text-center py-12">Loading...</div>
      </RoleGuard>
    );
  }

  if (!vendor) {
    return (
      <RoleGuard roles={['User', 'Admin', 'Developer']}>
        <div className="text-center py-12">Vendor not found</div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Edit Vendor</h1>
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
            <Button type="submit">Update Vendor</Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
