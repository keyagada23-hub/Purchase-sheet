'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash, Search, Barcode } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Product, Brand, MasterCategory } from '@/types';
import { getProducts, deleteProduct as deleteProductAction } from '@/app/actions/product';
import { getCategories, deleteCategory as deleteCategoryAction, updateCategory as updateCategoryAction, getBrands } from '@/app/actions/category';

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
        </div>

        <div className="mt-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Categories</h2>
            {currentUser?.role === 'Developer' && selectedCategory !== 'all' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={async () => {
                    const category = productCategories.find(c => c.id === selectedCategory);
                    if (!category) return;
                    const newName = window.prompt("Enter new category name:", category.name);
                    if (newName && newName.trim() !== "" && newName !== category.name) {
                      try {
                        await updateCategoryAction(selectedCategory, newName.trim());
                        setCategories(prev => prev.map(c => c.id === selectedCategory ? { ...c, name: newName.trim() } : c));
                      } catch (err) {
                        alert("Failed to update category. It might be a duplicate.");
                      }
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this category?")) {
                      deleteCategory(selectedCategory);
                      setSelectedCategory('all');
                    }
                  }}
                >
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div 
              className={`p-4 border rounded-xl cursor-pointer flex items-center justify-center text-center transition-all ${selectedCategory === 'all' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white hover:border-blue-300 hover:shadow-sm'}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className={`font-medium ${selectedCategory === 'all' ? 'text-blue-700' : 'text-slate-700'}`}>All Products</span>
            </div>
            {productCategories.map(c => (
              <div 
                key={c.id}
                className={`p-4 border rounded-xl cursor-pointer flex items-center justify-center text-center transition-all ${selectedCategory === c.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white hover:border-blue-300 hover:shadow-sm'}`}
                onClick={() => setSelectedCategory(c.id)}
              >
                <span className={`font-medium ${selectedCategory === c.id ? 'text-blue-700' : 'text-slate-700'} line-clamp-2`}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">
              {selectedCategory === 'all' ? 'All Products' : productCategories.find(c => c.id === selectedCategory)?.name || 'Products'}
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
                          <div>
                            <div className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-1">
                              {product.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {product.id.slice(0, 8)}
                            </div>
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
