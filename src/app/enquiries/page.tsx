'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash, Check, X, Search, Edit } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Enquiry, Product, Vendor } from '@/types';
import { getEnquiries, deleteEnquiry as deleteEnquiryAction } from '@/app/actions/enquiry';
import { getProducts } from '@/app/actions/product';
import { getVendors } from '@/app/actions/vendor';

export default function EnquiriesPage() {
  const { currentUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteEnquiry = async (id: string) => {
    try {
      await deleteEnquiryAction(id);
      setEnquiries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete enquiry:', error);
    }
  };

  const canEdit = currentUser?.role === 'User' || currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  const filteredEnquiries = enquiries.filter(enquiry => {
    const product = products.find(p => p.id === enquiry.productId);
    const vendor = vendors.find(v => v.id === enquiry.vendorId);
    
    const searchString = `${product?.name || ''} ${product?.model || ''} ${vendor?.name || ''} ${enquiry.notes || ''} ${enquiry.serialNumber || ''} ${enquiry.barcode || ''}`.toLowerCase();
    
    return searchString.includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRowClick = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
  };

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Enquiry History</h1>
          {canEdit && (
            <Link href="/enquiries/new">
              <Button><Plus className="mr-2 h-4 w-4" /> New Enquiry</Button>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search enquiries..."
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
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total (w/o GST)</TableHead>
                <TableHead className="text-right">Total (+18% GST)</TableHead>
                <TableHead className="text-center">Purchased?</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8">Loading enquiries...</TableCell>
                </TableRow>
              ) : filteredEnquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8">No enquiries found</TableCell>
                </TableRow>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <TableRow key={enquiry.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleRowClick(enquiry)}>
                    <TableCell>{new Date(enquiry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{products.find(p => p.id === enquiry.productId)?.name || 'Unknown'}</TableCell>
                    <TableCell>{vendors.find(v => v.id === enquiry.vendorId)?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right">{enquiry.quantity}</TableCell>
                    <TableCell className="text-right">₹ {(enquiry.enquiryPrice * enquiry.quantity).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-blue-700">₹ {(enquiry.enquiryPrice * enquiry.quantity * 1.18).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      {enquiry.isPurchased ? (
                        <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><Check className="w-3 h-3 mr-1"/> Yes</span>
                      ) : (
                        <span className="inline-flex items-center text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium"><X className="w-3 h-3 mr-1"/> No</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/enquiries/${enquiry.id}/edit`)}>
                          <Edit className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEnquiry(enquiry.id)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Enquiry Details Modal */}
        <Dialog open={!!selectedEnquiry} onOpenChange={(open) => !open && setSelectedEnquiry(null)}>
          {selectedEnquiry && (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Enquiry Details</DialogTitle>
                <DialogDescription>
                  View full details for this record.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Date</span>
                  <p className="font-medium">{new Date(selectedEnquiry.date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Status</span>
                  <p className="font-medium">{selectedEnquiry.status}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Product</span>
                  <p className="font-medium">{products.find(p => p.id === selectedEnquiry.productId)?.name || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Vendor</span>
                  <p className="font-medium">{vendors.find(v => v.id === selectedEnquiry.vendorId)?.name || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Quantity</span>
                  <p className="font-medium">{selectedEnquiry.quantity}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Grand Total (w/o GST)</span>
                  <p className="font-medium">₹ {(selectedEnquiry.enquiryPrice * selectedEnquiry.quantity).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Grand Total (w/ 18% GST)</span>
                  <p className="font-medium text-blue-700">₹ {(selectedEnquiry.enquiryPrice * selectedEnquiry.quantity * 1.18).toLocaleString()}</p>
                </div>
                
                {selectedEnquiry.isPurchased && (
                  <>
                    <div className="col-span-2 border-t pt-4 mt-2">
                      <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold mb-2">PURCHASED</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500">Purchased Quantity</span>
                      <p className="font-medium text-green-700">{selectedEnquiry.purchaseQuantity || selectedEnquiry.quantity}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500">Total Spent (w/o GST)</span>
                      <p className="font-medium text-green-700">₹ {((selectedEnquiry.purchasePrice || 0) * (selectedEnquiry.purchaseQuantity || selectedEnquiry.quantity)).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500">Total Spent (w/ 18% GST)</span>
                      <p className="font-medium text-green-700">₹ {((selectedEnquiry.purchasePrice || 0) * (selectedEnquiry.purchaseQuantity || selectedEnquiry.quantity) * 1.18).toLocaleString()}</p>
                    </div>
                    {selectedEnquiry.serialNumber && (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500">Serial Number</span>
                        <p className="font-medium font-mono">{selectedEnquiry.serialNumber}</p>
                      </div>
                    )}
                    {selectedEnquiry.barcode && (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500">Barcode</span>
                        <p className="font-medium font-mono">{selectedEnquiry.barcode}</p>
                      </div>
                    )}
                  </>
                )}

                {selectedEnquiry.notes && (
                  <div className="col-span-2 space-y-1 pt-2">
                    <span className="text-xs text-slate-500">Notes</span>
                    <p className="text-sm bg-slate-50 p-3 rounded">{selectedEnquiry.notes}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter className="sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedEnquiry(null)}>
                  Close
                </Button>
                {canEdit && (
                  <Button type="button" onClick={() => router.push(`/enquiries/${selectedEnquiry.id}/edit`)}>
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

