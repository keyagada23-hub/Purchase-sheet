'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';

export default function PurchasesPage() {
  const { enquiries, products, vendors } = useAppStore();

  const purchases = enquiries.filter(e => e.isPurchased).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Purchase History</h1>
          <Link href="/enquiries/new">
            <Button><Plus className="mr-2 h-4 w-4" /> New Purchase</Button>
          </Link>
        </div>

        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-center">vs Enquiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">No purchases found</TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => {
                  const product = products.find(p => p.id === purchase.productId);
                  const vendor = vendors.find(v => v.id === purchase.vendorId);
                  const priceDiff = (purchase.purchasePrice || 0) - purchase.enquiryPrice;
                  const totalAmount = (purchase.purchasePrice || 0) * purchase.quantity;
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{product?.name || 'Unknown'}</TableCell>
                      <TableCell>{vendor?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-right">{purchase.quantity}</TableCell>
                      <TableCell className="text-right">₹ {(purchase.purchasePrice || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">₹ {totalAmount.toLocaleString()}</TableCell>
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
      </div>
    </RoleGuard>
  );
}
