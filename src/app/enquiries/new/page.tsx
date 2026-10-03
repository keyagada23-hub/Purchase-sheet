// @ts-nocheck
'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreatableCombobox } from '@/components/CreatableCombobox';
import { Camera, Image as ImageIcon, ArrowDown, ArrowUp, Barcode, ScanText } from 'lucide-react';
import { useEffect, Suspense, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Product, Vendor, MasterCategory, Brand } from '@/types';
import { createEnquiry } from '@/app/actions/enquiry';
import { getProducts } from '@/app/actions/product';
import { getVendors } from '@/app/actions/vendor';
import { getCategories, getBrands } from '@/app/actions/category';

const enquirySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  productId: z.string().min(1, 'Product is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  enquiryPrice: z.number().min(0, 'Enquiry price must be positive'),
  enquiryPriceWithGst: z.number().min(0).optional(),
  notes: z.string().optional(),
  isPurchased: z.enum(['YES', 'NO']),
  purchasePrice: z.number().optional(),
  purchasePriceWithGst: z.number().optional(),
  purchaseQuantity: z.number().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isPurchased === 'YES' && (data.purchasePrice === undefined || data.purchasePrice <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Actual purchase price is required when purchased",
      path: ["purchasePrice"]
    });
  }
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

function EnquiryForm() {
  const { currentUser } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedProducts, fetchedVendors, fetchedCategories, fetchedBrands] = await Promise.all([
          getProducts(),
          getVendors(),
          getCategories(),
          getBrands()
        ]);
        setProducts(fetchedProducts);
        setVendors(fetchedVendors);
        setCategories(fetchedCategories);
        setBrands(fetchedBrands);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const initialProductId = searchParams.get('productId') || '';

  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors } } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      productId: initialProductId,
      vendorId: '',
      quantity: 1,
      enquiryPrice: 0,
      enquiryPriceWithGst: 0,
      notes: '',
      isPurchased: 'NO',
      purchasePrice: 0,
      serialNumber: '',
      barcode: '',
    }
  });

  const [showBarcode, setShowBarcode] = useState(false);
  const [showSerial, setShowSerial] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const serialRef = useRef<HTMLInputElement>(null);

  const { ref: barcodeRegisterRef, ...barcodeRegisterProps } = register('barcode');
  const { ref: serialRegisterRef, ...serialRegisterProps } = register('serialNumber');

  useEffect(() => {
    if (showBarcode && barcodeRef.current) barcodeRef.current.focus();
  }, [showBarcode]);

  useEffect(() => {
    if (showSerial && serialRef.current) serialRef.current.focus();
  }, [showSerial]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedProductId = watch('productId');
  const selectedVendorId = watch('vendorId');
  const isPurchased = watch('isPurchased');
  const quantity = watch('quantity') || 1;
  const enquiryPrice = watch('enquiryPrice') || 0;
  const enquiryPriceWithGst = watch('enquiryPriceWithGst') || 0;
  const purchasePrice = watch('purchasePrice') || 0;
  const purchasePriceWithGst = watch('purchasePriceWithGst') || 0;
  const purchaseQuantity = watch('purchaseQuantity') || quantity;
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  const estimatedTotal = quantity * enquiryPrice;
  const estimatedTotalWithGst = quantity * enquiryPriceWithGst;
  const actualTotal = purchaseQuantity * purchasePrice;
  const actualTotalWithGst = purchaseQuantity * purchasePriceWithGst;
  const priceDifference = (actualTotal) - (estimatedTotal);
  const percentageDifference = estimatedTotal > 0 ? ((actualTotal - estimatedTotal) / estimatedTotal) * 100 : 0;

  const onSubmit = async (data: EnquiryFormValues) => {
    try {
      await createEnquiry({
        date: data.date,
        productId: data.productId,
        vendorId: data.vendorId,
        quantity: data.quantity,
        enquiryPrice: data.enquiryPrice,
        isPurchased: data.isPurchased === 'YES',
        userId: currentUser?.id || 'unknown',
        notes: data.notes || '',
        status: 'Open',
        purchasePrice: data.isPurchased === 'YES' ? data.purchasePrice : null,
        purchaseQuantity: data.isPurchased === 'YES' ? (data.purchaseQuantity || data.quantity) : null,
        serialNumber: data.isPurchased === 'YES' ? data.serialNumber : null,
        barcode: data.isPurchased === 'YES' ? data.barcode : null,
      });
      
      toast({
        title: "Success",
        description: "Enquiry/Purchase record saved successfully.",
      });

      router.push('/enquiries');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save enquiry.",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date">Enquiry / Purchase Date *</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <CreatableCombobox 
                items={products.map(p => ({ id: p.id, name: `${p.name} (${p.model})` }))}
                value={selectedProductId}
                onChange={(val) => setValue('productId', val, { shouldValidate: true })}
                placeholder="Search products..."
              />
              {errors.productId && <p className="text-sm text-red-500">{errors.productId.message}</p>}
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-md text-sm border">
                <div><span className="text-slate-500 block">Model</span> {selectedProduct.model || '-'}</div>
                <div><span className="text-slate-500 block">Brand</span> {brands.find(b => b.id === selectedProduct.brandId)?.name || '-'}</div>
                <div><span className="text-slate-500 block">Category</span> {categories.find(c => c.id === selectedProduct.categoryId)?.name || '-'}</div>
              </div>
            )}
          </div>
          <div className="border rounded-md flex flex-col items-center justify-center bg-slate-50 min-h-[150px]">
            {selectedProduct?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedProduct.photoUrl} alt="Product" className="object-contain h-full w-full rounded-md" />
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <ImageIcon className="h-10 w-10 mx-auto" />
                <p className="text-sm">No Photo Available</p>
                <Button type="button" variant="outline" size="sm"><Camera className="mr-2 h-4 w-4"/> Upload</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 md:w-1/2">
              <Label>Vendor Name *</Label>
              <CreatableCombobox 
                items={vendors.map(v => ({ id: v.id, name: v.name }))}
                value={selectedVendorId}
                onChange={(val) => setValue('vendorId', val, { shouldValidate: true })}
                placeholder="Search vendors..."
              />
              {errors.vendorId && <p className="text-sm text-red-500">{errors.vendorId.message}</p>}
            </div>

            {selectedVendor && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-md text-sm border">
                <div><span className="text-slate-500 block">Category</span> {categories.find(c => c.id === selectedVendor.categoryId)?.name || '-'}</div>
                <div><span className="text-slate-500 block">Phone</span> {selectedVendor.phone || '-'}</div>
                <div className="col-span-2"><span className="text-slate-500 block">Address</span> {selectedVendor.address} {selectedVendor.city} {selectedVendor.state} {selectedVendor.country}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Quantity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <div className="flex items-center space-x-2">
                <Button type="button" variant="outline" size="icon" onClick={() => {
                  const newQty = Math.max(1, quantity - 1);
                  setValue('quantity', newQty);
                  setValue('purchaseQuantity', newQty);
                }}>-</Button>
                <Input 
                  id="quantity" 
                  type="number" 
                  className="text-center w-24"
                  {...register('quantity', { 
                    valueAsNumber: true,
                    onChange: (e) => {
                      const val = parseInt(e.target.value) || 1;
                      setValue('purchaseQuantity', val);
                    }
                  })} 
                />
                <Button type="button" variant="outline" size="icon" onClick={() => {
                  const newQty = quantity + 1;
                  setValue('quantity', newQty);
                  setValue('purchaseQuantity', newQty);
                }}>+</Button>
              </div>
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="enquiryPrice">Approx. Price (Without GST) *</Label>
              <Input 
                id="enquiryPrice" 
                type="number" 
                step="any"
                placeholder="25000"
                {...register('enquiryPrice', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('enquiryPriceWithGst', Number((val * 1.18).toFixed(2)));
                  }
                })} 
              />
              {errors.enquiryPrice && <p className="text-sm text-red-500">{errors.enquiryPrice.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="enquiryPriceWithGst">Approx. Price (With 18% GST)</Label>
              <Input 
                id="enquiryPriceWithGst" 
                type="number" 
                step="any"
                placeholder="29500"
                {...register('enquiryPriceWithGst', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('enquiryPrice', Number((val / 1.18).toFixed(2)));
                  }
                })} 
              />
              {errors.enquiryPriceWithGst && <p className="text-sm text-red-500">{errors.enquiryPriceWithGst.message}</p>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50 border rounded-xl shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Grand Total (Without GST)</p>
              <p className="text-2xl font-bold text-slate-900">₹ {estimatedTotal.toLocaleString()}</p>
            </div>
            <div className="md:border-l md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Grand Total (With 18% GST)</p>
              <p className="text-2xl font-bold text-blue-700">₹ {estimatedTotalWithGst.toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-6 border-t">
            <div className="space-y-4">
              <Label className="text-base">Purchased? *</Label>
              <Controller
                name="isPurchased"
                control={control}
                render={({ field }) => (
                  <RadioGroup 
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (val === 'YES') {
                        const currentPurchasePrice = getValues('purchasePrice');
                        if (!currentPurchasePrice) {
                          setValue('purchasePrice', getValues('enquiryPrice'));
                          setValue('purchasePriceWithGst', getValues('enquiryPriceWithGst'));
                        }
                        const currentPurchaseQty = getValues('purchaseQuantity');
                        if (!currentPurchaseQty) {
                          setValue('purchaseQuantity', getValues('quantity'));
                        }
                      }
                    }} 
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="YES" id="yes" />
                      <Label htmlFor="yes">YES</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NO" id="no" />
                      <Label htmlFor="no">NO</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
          </div>

          {isPurchased === 'YES' && (
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50/50 p-4 rounded-lg border border-green-100">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Actual Purchase Price (Without GST) *</Label>
                  <Input 
                    id="purchasePrice" 
                    type="number" 
                    step="any"
                    {...register('purchasePrice', { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue('purchasePriceWithGst', Number((val * 1.18).toFixed(2)));
                      }
                    })} 
                  />
                  {errors.purchasePrice && <p className="text-sm text-red-500">{errors.purchasePrice.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchasePriceWithGst">Actual Purchase Price (With 18% GST)</Label>
                  <Input 
                    id="purchasePriceWithGst" 
                    type="number" 
                    step="any"
                    {...register('purchasePriceWithGst', { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue('purchasePrice', Number((val / 1.18).toFixed(2)));
                      }
                    })} 
                  />
                  {errors.purchasePriceWithGst && <p className="text-sm text-red-500">{errors.purchasePriceWithGst.message}</p>}
                </div>

                <div className="pt-2">
                  <p className="text-sm font-medium mt-1 text-green-700">
                    Grand Total (w/o GST): ₹ {actualTotal.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium mt-1 text-green-800">
                    Grand Total (w/ 18% GST): ₹ {actualTotalWithGst.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2 bg-white p-4 rounded-lg border">
                  <Label htmlFor="purchaseQuantity">Actual Purchased Qty *</Label>
                  <div className="flex items-center space-x-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => setValue('purchaseQuantity', Math.max(1, purchaseQuantity - 1))}>-</Button>
                    <Input 
                      id="purchaseQuantity" 
                      type="number" 
                      className="text-center w-24"
                      {...register('purchaseQuantity', { valueAsNumber: true })} 
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setValue('purchaseQuantity', purchaseQuantity + 1)}>+</Button>
                  </div>
                  {errors.purchaseQuantity && <p className="text-sm text-red-500">{errors.purchaseQuantity.message}</p>}
                </div>

                <Card className="bg-white">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Difference</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">₹ {Math.abs(priceDifference).toLocaleString()}</span>
                        {priceDifference > 0 ? (
                          <span className="flex items-center text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            <ArrowUp className="w-3 h-3 mr-1" /> {percentageDifference.toFixed(1)}% INCREASE
                          </span>
                        ) : priceDifference < 0 ? (
                          <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                            <ArrowDown className="w-3 h-3 mr-1" /> {Math.abs(percentageDifference).toFixed(1)}% SAVING
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">SAME PRICE</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {isPurchased === 'YES' && (
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="barcode">Barcode</Label>
                  {!showBarcode && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-blue-600 px-2" onClick={() => setShowBarcode(true)}>
                      <Barcode className="mr-2 h-4 w-4" /> Scan
                    </Button>
                  )}
                </div>
                {showBarcode ? (
                  <div className="relative">
                    <Input 
                      id="barcode" 
                      placeholder="Scan or type barcode..." 
                      className="pl-10 font-mono bg-white"
                      {...barcodeRegisterProps}
                      ref={(e) => {
                        barcodeRegisterRef(e);
                        // @ts-ignore
                        barcodeRef.current = e;
                      }}
                    />
                    <Barcode className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 bg-white p-3 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-50" onClick={() => setShowBarcode(true)}>
                    Click to scan barcode
                  </div>
                )}
                {errors.barcode && <p className="text-sm text-red-500">{errors.barcode.message}</p>}
              </div>

              <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  {!showSerial && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-blue-600 px-2" onClick={() => setShowSerial(true)}>
                      <ScanText className="mr-2 h-4 w-4" /> Scan
                    </Button>
                  )}
                </div>
                {showSerial ? (
                  <div className="relative">
                    <Input 
                      id="serialNumber" 
                      placeholder="Scan or type serial number..." 
                      className="pl-10 font-mono uppercase bg-white"
                      {...serialRegisterProps}
                      ref={(e) => {
                        serialRegisterRef(e);
                        // @ts-ignore
                        serialRef.current = e;
                      }}
                    />
                    <ScanText className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 bg-white p-3 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-50" onClick={() => setShowSerial(true)}>
                    Click to enter serial number
                  </div>
                )}
                {errors.serialNumber && <p className="text-sm text-red-500">{errors.serialNumber.message}</p>}
              </div>
            </div>
          )}

            {/* Removed Reason field based on user request */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            id="notes" 
            {...register('notes')} 
            placeholder="Any special remarks or conditions..." 
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pb-8">
        <Button type="submit" size="lg">Save Record</Button>
      </div>
    </form>
  );
}

export default function NewEnquiryPage() {
  const router = useRouter();
  
  return (
    <RoleGuard roles={['User', 'Admin', 'Developer']}>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">New Enquiry / Purchase</h1>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
        <Suspense fallback={<div>Loading form...</div>}>
          <EnquiryForm />
        </Suspense>
      </div>
    </RoleGuard>
  );
}
