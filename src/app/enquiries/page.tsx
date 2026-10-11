'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash, Check, X, Search, Edit, Calculator } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Enquiry, Product, Vendor } from '@/types';
import { getEnquiries, deleteEnquiry as deleteEnquiryAction, toggleEnquiryTotalCosting } from '@/app/actions/enquiry';
import { getProducts } from '@/app/actions/product';
import { getVendors } from '@/app/actions/vendor';

const formatPrice = (price: number) => {
  return Number((price || 0).toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

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
                <TableHead className="text-center">Total Costing</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8">Loading enquiries...</TableCell>
                </TableRow>
              ) : filteredEnquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8">No enquiries found</TableCell>
                </TableRow>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <TableRow key={enquiry.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleRowClick(enquiry)}>
                    <TableCell>{new Date(enquiry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{products.find(p => p.id === enquiry.productId)?.name || 'Unknown'}</TableCell>
                    <TableCell>{vendors.find(v => v.id === enquiry.vendorId)?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right">{enquiry.quantity}</TableCell>
                    <TableCell className="text-right">₹ {formatPrice(enquiry.enquiryPrice * enquiry.quantity)}</TableCell>
                    <TableCell className="text-right font-medium text-blue-700">₹ {formatPrice(enquiry.enquiryPrice * enquiry.quantity * 1.18)}</TableCell>
                    <TableCell className="text-center">
                      {enquiry.isPurchased ? (
                        <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><Check className="w-3 h-3 mr-1"/> Yes</span>
                      ) : (
                        <span className="inline-flex items-center text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium"><X className="w-3 h-3 mr-1"/> No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={!!enquiry.inTotalCosting}
                          onChange={async (e) => {
                            const isChecked = e.target.checked;
                            try {
                              await toggleEnquiryTotalCosting(enquiry.id, isChecked);
                              setEnquiries((prev) =>
                                prev.map((item) => (item.id === enquiry.id ? { ...item, inTotalCosting: isChecked } : item))
                              );
                              if (isChecked) {
                                router.push(`/total-costing?enquiryId=${enquiry.id}`);
                              }
                            } catch (err) {
                              console.error('Failed to toggle total costing:', err);
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          title={enquiry.inTotalCosting ? 'Included in Total Costing (click to remove)' : 'Click to add to Total Costing & redirect'}
                        />
                        {enquiry.inTotalCosting && (
                          <button
                            type="button"
                            onClick={() => router.push(`/total-costing?enquiryId=${enquiry.id}`)}
                            title="Open in Total Costing"
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center ml-1"
                          >
                            View →
                          </button>
                        )}
                      </div>
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
                  <p className="font-medium">₹ {formatPrice(selectedEnquiry.enquiryPrice * selectedEnquiry.quantity)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Grand Total (w/ 18% GST)</span>
                  <p className="font-medium text-blue-700">₹ {formatPrice(selectedEnquiry.enquiryPrice * selectedEnquiry.quantity * 1.18)}</p>
                </div>
                
                {/* Total Costing & Sub-Costs Breakdown Section */}
                {(() => {
                  const parsedSubCosts: { name: string; price: number }[] = (() => {
                    if (!selectedEnquiry.subCosts) return [];
                    try {
                      return JSON.parse(selectedEnquiry.subCosts);
                    } catch {
                      return [];
                    }
                  })();
                  const totalSub = parsedSubCosts.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                  const baseSpent = selectedEnquiry.isPurchased
                    ? (selectedEnquiry.purchasePrice || 0) * (selectedEnquiry.purchaseQuantity || selectedEnquiry.quantity)
                    : (selectedEnquiry.enquiryPrice || 0) * selectedEnquiry.quantity;
                  const totalCosting = baseSpent + totalSub;

                  return (
                    <>
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
                            <span className="text-xs text-slate-500">Base Product Cost (w/o GST)</span>
                            <p className="font-medium text-slate-800">₹ {formatPrice(baseSpent)}</p>
                          </div>
                        </>
                      )}

                      {parsedSubCosts.length > 0 && (
                        <div className="col-span-2 space-y-2 bg-slate-50 p-3 rounded-lg border mt-2">
                          <span className="text-xs font-semibold text-slate-700">Sub-Costing Breakdown (Accessories/Parts):</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {parsedSubCosts.map((sub, i) => (
                              <div key={i} className="flex justify-between bg-white px-2 py-1.5 rounded border">
                                <span className="text-slate-600">{sub.name}</span>
                                <span className="font-semibold text-slate-900">₹ {formatPrice(sub.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="col-span-2 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Costing</span>
                            {selectedEnquiry.inTotalCosting && (
                              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">IN TOTAL COSTING</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Base: ₹ {formatPrice(baseSpent)} {totalSub > 0 && `+ Sub-Costs: ₹ ${formatPrice(totalSub)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-slate-900">₹ {formatPrice(totalCosting)} <span className="text-xs font-normal text-slate-500">(w/o GST)</span></p>
                            <p className="text-sm font-bold text-emerald-700">₹ {formatPrice(totalCosting * 1.18)} <span className="text-xs font-normal text-emerald-600">(w/ 18% GST)</span></p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                            onClick={async () => {
                              if (!selectedEnquiry.inTotalCosting) {
                                await toggleEnquiryTotalCosting(selectedEnquiry.id, true);
                              }
                              router.push(`/total-costing?enquiryId=${selectedEnquiry.id}`);
                            }}
                          >
                            <Calculator className="h-3.5 w-3.5 mr-1" /> Open Costing →
                          </Button>
                        </div>
                      </div>

                      {selectedEnquiry.serialNumber && (
                        <div className="space-y-1 mt-2">
                          <span className="text-xs text-slate-500">Serial Number</span>
                          <p className="font-medium font-mono">{selectedEnquiry.serialNumber}</p>
                        </div>
                      )}
                      {selectedEnquiry.barcode && (
                        <div className="space-y-1 mt-2">
                          <span className="text-xs text-slate-500">Barcode</span>
                          <p className="font-medium font-mono">{selectedEnquiry.barcode}</p>
                        </div>
                      )}
                    </>
                  );
                })()}

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

