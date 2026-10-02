// @ts-nocheck
'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreatableCombobox } from '@/components/CreatableCombobox';
import { getProducts, createProduct } from '@/app/actions/product';
import { getCategories, createCategory, getBrands, createBrand } from '@/app/actions/category';
import { Product, Brand, MasterCategory } from '@/types';

const productSchema = z.object({
  model: z.string().min(2, 'Model must be at least 2 characters'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  
  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedProducts, fetchedBrands, fetchedCategories] = await Promise.all([
          getProducts(),
          getBrands(),
          getCategories()
        ]);
        setProducts(fetchedProducts);
        setBrands(fetchedBrands);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, []);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const categoryId = watch('categoryId');
  const brandId = watch('brandId');
  const model = watch('model');

  const existingModels = Array.from(new Set(
    products
      .filter(p => p.categoryId === categoryId && p.model)
      .map(p => p.model)
  )).map(m => ({ id: m, name: m }));

  const handleCreateCategory = async (name: string) => {
    const newCat = await createCategory({ name, type: 'Product', description: null });
    setCategories(prev => [...prev, newCat]);
    return newCat.id;
  };

  const handleCreateBrand = async (name: string) => {
    const newBrand = await createBrand({ name, description: null });
    setBrands(prev => [...prev, newBrand]);
    return newBrand.id;
  };

  const onSubmit = async (data: ProductFormValues) => {
    const category = categories.find(c => c.id === data.categoryId);
    const brand = brands.find(b => b.id === data.brandId);
    
    // Auto-generate name based on Category, Brand, and Model
    const generatedName = `${category?.name || 'Product'} ${brand?.name || ''} ${data.model}`.trim();

    await createProduct({
      name: generatedName,
      model: data.model,
      brandId: data.brandId,
      categoryId: data.categoryId,
      subcategoryId: null,
      photoUrl: null,
      status: 'Active'
    });
    router.push('/products');
  };

  const productCategories = categories.filter(c => c.type === 'Product');

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-slate-500 text-sm">Register a new product in the master database.</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <CreatableCombobox 
                    items={productCategories}
                    value={categoryId}
                    onChange={(val) => setValue('categoryId', val, { shouldValidate: true })}
                    onCreate={handleCreateCategory}
                    placeholder="Select or type category..."
                  />
                  {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <CreatableCombobox 
                    items={brands}
                    value={brandId}
                    onChange={(val) => setValue('brandId', val, { shouldValidate: true })}
                    onCreate={handleCreateBrand}
                    placeholder="Select or type brand..."
                  />
                  {errors.brandId && <p className="text-sm text-red-500">{errors.brandId.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Model *</Label>
                  <CreatableCombobox 
                    items={existingModels}
                    value={model || ''}
                    onChange={(val) => setValue('model', val, { shouldValidate: true })}
                    onCreate={(name) => name}
                    placeholder={categoryId ? "Select or type model..." : "Select a category first..."}
                  />
                  {errors.model && <p className="text-sm text-red-500">{errors.model.message}</p>}
                </div>
              </CardContent>
            </Card>


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
