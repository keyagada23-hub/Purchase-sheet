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
import { getProducts, createProduct, deleteModel } from '@/app/actions/product';
import { getCategories, createCategory, getBrands, createBrand, deleteCategory, deleteBrand } from '@/app/actions/category';
import { Product, Brand, MasterCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  model: z.string().min(2, 'Model must be at least 2 characters'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
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

  const { currentUser } = useAppStore();
  
  const categoryId = watch('categoryId');
  const brandId = watch('brandId');
  const model = watch('model');

  const existingModels = Array.from(new Set(
    products
      .filter(p => p.categoryId === categoryId && p.model)
      .map(p => p.model)
  )).map(m => ({ id: m, name: m }));

  const handleCreateCategory = async (name: string) => {
    try {
      const newCat = await createCategory({ name, type: 'Product' });
      setCategories(prev => [...prev, newCat]);
      return newCat.id;
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to create category. See console.", variant: "destructive" });
      return "";
    }
  };

  const handleCreateBrand = async (name: string) => {
    try {
      const newBrand = await createBrand({ name });
      setBrands(prev => [...prev, newBrand]);
      return newBrand.id;
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to create brand. See console.", variant: "destructive" });
      return "";
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Cannot delete this category because it is in use.", variant: "destructive" });
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      await deleteBrand(id);
      setBrands(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Cannot delete this brand because it is in use.", variant: "destructive" });
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await deleteModel(categoryId, brandId, id);
      setProducts(prev => prev.map(p => (p.categoryId === categoryId && p.brandId === brandId && p.model === id) ? { ...p, model: null } : p));
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Cannot delete this model.", variant: "destructive" });
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    const category = categories.find(c => c.id === data.categoryId);
    const brand = brands.find(b => b.id === data.brandId);
    
    // Auto-generate name based on Category, Brand, and Model
    const generatedName = `${category?.name || 'Product'} ${brand?.name || ''} ${data.model}`.trim();

    const isDuplicate = products.some(p => p.name.toLowerCase() === generatedName.toLowerCase());
    
    if (isDuplicate) {
      toast({
        title: "Duplicate Product",
        description: "A product with this exact Name, Brand, and Model already exists.",
        variant: "destructive"
      });
      return;
    }

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
                    onDelete={currentUser?.role === 'Developer' ? handleDeleteCategory : undefined}
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
                    onDelete={currentUser?.role === 'Developer' ? handleDeleteBrand : undefined}
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
                    onDelete={currentUser?.role === 'Developer' && categoryId && brandId ? handleDeleteModel : undefined}
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
