'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function EnquiriesPage() {
  const { enquiries, products, vendors, deleteEnquiry, currentUser } = useAppStore();

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Enquiry History</h1>
          <Link href="/enquiries/new">
            <Button><Plus className="mr-2 h-4 w-4" /> New Enquiry</Button>
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
                <TableHead className="text-right">Enquiry Price</TableHead>
                <TableHead className="text-center">Purchased?</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8">No enquiries found</TableCell>
                </TableRow>
              ) : (
                enquiries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell>{new Date(enquiry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{products.find(p => p.id === enquiry.productId)?.name || 'Unknown'}</TableCell>
                    <TableCell>{vendors.find(v => v.id === enquiry.vendorId)?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right">{enquiry.quantity}</TableCell>
                    <TableCell className="text-right">₹ {enquiry.enquiryPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      {enquiry.isPurchased ? (
                        <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><Check className="w-3 h-3 mr-1"/> Yes</span>
                      ) : (
                        <span className="inline-flex items-center text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium"><X className="w-3 h-3 mr-1"/> No</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => deleteEnquiry(enquiry.id)}>
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
      </div>
    </RoleGuard>
  );
}
