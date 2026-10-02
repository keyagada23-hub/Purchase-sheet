'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash, Search, Barcode, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Product, Brand, MasterCategory } from '@/types';
import { getProducts, deleteProduct as deleteProductAction } from '@/app/actions/product';
import { getCategories, deleteCategory as deleteCategoryAction, getBrands } from '@/app/actions/category';

export default function ProductsPage() {
  const { currentUser } = useAppStore();
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
        console.error("Failed to load products data:", error);
      }
    }
    loadData();
  }, []);

  const deleteProduct = async (id: string) => {
    try {
      await deleteProductAction(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteCategoryAction(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const router = useRouter();

  const canEdit = currentUser?.role === 'User' || currentUser?.role === 'Admin' || currentUser?.role === 'Developer';
  const productCategories = categories.filter(c => c.type === 'Product');

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (p.model?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Products Master</h1>
          {canEdit && (
            <Link href="/products/new">
              <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
          {/* Unified Search and Barcode Input */}
          <form onSubmit={handleBarcodeSubmit} className="flex flex-1 bg-white shadow-sm rounded-lg overflow-hidden border">
            <div className="bg-slate-100 p-3 text-slate-500 border-r flex items-center justify-center">
              <Barcode className="h-5 w-5" />
            </div>
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, model, serial, or barcode..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-12"
            />
            <Button type="submit" variant="ghost" className="rounded-none h-12 px-6 bg-slate-50 hover:bg-slate-100 border-l">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Category Filter */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[250px] h-12 bg-white shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span className="truncate">
                    {selectedCategory === 'all' 
                      ? 'All Categories' 
                      : productCategories.find(c => c.id === selectedCategory)?.name || 'All Categories'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {productCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentUser?.role === 'Developer' && selectedCategory !== 'all' && (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 shrink-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this category?")) {
                    deleteCategory(selectedCategory);
                    setSelectedCategory('all');
                  }
                }}
                title="Delete Selected Category"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 bg-white border rounded-xl">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                <div className="p-4 flex flex-col flex-1 relative group">
                  <div className="text-xs font-semibold text-blue-600 mb-1">{categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized'}</div>
                  <h3 className="font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-blue-600 hover:underline" title={product.name} onClick={() => setSelectedProduct(product)}>{product.name}</h3>
                  <div className="text-sm text-slate-500 mt-1 flex justify-between items-center">
                    <span>{brands.find(b => b.id === product.brandId)?.name || 'No Brand'}</span>
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs truncate max-w-[50%] text-right" title={product.model}>{product.model}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-slate-500">Master Record</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => router.push(`/products/${product.id}/edit`)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => deleteProduct(product.id)}>
                              <Trash className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => router.push(`/enquiries/new?productId=${product.id}`)}>
                        Enquire
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

            </div>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
