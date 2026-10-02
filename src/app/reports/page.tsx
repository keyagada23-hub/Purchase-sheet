'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfDay, startOfMonth, startOfYear } from 'date-fns';
import { ActivityLog, Enquiry, Product, Vendor } from '@/types';
import { Clock, User, Loader2 } from 'lucide-react';
import { getEnquiries } from '@/app/actions/enquiry';
import { getVendors } from '@/app/actions/vendor';
import { getProducts } from '@/app/actions/product';
import { getActivityLogs } from '@/app/actions/log';

type TimeFrame = 'Day' | 'Month' | 'Year';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Month');
  
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedEnquiries, fetchedVendors, fetchedProducts, fetchedLogs] = await Promise.all([
          getEnquiries(),
          getVendors(),
          getProducts(),
          getActivityLogs(),
        ]);
        setEnquiries(fetchedEnquiries);
        setVendors(fetchedVendors);
        setProducts(fetchedProducts);
        setActivityLogs(fetchedLogs);
      } catch (error) {
        console.error('Failed to load report data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  // Format dates for grouping
  const formatKey = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (timeFrame === 'Day') return format(date, 'MMM dd, yyyy');
      if (timeFrame === 'Month') return format(date, 'MMM yyyy');
      return format(date, 'yyyy');
    } catch {
      return 'Unknown';
    }
  };

  // --- ENQUIRY BRANCH (Purchased vs Not Purchased) ---
  const enquiryData = useMemo(() => {
    const grouped: Record<string, { name: string, Purchased: number, NotPurchased: number }> = {};
    
    enquiries.forEach(eq => {
      const key = formatKey(eq.date);
      if (!grouped[key]) {
        grouped[key] = { name: key, Purchased: 0, NotPurchased: 0 };
      }
      if (eq.isPurchased) {
        grouped[key].Purchased += 1;
      } else {
        grouped[key].NotPurchased += 1;
      }
    });

    return Object.values(grouped);
  }, [enquiries, timeFrame]);

  // --- VENDOR BRANCH (Cost Analysis) ---
  // Calculates total purchased amount per vendor, splits into high/low cost
  const vendorData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    enquiries.forEach(eq => {
      if (eq.isPurchased && eq.purchasePrice) {
        const vendor = vendors.find(v => v.id === eq.vendorId);
        const vName = vendor ? vendor.name : 'Unknown';
        grouped[vName] = (grouped[vName] || 0) + (eq.purchasePrice * (eq.quantity || 1));
      }
    });
    
    // Convert to array and categorize
    const arr = Object.entries(grouped).map(([name, total]) => ({ name, total }));
    // Just a sample metric to differentiate high/low. Let's use average to split.
    const avg = arr.length > 0 ? arr.reduce((acc, v) => acc + v.total, 0) / arr.length : 0;
    
    const highCost = arr.filter(v => v.total >= avg).length;
    const lowCost = arr.filter(v => v.total < avg).length;

    return [
      { name: 'High Cost Vendors', value: highCost },
      { name: 'Low Cost Vendors', value: lowCost }
    ];
  }, [enquiries, vendors]);

  // --- PRODUCTS BRANCH ---
  // Top purchased products
  const productData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    enquiries.forEach(eq => {
      if (eq.isPurchased) {
        const prod = products.find(p => p.id === eq.productId);
        const pName = prod ? prod.name : 'Unknown';
        grouped[pName] = (grouped[pName] || 0) + (eq.quantity || 1);
      }
    });

    return Object.entries(grouped)
      .map(([name, qty]) => ({ name, quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5
  }, [enquiries, products]);


  // --- ACTIVITY LOGS (Day Wise) ---
  const logsByDay = useMemo(() => {
    const grouped: Record<string, ActivityLog[]> = {};
    activityLogs.forEach(log => {
      try {
        const day = format(parseISO(log.timestamp), 'MMM dd, yyyy');
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(log);
      } catch (e) {
        // ignore bad dates
      }
    });
    return grouped;
  }, [activityLogs]);

  if (loading) {
    return (
      <RoleGuard roles={['Admin', 'Developer']}>
        <div className="flex h-full items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={['Admin', 'Developer']}>
      <div className="space-y-6 pb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          
          <div className="w-48">
            <Select value={timeFrame} onValueChange={(val: any) => val && setTimeFrame(val)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="View By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day Wise</SelectItem>
                <SelectItem value="Month">Month Wise</SelectItem>
                <SelectItem value="Year">Year Wise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Enquiries Chart */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Enquiries: Purchased vs Not Purchased</CardTitle>
              <CardDescription>View enquiry conversion over time ({timeFrame} wise)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {enquiryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enquiryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="Purchased" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="NotPurchased" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Not Purchased" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Vendors Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vendors Cost Analysis</CardTitle>
              <CardDescription>High Cost vs Low Cost vendors based on total purchase value</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {vendorData.some(v => v.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {vendorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No purchase data available</div>
              )}
            </CardContent>
          </Card>

          {/* Products Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Purchased Products</CardTitle>
              <CardDescription>Highest volume purchased items</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {productData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="quantity" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No purchase data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Logs Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold tracking-tight mb-4">User Activity History</h2>
          
          {Object.keys(logsByDay).length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center text-slate-500">
              No activity recorded yet.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(logsByDay).map(([day, logs]) => (
                <Card key={day}>
                  <CardHeader className="bg-slate-50 border-b py-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <Clock className="h-4 w-4" /> {day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {logs.map((log) => (
                        <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                          <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-600' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              <span className="font-bold">{log.userName}</span> {log.details}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {log.entity}: {log.entityName}
                            </p>
                          </div>
                          <div className="text-xs text-slate-400 font-mono whitespace-nowrap">
                            {format(parseISO(log.timestamp), 'HH:mm:ss')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
