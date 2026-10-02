'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Vendor } from '@/types';
import { getVendors, deleteVendor } from '@/app/actions/vendor';

export default function VendorsPage() {
  const { currentUser } = useAppStore();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    getVendors().then(setVendors).catch(console.error);
  }, []);

  const handleDeleteVendor = async (id: string) => {
    try {
      await deleteVendor(id);
      setVendors(vendors.filter(v => v.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const canEdit = currentUser?.role === 'User' || currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Vendors Master</h1>
          {canEdit && (
            <Link href="/vendors/new">
              <Button><Plus className="mr-2 h-4 w-4" /> Add Vendor</Button>
            </Link>
          )}
        </div>

        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>GSTNIN / UIN</TableHead>
                <TableHead>Phone / Email</TableHead>
                <TableHead>Address</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8">No vendors found</TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">
                      <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => setSelectedVendor(vendor)}>
                        {vendor.name}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{vendor.taxId || '-'}</TableCell>
                    <TableCell>
                      <div>{vendor.phone || '-'}</div>
                      <div className="text-xs text-slate-500">{vendor.email || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{vendor.address} {vendor.city} {vendor.state} {vendor.country}</span>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/vendors/${vendor.id}/edit`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteVendor(vendor.id)}>
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

      <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="col-span-2 font-semibold">{selectedVendor.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">GSTNIN/UIN</span>
                <span className="col-span-2 font-mono">{selectedVendor.taxId || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">Phone</span>
                <span className="col-span-2">{selectedVendor.phone || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="col-span-2">{selectedVendor.email || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b pb-2">
                <span className="text-slate-500 font-medium">Address</span>
                <span className="col-span-2">{selectedVendor.address} {selectedVendor.city} {selectedVendor.state} {selectedVendor.country}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pb-2">
                <span className="text-slate-500 font-medium">Website</span>
                <span className="col-span-2 text-blue-600 hover:underline">
                  {selectedVendor.website ? (
                    <a href={selectedVendor.website.startsWith('http') ? selectedVendor.website : `https://${selectedVendor.website}`} target="_blank" rel="noreferrer">{selectedVendor.website}</a>
                  ) : '-'}
                </span>
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
