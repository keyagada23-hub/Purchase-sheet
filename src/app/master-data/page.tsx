'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash, Edit, Layers, Plus, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { MasterCategory, Brand } from '@/types';
import {
  getCategories,
  createCategory as createCategoryAction,
  deleteCategory as deleteCategoryAction,
  updateCategory as updateCategoryAction,
  getBrands,
  createBrand as createBrandAction,
  deleteBrand as deleteBrandAction,
  updateBrand as updateBrandAction
} from '@/app/actions/category';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function MasterDataPage() {
  const { currentUser } = useAppStore();
  const { toast } = useToast();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search terms
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Add Category Dialog State
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'Product' | 'Vendor'>('Product');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Add Brand Dialog State
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  // Edit Dialog State
  const [editingCategory, setEditingCategory] = useState<MasterCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editBrandName, setEditBrandName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedBrands, fetchedCategories] = await Promise.all([
        getBrands(),
        getCategories()
      ]);
      setBrands(fetchedBrands);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to load master data:", error);
      toast({ title: "Error", description: "Failed to load master data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.type.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter(b =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [brands, brandSearch]);

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSavingCat(true);
    try {
      const cat = await createCategoryAction({ name: newCatName.trim(), type: newCatType });
      if (categories.some(c => c.id === cat.id)) {
        toast({ title: "Category Exists", description: `Category "${cat.name}" already exists.` });
      } else {
        setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: "Success", description: `Category "${cat.name}" created successfully!` });
      }
      setNewCatName('');
      setIsAddCatOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create category.", variant: "destructive" });
    } finally {
      setIsSavingCat(false);
    }
  };

  // Create Brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setIsSavingBrand(true);
    try {
      const brand = await createBrandAction({ name: newBrandName.trim() });
      if (brands.some(b => b.id === brand.id)) {
        toast({ title: "Brand Exists", description: `Brand "${brand.name}" already exists.` });
      } else {
        setBrands(prev => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: "Success", description: `Brand "${brand.name}" created successfully!` });
      }
      setNewBrandName('');
      setIsAddBrandOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create brand.", variant: "destructive" });
    } finally {
      setIsSavingBrand(false);
    }
  };

  // Edit Category
  const handleSaveEditCategory = async () => {
    if (!editingCategory || !editCatName.trim()) return;
    try {
      const updated = await updateCategoryAction(editingCategory.id, editCatName.trim());
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast({ title: "Success", description: "Category updated successfully." });
      setEditingCategory(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update category.", variant: "destructive" });
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategoryAction(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({ title: "Success", description: "Category deleted successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Cannot delete category. It is linked to existing products or vendors.", variant: "destructive" });
    }
  };

  // Edit Brand
  const handleSaveEditBrand = async () => {
    if (!editingBrand || !editBrandName.trim()) return;
    try {
      const updated = await updateBrandAction(editingBrand.id, editBrandName.trim());
      setBrands(prev => prev.map(b => b.id === updated.id ? updated : b));
      toast({ title: "Success", description: "Brand updated successfully." });
      setEditingBrand(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update brand.", variant: "destructive" });
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    try {
      await deleteBrandAction(id);
      setBrands(prev => prev.filter(b => b.id !== id));
      toast({ title: "Success", description: "Brand deleted successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Cannot delete brand. It is linked to existing products.", variant: "destructive" });
    }
  };

  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Master Data Management</h1>
              <p className="text-sm text-slate-500">Create, edit, or remove product/vendor categories and brands.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Categories Section */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">Categories</h2>
                <p className="text-xs text-slate-500 mt-0.5">{categories.length} total categories</p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddCatOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
              </Button>
            </div>

            {/* Search */}
            <div className="p-3 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="p-2 flex-1 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading categories...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {categorySearch ? "No categories match your search." : "No categories found. Click 'Add Category' above to create one."}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredCategories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors">
                      <div>
                        <div className="font-medium text-sm text-slate-900">{category.name}</div>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                          category.type === 'Product' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                          {category.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setEditingCategory(category);
                            setEditCatName(category.name);
                          }}
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          title="Delete Category"
                        >
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
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">Brands</h2>
                <p className="text-xs text-slate-500 mt-0.5">{brands.length} total brands</p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddBrandOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Brand
              </Button>
            </div>

            {/* Search */}
            <div className="p-3 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="p-2 flex-1 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading brands...</div>
              ) : filteredBrands.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {brandSearch ? "No brands match your search." : "No brands found. Click 'Add Brand' above to create one."}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredBrands.map(brand => (
                    <div key={brand.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors">
                      <div className="font-medium text-sm text-slate-900">{brand.name}</div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setEditingBrand(brand);
                            setEditBrandName(brand.name);
                          }}
                          title="Edit Brand"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteBrand(brand.id, brand.name)}
                          title="Delete Brand"
                        >
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

        {/* Add Category Dialog */}
        <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category for products or vendors.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="catName">Category Name *</Label>
                <Input
                  id="catName"
                  placeholder="e.g. LAPTOP, PRINTER, NETWORKING..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catType">Category Type</Label>
                <Select value={newCatType} onValueChange={(val) => { if (val) setNewCatType(val as 'Product' | 'Vendor'); }}>
                  <SelectTrigger id="catType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product">Product Category</SelectItem>
                    <SelectItem value="Vendor">Vendor Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddCatOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingCat || !newCatName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSavingCat ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Brand Dialog */}
        <Dialog open={isAddBrandOpen} onOpenChange={setIsAddBrandOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Brand</DialogTitle>
              <DialogDescription>
                Create a new product brand (e.g. Dell, HP, Lenovo).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBrand} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  placeholder="e.g. Dell, HP, Lenovo, Cisco..."
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddBrandOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingBrand || !newBrandName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSavingBrand ? 'Creating...' : 'Create Brand'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the name of this category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="editCatName">Category Name *</Label>
                <Input
                  id="editCatName"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEditCategory} disabled={!editCatName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Brand Dialog */}
        <Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
              <DialogDescription>
                Update the name of this brand.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="editBrandName">Brand Name *</Label>
                <Input
                  id="editBrandName"
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingBrand(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEditBrand} disabled={!editBrandName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </RoleGuard>
  );
}
