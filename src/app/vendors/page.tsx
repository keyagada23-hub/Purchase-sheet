'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Vendor } from '@/types';
import { getVendors, deleteVendor } from '@/app/actions/vendor';

export default function VendorsPage() {
  const { currentUser } = useAppStore();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  useEffect(() => {
    getVendors().then(setVendors).catch(console.error);
  }, []);

  const handleDeleteVendor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await deleteVendor(id);
      setVendors(vendors.filter(v => v.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedVendorId(expandedVendorId === id ? null : id);
  };

  const canEdit = currentUser?.role === 'User' || currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6 pb-12">
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
                <TableHead>Location</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-8 text-slate-500">No vendors found</TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <Fragment key={vendor.id}>
                    <TableRow className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(vendor.id)}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className={`transition-transform duration-200 ${expandedVendorId === vendor.id ? 'rotate-180' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                        {vendor.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{vendor.taxId || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">{vendor.phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{vendor.city ? `${vendor.city}, ${vendor.country}` : (vendor.country || '-')}</span>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/vendors/${vendor.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteVendor(vendor.id)}>
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                    {expandedVendorId === vendor.id && (
                      <TableRow className="bg-slate-50/80 border-b">
                        <TableCell colSpan={canEdit ? 5 : 4} className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 fade-in-20 duration-200">
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-500 uppercase">Contact Information</p>
                              <p className="text-sm break-words"><span className="font-medium">Email:</span> {vendor.email || 'N/A'}</p>
                              <p className="text-sm break-words"><span className="font-medium">Phone:</span> {vendor.phone || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-500 uppercase">Location Details</p>
                              <p className="text-sm break-words"><span className="font-medium">Address:</span> {vendor.address || 'N/A'}</p>
                              <p className="text-sm break-words"><span className="font-medium">Region:</span> {[vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-500 uppercase">Business Details</p>
                              <p className="text-sm break-words"><span className="font-medium">GSTNIN/UIN:</span> {vendor.taxId || 'N/A'}</p>
                              <p className="text-sm break-all flex items-center gap-1">
                                <span className="font-medium shrink-0">Website:</span> 
                                {vendor.website ? (
                                  <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                                    {vendor.website}
                                  </a>
                                ) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </RoleGuard>
  );
}
