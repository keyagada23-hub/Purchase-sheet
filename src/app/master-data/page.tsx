'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Trash, Edit, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MasterCategory, Brand } from '@/types';
import { getCategories, deleteCategory as deleteCategoryAction, updateCategory as updateCategoryAction, getBrands, deleteBrand as deleteBrandAction, updateBrand as updateBrandAction } from '@/app/actions/category';

export default function MasterDataPage() {
  const { currentUser } = useAppStore();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  
  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedBrands, fetchedCategories] = await Promise.all([
          getBrands(),
          getCategories()
        ]);
        setBrands(fetchedBrands);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to load master data:", error);
      }
    }
    loadData();
  }, []);

  const deleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category? This might fail if products are linked to it.")) return;
    try {
      await deleteCategoryAction(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert("Failed to delete category. It is likely linked to existing products or vendors.");
    }
  };

  const editCategory = async (category: MasterCategory) => {
    const newName = window.prompt("Enter new category name:", category.name);
    if (newName && newName.trim() !== "" && newName !== category.name) {
      try {
        await updateCategoryAction(category.id, newName.trim());
        setCategories(prev => prev.map(c => c.id === category.id ? { ...c, name: newName.trim() } : c));
      } catch (err) {
        alert("Failed to update category. It might be a duplicate.");
      }
    }
  };

  const deleteBrand = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this brand? This might fail if products are linked to it.")) return;
    try {
      await deleteBrandAction(id);
      setBrands(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      alert("Failed to delete brand. It is likely linked to existing products.");
    }
  };

  const editBrand = async (brand: Brand) => {
    const newName = window.prompt("Enter new brand name:", brand.name);
    if (newName && newName.trim() !== "" && newName !== brand.name) {
      try {
        await updateBrandAction(brand.id, newName.trim());
        setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, name: newName.trim() } : b));
      } catch (err) {
        alert("Failed to update brand. It might be a duplicate.");
      }
    }
  };

  return (
    <RoleGuard roles={['Developer']}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Layers className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Master Data Management</h1>
            <p className="text-sm text-slate-500">Edit or delete categories and brands. Models are attached directly to products and can be edited on the Products page.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Categories Section */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-800">Categories</h2>
            </div>
            <div className="p-2">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No categories found.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-slate-500">{category.type}</div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => editCategory(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteCategory(category.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Brands Section */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b">
              <h2 className="font-semibold text-slate-800">Brands</h2>
            </div>
            <div className="p-2">
              {brands.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No brands found.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {brands.map(brand => (
                    <div key={brand.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group">
                      <div className="font-medium">{brand.name}</div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => editBrand(brand)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteBrand(brand.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}
