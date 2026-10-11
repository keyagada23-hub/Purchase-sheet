'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Trash2, Edit, Calculator, Package, Layers, IndianRupee } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Enquiry, Product, Vendor, MasterCategory, Brand, SubCostItem } from '@/types';
import { getEnquiries, updateEnquiry, toggleEnquiryTotalCosting } from '@/app/actions/enquiry';
import { getProducts } from '@/app/actions/product';
import { getVendors } from '@/app/actions/vendor';
import { getCategories, getBrands } from '@/app/actions/category';
import { useToast } from '@/hooks/use-toast';

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
  const [showAllEnquiries, setShowAllEnquiries] = useState<boolean>(false);

  // Edit / Add cost dialog state
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [costItems, setCostItems] = useState<SubCostItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-open handler ref
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
        description: 'Failed to load enquiry costing data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ALL products in enquiry (purchased or not) can be added to total costing
  const allEnquiryRecords = enquiries;

  // Open dialog to add/edit cost of any enquiry product
  const handleOpenAddCost = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    if (enquiry.subCosts) {
      try {
        setCostItems(JSON.parse(enquiry.subCosts));
      } catch {
        setCostItems([]);
      }
    } else {
      setCostItems([]);
    }
  };

  // Auto-open dialog if redirected with ?enquiryId=xxx
  useEffect(() => {
    if (paramEnquiryId && allEnquiryRecords.length > 0 && autoOpenedRef.current !== paramEnquiryId) {
      const target = allEnquiryRecords.find((e) => e.id === paramEnquiryId);
      if (target) {
        autoOpenedRef.current = paramEnquiryId;
        handleOpenAddCost(target);
      }
    }
  }, [paramEnquiryId, allEnquiryRecords]);

  // Filtered records based on showAllEnquiries toggle, search, and category
  const filteredRecords = useMemo(() => {
    const list = showAllEnquiries
      ? allEnquiryRecords
      : allEnquiryRecords.filter((e) => e.inTotalCosting || (e.subCosts && e.subCosts !== '[]'));

    return list
      .filter((record) => {
        const product = products.find((p) => p.id === record.productId);
        const vendor = vendors.find((v) => v.id === record.vendorId);
        const category = categories.find((c) => c.id === product?.categoryId);
        const brand = brands.find((b) => b.id === product?.brandId);

        const matchesCategory = selectedCategory === 'all' || product?.categoryId === selectedCategory;

        let subMatch = false;
        if (record.subCosts) {
          try {
            const parsed: SubCostItem[] = JSON.parse(record.subCosts);
            subMatch = parsed.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
          } catch {}
        }

        const matchesSearch =
          searchTerm === '' ||
          product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          brand?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subMatch;

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allEnquiryRecords, showAllEnquiries, products, vendors, categories, brands, selectedCategory, searchTerm]);

  // Overall Statistics for all enquiry products (purchased or not)
  const stats = useMemo(() => {
    const activeList = allEnquiryRecords.filter((e) => e.inTotalCosting || (e.subCosts && e.subCosts !== '[]'));
    let totalBase = 0;
    let totalAdded = 0;

    activeList.forEach((record) => {
      const isPurchased = !!record.isPurchased;
      const qty = isPurchased ? (record.purchaseQuantity || record.quantity || 1) : (record.quantity || 1);
      const unitPrice = isPurchased ? (record.purchasePrice || record.enquiryPrice || 0) : (record.enquiryPrice || 0);
      const base = unitPrice * qty;
      totalBase += base;

      if (record.subCosts) {
        try {
          const parsed: SubCostItem[] = JSON.parse(record.subCosts);
          const sum = parsed.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
          totalAdded += sum;
        } catch {}
      }
    });

    return {
      count: activeList.length,
      totalEnquiries: allEnquiryRecords.length,
      totalBase,
      totalAdded,
      totalCost: totalBase + totalAdded,
    };
  }, [allEnquiryRecords]);

  // Toggle enquiry in Total Costing
  const handleToggleCosting = async (id: string, currentState: boolean) => {
    const newState = !currentState;
    try {
      await toggleEnquiryTotalCosting(id, newState);
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, inTotalCosting: newState } : e)));
    } catch (err) {
      console.error('Failed to toggle costing:', err);
      toast({
        title: 'Error',
        description: 'Failed to update total costing status.',
        variant: 'destructive',
      });
    }
  };

  // Add cost item row
  const handleAddCostRow = () => {
    setCostItems([...costItems, { name: '', price: 0 }]);
  };

  // Update cost item row
  const handleUpdateCostRow = (index: number, field: 'name' | 'price', value: string | number) => {
    const updated = [...costItems];
    updated[index] = { ...updated[index], [field]: value };
    setCostItems(updated);
  };

  // Remove cost item row
  const handleRemoveCostRow = (index: number) => {
    setCostItems(costItems.filter((_, i) => i !== index));
  };

  // Save cost items
  const handleSaveCosts = async () => {
    if (!editingEnquiry) return;
    setIsSaving(true);
    try {
      const validItems = costItems.filter((item) => item.name.trim() !== '');
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
        description: 'Cost updated successfully.',
      });
      setEditingEnquiry(null);
    } catch (error) {
      console.error('Failed to save costs:', error);
      toast({
        title: 'Error',
        description: 'Failed to save cost.',
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
              Add and manage product costing for all enquiry products (purchased or not) with accessory breakdowns (e.g. mouse, CPU, RAM).
            </p>
          </div>
        </div>

        {/* Minimal Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Costed Products
              </CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.count}</div>
              <p className="text-xs text-slate-500 mt-1">out of {stats.totalEnquiries} total enquiry products</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Base Product Cost
              </CardTitle>
              <Layers className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₹ {formatPrice(stats.totalBase)}</div>
              <p className="text-xs text-slate-500 mt-1">Main unit prices</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Added Sub-Costs
              </CardTitle>
              <Plus className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">₹ {formatPrice(stats.totalAdded)}</div>
              <p className="text-xs text-slate-500 mt-1">Mouse, CPU & accessories added</p>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50/60 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Total Costing
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-indigo-950">₹ {formatPrice(stats.totalCost)}</div>
              <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                Base + Added Sub-Costs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and View Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={!showAllEnquiries ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAllEnquiries(false)}
              className="text-xs h-8"
            >
              Costed Products ({stats.count})
            </Button>
            <Button
              type="button"
              variant={showAllEnquiries ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAllEnquiries(true)}
              className="text-xs h-8"
            >
              All Enquiry Products ({stats.totalEnquiries})
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search products, mouse, cpu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs bg-slate-50"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2.5 text-xs bg-slate-50 border rounded-md shadow-sm text-slate-700 focus:outline-none"
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
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-14 text-center font-semibold text-slate-700">Costing</TableHead>
                <TableHead className="font-semibold text-slate-700">Date</TableHead>
                <TableHead className="font-semibold text-slate-700">Product</TableHead>
                <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Qty</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Base Cost</TableHead>
                <TableHead className="font-semibold text-slate-700">Added Costs (Sub-Costs)</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Total Cost</TableHead>
                {canEdit && <TableHead className="text-center font-semibold text-slate-700">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-10 text-slate-500">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Calculator className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-700">No products found</p>
                      <p className="text-xs text-slate-400">
                        {showAllEnquiries
                          ? 'No products recorded in enquiries yet.'
                          : 'Click "All Enquiry Products" above or check the Total Costing checkbox in Enquiries.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const product = products.find((p) => p.id === record.productId);
                  const vendor = vendors.find((v) => v.id === record.vendorId);
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

                  const addedCostTotal = parsedSubCosts.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                  const totalCost = baseCost + addedCostTotal;
                  const isHighlighted = paramEnquiryId === record.id;

                  return (
                    <TableRow
                      key={record.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isHighlighted ? 'bg-indigo-50/50 ring-2 ring-indigo-400' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="align-top py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!record.inTotalCosting}
                          onChange={() => handleToggleCosting(record.id, !!record.inTotalCosting)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          title="Toggle in Total Costing"
                        />
                      </TableCell>

                      {/* Date */}
                      <TableCell className="align-top py-3 text-xs text-slate-600">
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>

                      {/* Product & Details with status badge */}
                      <TableCell className="align-top py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{product?.name || 'Unknown'}</p>
                            {isPurchased ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Purchased
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Enquiry
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            {brand?.name && <span className="text-slate-600 font-medium">{brand.name}</span>}
                            {product?.model && <span className="font-mono text-slate-500">({product.model})</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell className="align-top py-3 text-sm text-slate-700">
                        {vendor?.name || '-'}
                      </TableCell>

                      {/* Qty */}
                      <TableCell className="align-top py-3 text-right font-medium text-slate-700">
                        {qty}
                      </TableCell>

                      {/* Base Cost */}
                      <TableCell className="align-top py-3 text-right">
                        <p className="font-semibold text-slate-900">₹ {formatPrice(baseCost)}</p>
                        <p className="text-[11px] text-slate-400">@{formatPrice(unitPrice)}/unit</p>
                      </TableCell>

                      {/* Added Costs / Sub-Costs */}
                      <TableCell className="align-top py-3">
                        {parsedSubCosts.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1.5">
                              {parsedSubCosts.map((sub, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center text-xs bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-medium"
                                >
                                  {sub.name}: <strong className="ml-1 font-bold">₹{formatPrice(sub.price)}</strong>
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Sub-total: <strong className="text-indigo-700">+₹{formatPrice(addedCostTotal)}</strong>
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No sub-costs added</span>
                        )}
                      </TableCell>

                      {/* Total Cost */}
                      <TableCell className="align-top py-3 text-right">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹ {formatPrice(totalCost)}
                        </span>
                      </TableCell>

                      {/* Action */}
                      {canEdit && (
                        <TableCell className="align-top py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAddCost(record)}
                            className="h-8 text-xs font-medium text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            {parsedSubCosts.length > 0 ? 'Edit Cost' : 'Add Cost'}
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

        {/* Add / Edit Cost Dialog */}
        <Dialog open={!!editingEnquiry} onOpenChange={(open) => !open && setEditingEnquiry(null)}>
          {editingEnquiry && (() => {
            const product = products.find((p) => p.id === editingEnquiry.productId);
            const isPurchased = !!editingEnquiry.isPurchased;
            const qty = isPurchased ? (editingEnquiry.purchaseQuantity || editingEnquiry.quantity || 1) : (editingEnquiry.quantity || 1);
            const unitPrice = isPurchased ? (editingEnquiry.purchasePrice || editingEnquiry.enquiryPrice || 0) : (editingEnquiry.enquiryPrice || 0);
            const baseSpent = unitPrice * qty;
            const currentSubSum = costItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
            const totalCost = baseSpent + currentSubSum;

            return (
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5 text-indigo-600" />
                    Add Cost of Product
                  </DialogTitle>
                  <DialogDescription>
                    Add sub-costs for <strong>{product?.name}</strong> (e.g. mouse, CPU, charger, warranty).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Base Product Info */}
                  <div className="bg-slate-50 p-3 rounded-lg border text-sm flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{product?.name}</p>
                        {isPurchased ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Purchased
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Enquiry
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Base: {qty} unit(s) × ₹{formatPrice(unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Base Price</span>
                      <span className="font-bold text-slate-800">₹ {formatPrice(baseSpent)}</span>
                    </div>
                  </div>

                  {/* Sub-costs input list */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Sub-Cost Items / Components
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCostRow}
                        className="h-7 text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                      </Button>
                    </div>

                    {costItems.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500 mb-2">No sub-costs added yet (e.g. mouse, CPU).</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCostRow}
                          className="text-xs h-7"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add First Item
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {costItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder="Item (e.g. Mouse, CPU...)"
                              value={item.name}
                              onChange={(e) => handleUpdateCostRow(idx, 'name', e.target.value)}
                              className="flex-1 h-9 text-sm"
                            />
                            <div className="w-32 relative">
                              <span className="absolute left-2.5 top-2 text-xs text-slate-500">₹</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.price || ''}
                                onChange={(e) => handleUpdateCostRow(idx, 'price', parseFloat(e.target.value) || 0)}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) handleUpdateCostRow(idx, 'price', Number(val.toFixed(2)));
                                }}
                                className="pl-6 h-9 text-sm"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCostRow(idx)}
                              className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Cost Summary */}
                  <div className="bg-slate-50 border p-3.5 rounded-xl flex justify-between items-center text-sm">
                    <div>
                      <p className="text-xs text-slate-600">Base: ₹ {formatPrice(baseSpent)}</p>
                      <p className="text-xs text-slate-600">
                        Added Costs: <span className="font-semibold text-indigo-700">+ ₹ {formatPrice(currentSubSum)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Total Cost</span>
                      <p className="text-lg font-bold text-slate-900">₹ {formatPrice(totalCost)}</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingEnquiry(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveCosts}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSaving ? 'Saving...' : 'Save Cost'}
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
