'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash, 
  Trash2, 
  Search, 
  Barcode, 
  Layers, 
  Package, 
  Cpu, 
  HardDrive, 
  Printer, 
  Shield, 
  X,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Product, Brand, MasterCategory, Enquiry } from '@/types';
import { getProducts, deleteProduct as deleteProductAction } from '@/app/actions/product';
import { 
  getCategories, 
  createCategory as createCategoryAction,
  deleteCategory as deleteCategoryAction, 
  updateCategory as updateCategoryAction, 
  getBrands 
} from '@/app/actions/category';
import { getEnquiries } from '@/app/actions/enquiry';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { currentUser } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add Category Dialog State
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Edit Category Dialog State
  const [editingCategory, setEditingCategory] = useState<MasterCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

  // Delete Category Dialog State
  const [deletingCategory, setDeletingCategory] = useState<MasterCategory | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedProducts, fetchedBrands, fetchedCategories, fetchedEnquiries] = await Promise.all([
          getProducts(),
          getBrands(),
          getCategories(),
          getEnquiries(),
        ]);
        setProducts(fetchedProducts);
        setBrands(fetchedBrands);
        setCategories(fetchedCategories);
        setEnquiries(fetchedEnquiries);
      } catch (error) {
        console.error("Failed to load products data:", error);
      }
    }
    loadData();
  }, []);

  const canEdit = currentUser?.role === 'User' || currentUser?.role === 'Admin' || currentUser?.role === 'Developer';
  const productCategories = useMemo(() => {
    return categories
      .filter(c => c.type === 'Product')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  // Product counts per category
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  // Filtered categories by search
  const visibleCategories = useMemo(() => {
    if (!categorySearch.trim()) return productCategories;
    return productCategories.filter(c => 
      c.name.toLowerCase().includes(categorySearch.toLowerCase().trim())
    );
  }, [productCategories, categorySearch]);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (p.model?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const deleteProduct = async (id: string) => {
    try {
      await deleteProductAction(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: "Success", description: "Product deleted successfully." });
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    }
  };

  // Add Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    setIsSavingCat(true);
    try {
      const cat = await createCategoryAction({ name: trimmed, type: 'Product' });
      if (categories.some(c => c.id === cat.id)) {
        toast({ title: "Category Exists", description: `Category "${cat.name}" already exists.` });
      } else {
        setCategories(prev => [...prev, cat]);
        toast({ title: "Success", description: `Category "${cat.name}" created successfully!` });
      }
      setSelectedCategory(cat.id);
      setNewCatName('');
      setIsAddCatOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create category.", variant: "destructive" });
    } finally {
      setIsSavingCat(false);
    }
  };

  // Update Category Handler
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmed = editCatName.trim();
    if (!trimmed) return;

    setIsUpdatingCat(true);
    try {
      const updated = await updateCategoryAction(editingCategory.id, trimmed);
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: updated.name } : c));
      toast({ title: "Success", description: `Category renamed to "${updated.name}".` });
      setEditingCategory(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update category.", variant: "destructive" });
    } finally {
      setIsUpdatingCat(false);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeletingCat(true);
    try {
      await deleteCategoryAction(deletingCategory.id);
      setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
      if (selectedCategory === deletingCategory.id) {
        setSelectedCategory('all');
      }
      toast({ title: "Success", description: `Category "${deletingCategory.name}" deleted.` });
      setDeletingCategory(null);
    } catch (err: any) {
      toast({ title: "Error", description: "Cannot delete this category because it is in use by products.", variant: "destructive" });
    } finally {
      setIsDeletingCat(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cpu') || lower.includes('processor')) return <Cpu className="h-4 w-4" />;
    if (lower.includes('hdd') || lower.includes('ssd') || lower.includes('drive') || lower.includes('storage')) return <HardDrive className="h-4 w-4" />;
    if (lower.includes('printer') || lower.includes('ink')) return <Printer className="h-4 w-4" />;
    if (lower.includes('antivirus') || lower.includes('security')) return <Shield className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products Master</h1>
            <p className="text-sm text-slate-500">Manage products, categories, models, and specifications</p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddCatOpen(true)}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Category
              </Button>
              <Link href="/products/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  <Plus className="mr-1.5 h-4 w-4" /> Add Product
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Unified Search and Barcode Input */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
          <form onSubmit={handleBarcodeSubmit} className="flex flex-1 bg-white shadow-sm rounded-lg overflow-hidden border">
            <div className="bg-slate-100 p-3 text-slate-500 border-r flex items-center justify-center">
              <Barcode className="h-5 w-5" />
            </div>
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name, model, serial, or barcode..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-12"
            />
            <Button type="submit" variant="ghost" className="rounded-none h-12 px-6 bg-slate-50 hover:bg-slate-100 border-l">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Refined Categories Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Category Boxes
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {productCategories.length} Categories
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Click any category to filter, or add a new category easily</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {productCategories.length > 5 && (
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Filter categories..."
                    className="h-8 pl-8 pr-7 text-xs w-36 sm:w-48 bg-slate-50 rounded-lg border-slate-200"
                  />
                  {categorySearch && (
                    <button 
                      onClick={() => setCategorySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {canEdit && (
                <Button 
                  size="sm" 
                  onClick={() => setIsAddCatOpen(true)}
                  className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Category
                </Button>
              )}
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {/* All Products Box */}
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`group relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[96px] ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-transparent shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500 ring-offset-2'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className={`p-1.5 rounded-lg ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Layers className="h-4 w-4" />
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {products.length}
                </span>
              </div>
              <div>
                <div className={`font-semibold text-xs leading-snug truncate ${selectedCategory === 'all' ? 'text-white' : 'text-slate-900'}`}>
                  All Products
                </div>
                <span className={`text-[10px] ${selectedCategory === 'all' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Full catalog
                </span>
              </div>
            </button>

            {/* Each Category Box */}
            {visibleCategories.map((c) => {
              const count = productCounts[c.id] || 0;
              const isSelected = selectedCategory === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`group relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[96px] cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-transparent shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500 ring-offset-2'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      {getCategoryIcon(c.name)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {count}
                      </span>
                      {canEdit && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(c);
                              setEditCatName(c.name);
                            }}
                            className={`p-1 rounded hover:bg-black/10 ${isSelected ? 'text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                            title="Edit category name"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          {(currentUser?.role === 'Admin' || currentUser?.role === 'Developer') && (
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(c)}
                              className={`p-1 rounded hover:bg-black/10 ${isSelected ? 'text-white' : 'text-slate-400 hover:text-red-600'}`}
                              title="Delete category"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className={`font-semibold text-xs leading-snug truncate ${isSelected ? 'text-white' : 'text-slate-900'}`} title={c.name}>
                      {c.name}
                    </div>
                    <span className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* "+ New Category" Dashed Card */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAddCatOpen(true)}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[96px] text-slate-500 hover:text-indigo-600 group"
              >
                <div className="p-1.5 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600 transition-colors mb-1">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 leading-tight">New Category</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-500">Click to add</span>
              </button>
            )}
          </div>
        </div>

        {/* Products Table Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">
              {selectedCategory === 'all' 
                ? 'All Products' 
                : productCategories.find(c => c.id === selectedCategory)?.name || 'Products'}
            </h2>
            <span className="text-sm text-slate-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </span>
          </div>

          <div className="border rounded-md bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setSelectedProduct(product)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          {product.photoUrl ? (
                            <img 
                              src={product.photoUrl} 
                              alt={product.name} 
                              className="h-10 w-10 object-contain rounded-md border p-0.5 bg-slate-50 shrink-0" 
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-slate-100 border flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                              {(product.name || 'P').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-1">
                            {product.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {brands.find(b => b.id === product.brandId)?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {product.model || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs mr-1" 
                          onClick={() => router.push(`/enquiries/new?productId=${product.id}`)}
                        >
                          Enquire
                        </Button>
                        {canEdit && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-blue-600" 
                              onClick={() => router.push(`/products/${product.id}/edit`)}
                              title="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600" 
                              onClick={() => deleteProduct(product.id)}
                              title="Delete product"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Add Product Category
            </DialogTitle>
            <DialogDescription>
              Create a new category to group products in your inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="categoryNameInput">Category Name *</Label>
              <Input
                id="categoryNameInput"
                placeholder="e.g. LAPTOP, PRINTER, NETWORKING..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
                required
              />
              <p className="text-[11px] text-slate-500">
                The category will appear immediately as a selectable box and in product forms.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddCatOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSavingCat || !newCatName.trim()} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSavingCat ? 'Creating...' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-600" />
              Edit Category Name
            </DialogTitle>
            <DialogDescription>
              Update the name of this product category.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editCatNameInput">Category Name *</Label>
              <Input
                id="editCatNameInput"
                value={editCatName}
                onChange={(e) => setEditCatName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdatingCat || !editCatName.trim()} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isUpdatingCat ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Category
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete category <strong>&quot;{deletingCategory?.name}&quot;</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              disabled={isDeletingCat}
              onClick={handleDeleteCategory}
            >
              {isDeletingCat ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 text-sm">
              {selectedProduct.photoUrl && (
                <div className="flex justify-center mb-4">
                  <img src={selectedProduct.photoUrl} alt="Product" className="h-32 object-contain rounded-md border p-1" />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="col-span-2 font-semibold">{selectedProduct.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">Model</span>
                <span className="col-span-2">{selectedProduct.model || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">Category</span>
                <span className="col-span-2">{categories.find(c => c.id === selectedProduct.categoryId)?.name || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">Brand</span>
                <span className="col-span-2">{brands.find(b => b.id === selectedProduct.brandId)?.name || '-'}</span>
              </div>

              {/* Product Purchase Costing & Sub-Costing */}
              {(() => {
                const productPurchases = enquiries.filter(e => e.productId === selectedProduct.id && e.isPurchased);
                const latestPurchase = productPurchases[productPurchases.length - 1];
                if (!latestPurchase) {
                  return (
                    <div className="border-t pt-3 mt-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Costing Status</span>
                      <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded border border-dashed">
                        No purchase records yet. Create an enquiry and mark as purchased to see total costing and sub-components.
                      </p>
                    </div>
                  );
                }

                const parsedSubCosts: { name: string; price: number }[] = (() => {
                  if (!latestPurchase.subCosts) return [];
                  try { return JSON.parse(latestPurchase.subCosts); } catch { return []; }
                })();
                const totalSub = parsedSubCosts.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                const baseSpent = (latestPurchase.purchasePrice || 0) * (latestPurchase.purchaseQuantity || latestPurchase.quantity);
                const totalCosting = baseSpent + totalSub;

                return (
                  <div className="border-t pt-3 mt-3 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Purchase Costing & Sub-Costing
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border">
                      <div>
                        <span className="text-slate-500 block">Base Price (w/o GST)</span>
                        <span className="font-semibold text-slate-800">₹ {Number(baseSpent.toFixed(2)).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Purchased Qty</span>
                        <span className="font-semibold text-slate-800">{latestPurchase.purchaseQuantity || latestPurchase.quantity}</span>
                      </div>
                    </div>

                    {parsedSubCosts.length > 0 && (
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded border">
                        <span className="text-[11px] font-semibold text-slate-600 block">Sub-Costing Accessories:</span>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          {parsedSubCosts.map((sub, i) => (
                            <div key={i} className="flex justify-between bg-white px-2 py-1 rounded border">
                              <span className="text-slate-600">{sub.name}</span>
                              <span className="font-semibold text-slate-900">₹ {Number(sub.price.toFixed(2)).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Total Costing</span>
                        <span className="text-[11px] text-slate-600">Base + Sub-costs</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">₹ {Number(totalCosting.toFixed(2)).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">(w/o GST)</span></p>
                        <p className="text-sm font-bold text-emerald-700">₹ {Number((totalCosting * 1.18).toFixed(2)).toLocaleString()} <span className="text-[10px] font-normal text-emerald-600">(+18% GST)</span></p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedProduct(null)}>Close</Button>
            {canEdit && selectedProduct && (
              <Button type="button" onClick={() => router.push(`/products/${selectedProduct.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Record
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
