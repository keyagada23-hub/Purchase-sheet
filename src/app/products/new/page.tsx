'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  defaultVendorId: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const { addProduct, brands, categories, vendors } = useAppStore();
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: 'Nos'
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    addProduct({
      id: `p${Date.now()}`,
      ...data,
      code: data.code || `P-${Date.now().toString().slice(-4)}`,
      sku: data.sku || '',
      barcode: data.barcode || '',
      description: data.description || '',
      defaultVendorId: data.defaultVendorId || '',
      photoUrl: photoUrl || '',
      status: 'Active'
    });
    router.push('/products');
  };

  const productCategories = categories.filter(c => c.type === 'Product');

  // Simulated image upload for the demo frontend
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app we'd upload to a server. Here we just create a local object URL to display it
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-slate-500 text-sm">Register a new product in the master database.</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" {...register('name')} placeholder="e.g. Dell Latitude 5440" className="text-lg" />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Product Code</Label>
                    <Input id="code" {...register('code')} placeholder="e.g. P-001" />
                    {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" {...register('sku')} placeholder="e.g. DELL-5440" />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select onValueChange={(val: string | null) => setValue('categoryId', val || '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Select onValueChange={(val: string | null) => setValue('brandId', val || '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.brandId && <p className="text-sm text-red-500">{errors.brandId.message}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory & Logistics</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode" {...register('barcode')} placeholder="Scan or enter barcode" className="font-mono" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Input id="unit" {...register('unit')} placeholder="e.g. Nos, Kg, Box" />
                    {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Default Vendor</Label>
                    <Select onValueChange={(val: string | null) => setValue('defaultVendorId', val || '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Default Vendor (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" {...register('description')} placeholder="Product description or notes" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Image</CardTitle>
                  <CardDescription>Upload a clear photo of the product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl relative hover:bg-slate-50 transition-colors group">
                    {photoUrl ? (
                      <div className="relative aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl} alt="Product preview" className="w-full h-full object-contain rounded-xl p-2 bg-white" />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setPhotoUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-8 aspect-square cursor-pointer text-slate-500 hover:text-slate-700">
                        <UploadCloud className="h-12 w-12 mb-4 text-slate-400" />
                        <p className="font-medium text-sm text-center mb-1">Click to upload image</p>
                        <p className="text-xs text-slate-400">JPG, PNG up to 2MB</p>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                  {photoUrl && (
                    <div className="mt-4">
                      <Label className="text-xs text-slate-500">Image URL (Optional Override)</Label>
                      <Input 
                        value={photoUrl} 
                        onChange={(e) => setPhotoUrl(e.target.value)} 
                        className="mt-1 text-xs" 
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
          
          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Discard</Button>
            <Button type="submit" size="lg" className="px-8">Save Product</Button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
