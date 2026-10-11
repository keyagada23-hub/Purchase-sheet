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

  // ONLY ENQUIRY PRODUCTS (unpurchased enquiries)
  const enquiryRecords = useMemo(() => {
    return enquiries.filter((e) => !e.isPurchased);
  }, [enquiries]);

  // Open dialog to add/edit cost of enquiry product
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
    if (paramEnquiryId && enquiryRecords.length > 0 && autoOpenedRef.current !== paramEnquiryId) {
      const target = enquiryRecords.find((e) => e.id === paramEnquiryId);
      if (target) {
        autoOpenedRef.current = paramEnquiryId;
        handleOpenAddCost(target);
      }
    }
  }, [paramEnquiryId, enquiryRecords]);

  // Filtered enquiries based on showAllEnquiries toggle and search
  const filteredEnquiries = useMemo(() => {
    const list = showAllEnquiries
      ? enquiryRecords
      : enquiryRecords.filter((e) => e.inTotalCosting || (e.subCosts && e.subCosts !== '[]'));

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
  }, [enquiryRecords, showAllEnquiries, products, vendors, categories, brands, selectedCategory, searchTerm]);

  // Overall Statistics for enquiry products
  const stats = useMemo(() => {
    const activeList = enquiryRecords.filter((e) => e.inTotalCosting || (e.subCosts && e.subCosts !== '[]'));
    let totalBase = 0;
    let totalAdded = 0;

    activeList.forEach((record) => {
      const base = record.enquiryPrice * record.quantity;
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
      totalEnquiries: enquiryRecords.length,
      totalBase,
      totalAdded,
      totalCost: totalBase + totalAdded,
    };
  }, [enquiryRecords]);

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
        description: 'Cost of enquiry product updated successfully.',
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
              Total Costing (Enquiry Products)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Add and manage the sub-costs of enquiry products (e.g. laptop with mouse, CPU, RAM, etc.).
            </p>
          </div>
        </div>

        {/* Minimal Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Costed Enquiry Products
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
                Base Enquiry Cost
              </CardTitle>
              <Layers className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₹ {formatPrice(stats.totalBase)}</div>
              <p className="text-xs text-slate-500 mt-1">Base product prices</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Added Product Costs
              </CardTitle>
              <Plus className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">₹ {formatPrice(stats.totalAdded)}</div>
              <p className="text-xs text-slate-500 mt-1">Accessories & sub-components</p>
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
                Base + Added Costs
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
              Costed Enquiries ({stats.count})
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
                placeholder="Search enquiry products..."
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

        {/* Enquiry Products Total Costing Table */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-14 text-center font-semibold text-slate-700">Costing</TableHead>
                <TableHead className="font-semibold text-slate-700">Date</TableHead>
                <TableHead className="font-semibold text-slate-700">Enquiry Product</TableHead>
                <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Qty</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Enquiry Price</TableHead>
                <TableHead className="font-semibold text-slate-700">Added Costs (Sub-Costs)</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Total Cost</TableHead>
                {canEdit && <TableHead className="text-center font-semibold text-slate-700">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-10 text-slate-500">
                    Loading enquiry products...
                  </TableCell>
                </TableRow>
              ) : filteredEnquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Calculator className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-700">No enquiry products found</p>
                      <p className="text-xs text-slate-400">
                        {showAllEnquiries
                          ? 'No enquiries recorded yet.'
                          : 'Click "All Enquiry Products" above or check the Total Costing checkbox in the Enquiries section.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnquiries.map((record) => {
                  const product = products.find((p) => p.id === record.productId);
                  const vendor = vendors.find((v) => v.id === record.vendorId);
                  const brand = brands.find((b) => b.id === product?.brandId);
                  const baseCost = record.enquiryPrice * record.quantity;

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

                      {/* Product */}
                      <TableCell className="align-top py-3">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900">{product?.name || 'Unknown'}</p>
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
                        {record.quantity}
                      </TableCell>

                      {/* Base Enquiry Price */}
                      <TableCell className="align-top py-3 text-right">
                        <p className="font-semibold text-slate-900">₹ {formatPrice(baseCost)}</p>
                        <p className="text-[11px] text-slate-400">@{formatPrice(record.enquiryPrice)}/unit</p>
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
            const baseSpent = editingEnquiry.enquiryPrice * editingEnquiry.quantity;
            const currentSubSum = costItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
            const totalCost = baseSpent + currentSubSum;

            return (
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5 text-indigo-600" />
                    Add Cost of Enquiry Product
                  </DialogTitle>
                  <DialogDescription>
                    Add sub-costs for <strong>{product?.name}</strong> (e.g. mouse, CPU, charger, warranty).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Base Product Info */}
                  <div className="bg-slate-50 p-3 rounded-lg border text-sm flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{product?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enquiry: {editingEnquiry.quantity} unit(s) × ₹{formatPrice(editingEnquiry.enquiryPrice)}
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
