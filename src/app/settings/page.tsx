'use client';
import RoleGuard from '@/components/RoleGuard';
import { useState, useEffect } from 'react';
import { getCategories, createCategory, deleteCategory, getBrands, createBrand, deleteBrand } from '@/app/actions/category';
import { MasterCategory, Brand } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [newBrandName, setNewBrandName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'Product' | 'Vendor'>('Product');

  useEffect(() => {
    async function load() {
      try {
        const [cats, brs] = await Promise.all([getCategories(), getBrands()]);
        setCategories(cats);
        setBrands(brs);
      } catch (e) {
        console.error('Failed to load settings data', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const b = await createBrand({ name: newBrandName });
      setBrands([...brands, b]);
      setNewBrandName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      await deleteBrand(id);
      setBrands(brands.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const c = await createCategory({ name: newCatName, type: newCatType });
      setCategories([...categories, c]);
      setNewCatName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <RoleGuard roles={['Admin', 'Developer']}>
        <div className="flex h-full items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings & Master Data</h1>
        <p className="text-slate-500">Manage your product and vendor categories, as well as brands.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brands Management */}
          <Card>
            <CardHeader>
              <CardTitle>Brands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddBrand} className="flex gap-2">
                <Input 
                  placeholder="New brand name" 
                  value={newBrandName} 
                  onChange={(e) => setNewBrandName(e.target.value)} 
                />
                <Button type="submit"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </form>
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {brands.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">No brands found.</p>
                ) : (
                  brands.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50">
                      <span className="font-medium text-sm">{b.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBrand(b.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories Management */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <Input 
                  placeholder="New category name" 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1"
                />
                <div className="w-32">
                  <Select value={newCatType} onValueChange={(val: any) => setNewCatType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </form>
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">No categories found.</p>
                ) : (
                  categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-slate-500">{c.type}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
