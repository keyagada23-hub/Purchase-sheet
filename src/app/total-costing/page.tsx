'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Trash2, Edit, Calculator, Package, Layers, IndianRupee, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Enquiry, Product, Vendor, MasterCategory, Brand, SubCostItem } from '@/types';
import { getEnquiries, updateEnquiry, toggleEnquiryTotalCosting } from '@/app/actions/enquiry';
import { getProducts } from '@/app/actions/product';
import { getVendors } from '@/app/actions/vendor';
import { getCategories, getBrands } from '@/app/actions/category';
import { useToast } from '@/hooks/use-toast';

const PRESET_ACCESSORIES = [
  { name: 'Mouse', price: 500 },
  { name: 'Keyboard', price: 800 },
  { name: 'CPU Upgrade', price: 12000 },
  { name: '16GB RAM', price: 3500 },
  { name: 'Monitor', price: 8500 },
  { name: 'Laptop Bag', price: 1200 },
  { name: '1-Yr Warranty', price: 2500 },
];

function TotalCostingContent() {
  const { currentUser } = useAppStore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const paramEnquiryId = searchParams.get('enquiryId');

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'costed' | 'enquiries' | 'purchased' | 'all'>('costed');

  // Edit / Manage sub-costing dialog state
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [subCostItems, setSubCostItems] = useState<SubCostItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-open handler ref to avoid re-triggering
  const autoOpenedRef = useRef<string | null>(null);

  const formatPrice = (price: number) => {
    return Number((price || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedEnquiries, fetchedProducts, fetchedVendors, fetchedCategories, fetchedBrands] = await Promise.all([
        getEnquiries(),
        getProducts(),
        getVendors(),
        getCategories(),
        getBrands(),
      ]);
      setEnquiries(fetchedEnquiries);
      setProducts(fetchedProducts);
      setVendors(fetchedVendors);
      setCategories(fetchedCategories);
      setBrands(fetchedBrands);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load total costing data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open manage sub-costs dialog
  const handleOpenManageSubCosts = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    if (enquiry.subCosts) {
      try {
        setSubCostItems(JSON.parse(enquiry.subCosts));
      } catch {
        setSubCostItems([]);
      }
    } else {
      setSubCostItems([]);
    }
  };

  // If redirected with ?enquiryId=xxx, auto open dialog once enquiries are loaded
  useEffect(() => {
    if (paramEnquiryId && enquiries.length > 0 && autoOpenedRef.current !== paramEnquiryId) {
      const target = enquiries.find((e) => e.id === paramEnquiryId);
      if (target) {
        autoOpenedRef.current = paramEnquiryId;
        handleOpenManageSubCosts(target);
      }
    }
  }, [paramEnquiryId, enquiries]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const costed = enquiries.filter((e) => e.inTotalCosting || e.isPurchased || e.subCosts).length;
    const enquiryOnly = enquiries.filter((e) => !e.isPurchased).length;
    const purchasedOnly = enquiries.filter((e) => e.isPurchased).length;
    return { costed, enquiryOnly, purchasedOnly, total: enquiries.length };
  }, [enquiries]);

  // Base list depending on viewFilter
  const baseRecords = useMemo(() => {
    switch (viewFilter) {
      case 'costed':
        return enquiries.filter((e) => e.inTotalCosting || e.isPurchased || e.subCosts);
      case 'enquiries':
        return enquiries.filter((e) => !e.isPurchased);
      case 'purchased':
        return enquiries.filter((e) => e.isPurchased);
      case 'all':
      default:
        return enquiries;
    }
  }, [enquiries, viewFilter]);

  // Filtered by search and category
  const filteredRecords = useMemo(() => {
    return baseRecords
      .filter((record) => {
        const product = products.find((p) => p.id === record.productId);
        const vendor = vendors.find((v) => v.id === record.vendorId);
        const category = categories.find((c) => c.id === product?.categoryId);
        const brand = brands.find((b) => b.id === product?.brandId);

        const matchesCategory = selectedCategory === 'all' || product?.categoryId === selectedCategory;

        // Also search inside sub-costs items
        let subCostsMatch = false;
        if (record.subCosts) {
          try {
            const parsed: SubCostItem[] = JSON.parse(record.subCosts);
            subCostsMatch = parsed.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
          } catch {}
        }

        const matchesSearch =
          searchTerm === '' ||
          product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          brand?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subCostsMatch;

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [baseRecords, products, vendors, categories, brands, selectedCategory, searchTerm]);

  // Overall Statistics for current base records
  const stats = useMemo(() => {
    let totalBase = 0;
    let totalSubs = 0;

    baseRecords.forEach((record) => {
      const isPurchased = !!record.isPurchased;
      const qty = isPurchased ? (record.purchaseQuantity || record.quantity || 1) : (record.quantity || 1);
      const unitPrice = isPurchased ? (record.purchasePrice || record.enquiryPrice || 0) : (record.enquiryPrice || 0);
      const base = unitPrice * qty;
      totalBase += base;

      if (record.subCosts) {
        try {
          const parsed: SubCostItem[] = JSON.parse(record.subCosts);
          const subSum = parsed.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
          totalSubs += subSum;
        } catch {}
      }
    });

    const grandTotal = totalBase + totalSubs;
    const grandTotalWithGst = grandTotal * 1.18;

    return {
      count: baseRecords.length,
      totalBase,
      totalSubs,
      grandTotal,
      grandTotalWithGst,
    };
  }, [baseRecords]);

  const handleToggleCosting = async (id: string, currentState: boolean) => {
    const newState = !currentState;
    try {
      await toggleEnquiryTotalCosting(id, newState);
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, inTotalCosting: newState } : e)));
      toast({
        title: newState ? 'Added to Total Costing' : 'Removed from Total Costing',
        description: newState ? 'Item is now included in Total Costing.' : 'Item removed from Total Costing.',
      });
    } catch (err) {
      console.error('Failed to toggle costing:', err);
      toast({
        title: 'Error',
        description: 'Failed to update total costing status.',
        variant: 'destructive',
      });
    }
  };

  const handleAddSubCostRow = () => {
    setSubCostItems([...subCostItems, { name: '', price: 0 }]);
  };

  const handleAddPresetSubCost = (preset: { name: string; price: number }) => {
    setSubCostItems([...subCostItems, { name: preset.name, price: preset.price }]);
  };

  const handleUpdateSubCostRow = (index: number, field: 'name' | 'price', value: string | number) => {
    const updated = [...subCostItems];
    updated[index] = { ...updated[index], [field]: value };
    setSubCostItems(updated);
  };

  const handleRemoveSubCostRow = (index: number) => {
    setSubCostItems(subCostItems.filter((_, i) => i !== index));
  };

  const handleSaveSubCosts = async () => {
    if (!editingEnquiry) return;
    setIsSaving(true);
    try {
      const validItems = subCostItems.filter((item) => item.name.trim() !== '');
      const subCostsString = validItems.length > 0 ? JSON.stringify(validItems) : null;

      await updateEnquiry(editingEnquiry.id, {
        subCosts: subCostsString,
        inTotalCosting: true,
      });

      // Update local state
      setEnquiries((prev) =>
        prev.map((e) => (e.id === editingEnquiry.id ? { ...e, subCosts: subCostsString, inTotalCosting: true } : e))
      );

      toast({
        title: 'Success',
        description: 'Total costing & sub-costs saved successfully.',
      });
      setEditingEnquiry(null);
    } catch (error) {
      console.error('Failed to save sub-costs:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sub-costs.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = currentUser?.role === 'User' || currentUser?.role === 'Admin' || currentUser?.role === 'Developer';

  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-indigo-600" />
              Total Costing
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View complete costing for enquiry and purchased products, with accessory & sub-component breakdowns (e.g. mouse, CPU, RAM).
            </p>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Products in View
              </CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.count}</div>
              <p className="text-xs text-slate-500 mt-1">
                {viewFilter === 'costed'
                  ? 'Costed enquiries & purchases'
                  : viewFilter === 'enquiries'
                  ? 'Enquiry products'
                  : viewFilter === 'purchased'
                  ? 'Purchased products'
                  : 'All total records'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Base Products Cost
              </CardTitle>
              <Layers className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₹ {formatPrice(stats.totalBase)}</div>
              <p className="text-xs text-slate-500 mt-1">Total main unit costs (w/o GST)</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Sub-Costing Accessories
              </CardTitle>
              <Plus className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">₹ {formatPrice(stats.totalSubs)}</div>
              <p className="text-xs text-slate-500 mt-1">Mouse, CPU, RAM & added parts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Grand Total Costing
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-900">₹ {formatPrice(stats.grandTotal)}</div>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                ₹ {formatPrice(stats.grandTotalWithGst)} (with 18% GST)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Filter Tabs & Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-2.5 rounded-xl border">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewFilter('costed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewFilter === 'costed'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border'
              }`}
            >
              Costed Items ({tabCounts.costed})
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('enquiries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewFilter === 'enquiries'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border'
              }`}
            >
              Enquiry Products ({tabCounts.enquiryOnly})
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('purchased')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewFilter === 'purchased'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border'
              }`}
            >
              Purchased ({tabCounts.purchasedOnly})
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border'
              }`}
            >
              All Records ({tabCounts.total})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search products, mouse, cpu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 py-1 text-xs bg-white border rounded-md shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Costing Table */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-16 text-center font-semibold text-slate-700">Costing</TableHead>
                <TableHead className="font-semibold text-slate-700">Product & Details</TableHead>
                <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Qty</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Base Cost (w/o GST)</TableHead>
                <TableHead className="font-semibold text-slate-700">Sub-Costing Accessories</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Total Costing (w/o GST)</TableHead>
                <TableHead className="text-right font-semibold text-emerald-700">Total Costing (+18% GST)</TableHead>
                {canEdit && <TableHead className="text-center font-semibold text-slate-700">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-10 text-slate-500">
                    Loading total costing records...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Calculator className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-700">No records found for current filter</p>
                      <p className="text-xs text-slate-400">
                        Check the &ldquo;Enquiry Products&rdquo; tab or mark products with the Total Costing checkbox in Enquiries.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const product = products.find((p) => p.id === record.productId);
                  const vendor = vendors.find((v) => v.id === record.vendorId);
                  const category = categories.find((c) => c.id === product?.categoryId);
                  const brand = brands.find((b) => b.id === product?.brandId);
                  const isPurchased = !!record.isPurchased;
                  const qty = isPurchased ? (record.purchaseQuantity || record.quantity || 1) : (record.quantity || 1);
                  const unitPrice = isPurchased ? (record.purchasePrice || record.enquiryPrice || 0) : (record.enquiryPrice || 0);
                  const baseCost = unitPrice * qty;

                  const parsedSubCosts: SubCostItem[] = (() => {
                    if (!record.subCosts) return [];
                    try {
                      return JSON.parse(record.subCosts);
                    } catch {
                      return [];
                    }
                  })();

                  const subCostTotal = parsedSubCosts.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                  const totalCosting = baseCost + subCostTotal;
                  const totalCostingWithGst = totalCosting * 1.18;
                  const isHighlighted = paramEnquiryId === record.id;

                  return (
                    <TableRow
                      key={record.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isHighlighted ? 'bg-indigo-50/40 ring-2 ring-indigo-400' : ''
                      }`}
                    >
                      {/* Costing Checkbox */}
                      <TableCell className="align-top py-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!record.inTotalCosting}
                          onChange={() => handleToggleCosting(record.id, !!record.inTotalCosting)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          title={record.inTotalCosting ? 'Included in Total Costing (click to uncheck)' : 'Click to include in Total Costing'}
                        />
                      </TableCell>

                      {/* Product & Model & Status Badge */}
                      <TableCell className="align-top py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{product?.name || 'Unknown'}</p>
                            {isPurchased ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Purchased
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Enquiry
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {brand?.name && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">{brand.name}</span>}
                            {product?.model && <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{product.model}</span>}
                            {category?.name && <span className="text-indigo-600 font-medium">{category.name}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell className="align-top py-4 text-sm text-slate-700">
                        {vendor?.name || '-'}
                      </TableCell>

                      {/* Qty */}
                      <TableCell className="align-top py-4 text-right font-medium text-slate-700">
                        {qty}
                      </TableCell>

                      {/* Base Unit & Total Cost */}
                      <TableCell className="align-top py-4 text-right">
                        <p className="font-semibold text-slate-900">₹ {formatPrice(baseCost)}</p>
                        <p className="text-[11px] text-slate-400">@{formatPrice(unitPrice)}/unit</p>
                      </TableCell>

                      {/* Sub-costing Components Pills */}
                      <TableCell className="align-top py-4">
                        {parsedSubCosts.length > 0 ? (
                          <div className="space-y-1.5 max-w-xs">
                            <div className="flex flex-wrap gap-1.5">
                              {parsedSubCosts.map((sub, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium"
                                >
                                  {sub.name}: <strong className="ml-1 font-bold">₹{formatPrice(sub.price)}</strong>
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Sub-total: <strong className="text-emerald-700">+₹{formatPrice(subCostTotal)}</strong>
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No accessories added</span>
                        )}
                      </TableCell>

                      {/* Grand Total Costing (w/o GST) */}
                      <TableCell className="align-top py-4 text-right">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹ {formatPrice(totalCosting)}
                        </span>
                      </TableCell>

                      {/* Grand Total Costing (+18% GST) */}
                      <TableCell className="align-top py-4 text-right">
                        <span className="text-base font-extrabold text-emerald-700">
                          ₹ {formatPrice(totalCostingWithGst)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      {canEdit && (
                        <TableCell className="align-top py-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenManageSubCosts(record)}
                            className="h-8 text-xs font-medium text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Manage Sub-Costs
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Manage Sub-Costing Dialog */}
        <Dialog open={!!editingEnquiry} onOpenChange={(open) => !open && setEditingEnquiry(null)}>
          {editingEnquiry && (() => {
            const product = products.find((p) => p.id === editingEnquiry.productId);
            const isPurchased = !!editingEnquiry.isPurchased;
            const qty = isPurchased ? (editingEnquiry.purchaseQuantity || editingEnquiry.quantity || 1) : (editingEnquiry.quantity || 1);
            const unitPrice = isPurchased ? (editingEnquiry.purchasePrice || editingEnquiry.enquiryPrice || 0) : (editingEnquiry.enquiryPrice || 0);
            const baseSpent = unitPrice * qty;
            const currentSubSum = subCostItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
            const currentTotal = baseSpent + currentSubSum;

            return (
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5 text-indigo-600" />
                    Manage Sub-Costing & Accessories
                  </DialogTitle>
                  <DialogDescription>
                    Add accessories or sub-components (e.g. mouse, CPU, RAM) for <strong>{product?.name}</strong>.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Base Product Info */}
                  <div className="bg-slate-50 p-3 rounded-lg border text-sm flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{product?.name}</p>
                        {isPurchased ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Purchased
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Enquiry
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Base Product: {qty} × ₹{formatPrice(unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Base Cost</span>
                      <span className="font-bold text-slate-800">₹ {formatPrice(baseSpent)}</span>
                    </div>
                  </div>

                  {/* Quick-add chips */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Quick-Add Common Accessories:</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_ACCESSORIES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddPresetSubCost(preset)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md border border-slate-200 font-medium transition-colors"
                        >
                          + {preset.name} (₹{preset.price})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sub-costs input list */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Sub-Cost Items / Components
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSubCostRow}
                        className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Item
                      </Button>
                    </div>

                    {subCostItems.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded text-center border border-dashed">
                        No sub-cost components added yet. Use the Quick-Add buttons above or click &ldquo;Add Custom Item&rdquo;.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {subCostItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder="Component (e.g. Mouse, CPU, Bag...)"
                              value={item.name}
                              onChange={(e) => handleUpdateSubCostRow(idx, 'name', e.target.value)}
                              className="flex-1 h-9 text-sm"
                            />
                            <div className="w-32 relative">
                              <span className="absolute left-2.5 top-2 text-xs text-slate-500">₹</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.price || ''}
                                onChange={(e) => handleUpdateSubCostRow(idx, 'price', parseFloat(e.target.value) || 0)}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) handleUpdateSubCostRow(idx, 'price', Number(val.toFixed(2)));
                                }}
                                className="pl-6 h-9 text-sm"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSubCostRow(idx)}
                              className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real-time Total Costing Summary Card */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Total Costing Summary
                    </span>
                    <div className="mt-2 flex justify-between items-center text-sm">
                      <div>
                        <p className="text-xs text-slate-600">Base Cost: ₹ {formatPrice(baseSpent)}</p>
                        <p className="text-xs text-slate-600">
                          Accessories: <span className="font-semibold text-emerald-700">+ ₹ {formatPrice(currentSubSum)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-slate-900">
                          ₹ {formatPrice(currentTotal)} <span className="text-xs font-normal text-slate-500">(w/o GST)</span>
                        </p>
                        <p className="text-sm font-bold text-emerald-700">
                          ₹ {formatPrice(currentTotal * 1.18)} <span className="text-xs font-normal text-emerald-600">(+18% GST)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingEnquiry(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveSubCosts}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSaving ? 'Saving...' : 'Save Total Costing'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            );
          })()}
        </Dialog>
      </div>
    </RoleGuard>
  );
}

export default function TotalCostingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Total Costing...</div>}>
      <TotalCostingContent />
    </Suspense>
  );
}
