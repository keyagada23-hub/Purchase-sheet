'use client';
import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, FileText, ShoppingCart, Clock, Calendar as CalendarIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProducts } from '@/app/actions/product';
import { getVendors } from '@/app/actions/vendor';
import { getEnquiries } from '@/app/actions/enquiry';
import { Product, Vendor, Enquiry } from '@/types';

export default function DashboardPage() {
  const { currentUser } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, v, e] = await Promise.all([
          getProducts(),
          getVendors(),
          getEnquiries()
        ]);
        setProducts(p);
        setVendors(v);
        setEnquiries(e);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    }
    loadData();
  }, []);

  const isAdminOrDev = currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  // Base datasets depending on role
  const roleEnquiries = currentUser?.role === 'User' ? enquiries.filter(e => e.userId === currentUser.id) : enquiries;
  
  // Filter by selected date if one is selected
  const filteredEnquiries = selectedDate 
    ? roleEnquiries.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getDate() === selectedDate.getDate() &&
               eDate.getMonth() === selectedDate.getMonth() &&
               eDate.getFullYear() === selectedDate.getFullYear();
      })
    : roleEnquiries;

  const totalProducts = products.length;
  const totalVendors = vendors.length;
  const totalEnquiries = filteredEnquiries.length;
  const totalPurchases = filteredEnquiries.filter(e => e.isPurchased).length;
  const pendingPurchases = totalEnquiries - totalPurchases;

  const recentEnquiries = [...filteredEnquiries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Overview</h1>
            <p className="text-sm text-slate-500">Track your daily procurement activities.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-medium rounded-xl border-slate-200",
                      !selectedDate && "text-muted-foreground"
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date...</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl"
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(undefined)} className="rounded-xl text-slate-400 hover:text-red-500" title="Clear Date Filter">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package className="w-24 h-24 text-blue-600 transform translate-x-4 -translate-y-4" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Products</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black text-slate-800">{totalProducts}</h2>
              </div>
            </CardContent>
          </Card>
          
          {isAdminOrDev && (
            <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24 text-emerald-600 transform translate-x-4 -translate-y-4" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Vendors</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-black text-slate-800">{totalVendors}</h2>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-24 h-24 text-amber-600 transform translate-x-4 -translate-y-4" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">{isAdminOrDev ? 'Enquiries' : 'My Enquiries'}{selectedDate ? ` on ${format(selectedDate, 'MMM d')}` : ''}</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black text-slate-800">{totalEnquiries}</h2>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShoppingCart className="w-24 h-24 text-indigo-600 transform translate-x-4 -translate-y-4" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-slate-500 mb-1">{isAdminOrDev ? 'Purchases' : 'My Purchases'}{selectedDate ? ` on ${format(selectedDate, 'MMM d')}` : ''}</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black text-slate-800">{totalPurchases}</h2>
              </div>
              <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded-full border border-amber-100">
                {pendingPurchases} pending decision
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2 border-none shadow-md bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">
                Activity {selectedDate ? `on ${format(selectedDate, 'MMMM d, yyyy')}` : 'Log'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentEnquiries.length === 0 ? (
                  <div className="text-center text-slate-500 py-16 flex flex-col items-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                      <CalendarIcon className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-600">No activity {selectedDate ? 'on this date' : 'found'}</p>
                  </div>
                ) : (
                  recentEnquiries.map(enquiry => {
                    const product = products.find(p => p.id === enquiry.productId);
                    const vendor = vendors.find(v => v.id === enquiry.vendorId);
                    return (
                      <div key={enquiry.id} className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${enquiry.isPurchased ? 'bg-indigo-500' : 'bg-amber-500'}`}>
                          {enquiry.isPurchased ? <ShoppingCart size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-bold text-slate-800">
                            {enquiry.isPurchased ? 'Purchased' : 'Enquired'} {product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            Vendor: {vendor?.name || 'Unknown Vendor'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700">
                            {enquiry.isPurchased ? `₹ ${(enquiry.purchasePrice! * enquiry.quantity).toLocaleString()}` : `₹ ${(enquiry.enquiryPrice * enquiry.quantity).toLocaleString()}`}
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {new Date(enquiry.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 border-none shadow-md bg-white rounded-2xl h-fit">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid gap-3">
              <Link href="/enquiries/new" className="flex items-center p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all group">
                <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors mr-4">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">New Enquiry</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Create a new record</p>
                </div>
              </Link>
              
              <Link href="/products" className="flex items-center p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm transition-all group">
                <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors mr-4">
                  <Clock className="h-5 w-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Find Product</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Scan or search inventory</p>
                </div>
              </Link>

              <Link href="/vendors/new" className="flex items-center p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm transition-all group">
                <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition-colors mr-4">
                  <Users className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Add Vendor</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Register new supplier</p>
                </div>
              </Link>

              {isAdminOrDev && (
                <>
                  <Link href="/products/new" className="flex items-center p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm transition-all group">
                    <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200 transition-colors mr-4">
                      <Package className="h-5 w-5 text-orange-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Add Product</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Register new product</p>
                    </div>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
