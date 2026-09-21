'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash, Search, Barcode, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const { products, brands, categories, deleteProduct, currentUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    // Check for exact barcode match
    const exactMatch = products.find(p => p.barcode === searchTerm.trim());
    if (exactMatch) {
      router.push(`/enquiries/new?productId=${exactMatch.id}`);
    }
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

        {/* Unified Search and Barcode Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex max-w-xl bg-white shadow-sm rounded-lg overflow-hidden border">
          <div className="bg-slate-100 p-3 text-slate-500 border-r flex items-center justify-center">
            <Barcode className="h-5 w-5" />
          </div>
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, or scan barcode... (Press Enter to start enquiry)"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-12"
          />
          <Button type="submit" variant="ghost" className="rounded-none h-12 px-6 bg-slate-50 hover:bg-slate-100 border-l">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 bg-white border rounded-xl">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                <div className="h-48 bg-slate-50 flex items-center justify-center border-b relative">
                  {product.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.photoUrl} alt={product.name} className="w-full h-full object-contain p-2 bg-white" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  {canEdit && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 shadow-sm"><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={() => deleteProduct(product.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-xs font-semibold text-blue-600 mb-1">{categories.find(c => c.id === product.categoryId)?.name || 'Uncategorized'}</div>
                  <h3 className="font-bold text-slate-900 line-clamp-1" title={product.name}>{product.name}</h3>
                  <div className="text-sm text-slate-500 mt-1 flex justify-between">
                    <span>{brands.find(b => b.id === product.brandId)?.name || 'No Brand'}</span>
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">{product.code}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Barcode className="h-3 w-3" /> {product.barcode || 'N/A'}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => router.push(`/enquiries/new?productId=${product.id}`)}>
                      Enquire
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
