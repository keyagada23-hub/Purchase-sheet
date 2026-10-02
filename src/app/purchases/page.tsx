'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ArrowDown, ArrowUp, Search, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Enquiry, Product, Vendor } from '@/types';
import { getEnquiries } from '@/app/actions/enquiry';
import { getProducts } from '@/app/actions/product';
import { getVendors } from '@/app/actions/vendor';

export default function PurchasesPage() {
  const { currentUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<Enquiry | null>(null);
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedEnquiries, fetchedProducts, fetchedVendors] = await Promise.all([
          getEnquiries(),
          getProducts(),
          getVendors(),
        ]);
        setEnquiries(fetchedEnquiries);
        setProducts(fetchedProducts);
        setVendors(fetchedVendors);
      } catch (error) {
        console.error('Failed to load purchases data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const canEdit = currentUser?.role === 'User' || currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  const purchases = enquiries.filter(e => {
    if (!e.isPurchased) return false;
    
    const product = products.find(p => p.id === e.productId);
    const vendor = vendors.find(v => v.id === e.vendorId);
    
    const searchString = `${product?.name || ''} ${product?.model || ''} ${vendor?.name || ''} ${e.serialNumber || ''} ${e.barcode || ''}`.toLowerCase();
    
    return searchString.includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <RoleGuard roles={['User', 'Admin', 'Developer']}>
        <div className="flex h-full items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Purchase History</h1>
          {canEdit && (
            <Link href="/enquiries/new">
              <Button><Plus className="mr-2 h-4 w-4" /> New Purchase</Button>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search purchases by name, vendor, serial, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Serial / Barcode</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total (w/o GST)</TableHead>
                <TableHead className="text-right text-blue-700">Total (+18% GST)</TableHead>
                <TableHead className="text-center">vs Enquiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">No purchases found</TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => {
                  const product = products.find(p => p.id === purchase.productId);
                  const vendor = vendors.find(v => v.id === purchase.vendorId);
                  const purchaseQty = purchase.purchaseQuantity || purchase.quantity;
                  const totalAmount = (purchase.purchasePrice || 0) * purchaseQty;
                  const estimatedTotal = purchase.enquiryPrice * purchase.quantity;
                  const priceDiff = totalAmount - estimatedTotal;
                  
                  return (
                    <TableRow key={purchase.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedPurchase(purchase)}>
                      <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{product?.name || 'Unknown'}</TableCell>
                      <TableCell>{vendor?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {purchase.serialNumber && <span className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded border">SN: {purchase.serialNumber}</span>}
                          {purchase.barcode && <span className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded border">BC: {purchase.barcode}</span>}
                          {!purchase.serialNumber && !purchase.barcode && <span className="text-xs text-slate-400">N/A</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{purchaseQty}</TableCell>
                      <TableCell className="text-right">₹ {totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-blue-700">₹ {(totalAmount * 1.18).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {priceDiff > 0 ? (
                          <span className="inline-flex items-center text-xs text-red-600"><ArrowUp className="w-3 h-3 mr-1"/> ₹{priceDiff.toLocaleString()}</span>
                        ) : priceDiff < 0 ? (
                          <span className="inline-flex items-center text-xs text-green-600"><ArrowDown className="w-3 h-3 mr-1"/> ₹{Math.abs(priceDiff).toLocaleString()}</span>
                        ) : (
                          <span className="text-xs text-slate-400">Same</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
          {selectedPurchase && (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Purchase Details</DialogTitle>
                <DialogDescription>
                  View full details for this record.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Date</span>
                  <p className="font-medium">{new Date(selectedPurchase.date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Status</span>
                  <p className="font-medium">{selectedPurchase.status}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Product</span>
                  <p className="font-medium">{products.find(p => p.id === selectedPurchase.productId)?.name || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Vendor</span>
                  <p className="font-medium">{vendors.find(v => v.id === selectedPurchase.vendorId)?.name || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Enquiry Quantity</span>
                  <p className="font-medium">{selectedPurchase.quantity}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Estimated Total (w/o GST)</span>
                  <p className="font-medium">₹ {(selectedPurchase.enquiryPrice * selectedPurchase.quantity).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Estimated Total (w/ 18% GST)</span>
                  <p className="font-medium text-blue-700">₹ {(selectedPurchase.enquiryPrice * selectedPurchase.quantity * 1.18).toLocaleString()}</p>
                </div>
                
                <div className="col-span-2 border-t pt-4 mt-2">
                  <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold mb-2">PURCHASED</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Purchased Quantity</span>
                  <p className="font-medium text-green-700">{selectedPurchase.purchaseQuantity || selectedPurchase.quantity}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Total Spent (w/o GST)</span>
                  <p className="font-medium text-green-700">₹ {((selectedPurchase.purchasePrice || 0) * (selectedPurchase.purchaseQuantity || selectedPurchase.quantity)).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Total Spent (w/ 18% GST)</span>
                  <p className="font-medium text-green-700">₹ {((selectedPurchase.purchasePrice || 0) * (selectedPurchase.purchaseQuantity || selectedPurchase.quantity) * 1.18).toLocaleString()}</p>
                </div>
                
                {selectedPurchase.serialNumber && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Serial Number</span>
                    <p className="font-medium font-mono">{selectedPurchase.serialNumber}</p>
                  </div>
                )}
                {selectedPurchase.barcode && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Barcode</span>
                    <p className="font-medium font-mono">{selectedPurchase.barcode}</p>
                  </div>
                )}

                {selectedPurchase.notes && (
                  <div className="col-span-2 space-y-1 pt-2">
                    <span className="text-xs text-slate-500">Notes</span>
                    <p className="text-sm bg-slate-50 p-3 rounded">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter className="sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedPurchase(null)}>
                  Close
                </Button>
                {canEdit && (
                  <Button type="button" onClick={() => router.push(`/enquiries/${selectedPurchase.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Record
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </RoleGuard>
  );
}
