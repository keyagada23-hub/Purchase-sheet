'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import Link from 'next/link';

export default function VendorsPage() {
  const { vendors, categories, deleteVendor, currentUser } = useAppStore();

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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
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
                    <TableCell className="font-medium">{vendor.code}</TableCell>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{categories.find(c => c.id === vendor.categoryId)?.name || '-'}</TableCell>
                    <TableCell>
                      <div>{vendor.contactPerson}</div>
                      <div className="text-xs text-slate-500">{vendor.phone}</div>
                    </TableCell>
                    <TableCell>{vendor.city}, {vendor.country}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteVendor(vendor.id)}>
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
