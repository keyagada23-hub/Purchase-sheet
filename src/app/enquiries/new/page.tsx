'use client';

import RoleGuard from '@/components/RoleGuard';
import { useAppStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Camera, Image as ImageIcon, ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';

const enquirySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  productId: z.string().min(1, 'Product is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  enquiryPrice: z.number().min(0, 'Enquiry price must be positive'),
  notes: z.string().optional(),
  isPurchased: z.enum(['YES', 'NO']),
  purchasePrice: z.number().optional(),
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
  const { products, vendors, currentUser, addEnquiry, categories, brands } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const initialProductId = searchParams.get('productId') || '';

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      productId: initialProductId,
      vendorId: '',
      quantity: 1,
      enquiryPrice: 0,
      notes: '',
      isPurchased: 'NO',
      purchasePrice: 0,
    }
  });

  const selectedProductId = watch('productId');
  const selectedVendorId = watch('vendorId');
  const isPurchased = watch('isPurchased');
  const quantity = watch('quantity') || 1;
  const enquiryPrice = watch('enquiryPrice') || 0;
  const purchasePrice = watch('purchasePrice') || 0;
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  useEffect(() => {
    if (selectedProduct && selectedProduct.defaultVendorId) {
      setValue('vendorId', selectedProduct.defaultVendorId);
    }
  }, [selectedProductId, setValue, selectedProduct]);

  const estimatedTotal = quantity * enquiryPrice;
  const actualTotal = quantity * purchasePrice;
  const priceDifference = purchasePrice - enquiryPrice;
  const percentageDifference = enquiryPrice > 0 ? ((purchasePrice - enquiryPrice) / enquiryPrice) * 100 : 0;

  const onSubmit = (data: EnquiryFormValues) => {
    addEnquiry({
      id: `e${Date.now()}`,
      ...data,
      isPurchased: data.isPurchased === 'YES',
      userId: currentUser?.id || 'unknown',
      notes: data.notes || '',
      status: 'Open',
      purchasePrice: data.isPurchased === 'YES' ? data.purchasePrice : undefined,
    });
    
    toast({
      title: "Success",
      description: "Enquiry/Purchase record saved successfully.",
    });

    router.push('/enquiries');
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
              <Controller
                name="productId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search products..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.productId && <p className="text-sm text-red-500">{errors.productId.message}</p>}
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-md text-sm border">
                <div><span className="text-slate-500 block">SKU</span> {selectedProduct.sku || '-'}</div>
                <div><span className="text-slate-500 block">Barcode</span> {selectedProduct.barcode || '-'}</div>
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
              <Controller
                name="vendorId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search vendors..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vendorId && <p className="text-sm text-red-500">{errors.vendorId.message}</p>}
            </div>

            {selectedVendor && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-md text-sm border">
                <div><span className="text-slate-500 block">Category</span> {categories.find(c => c.id === selectedVendor.categoryId)?.name || '-'}</div>
                <div><span className="text-slate-500 block">Contact</span> {selectedVendor.contactPerson}</div>
                <div><span className="text-slate-500 block">Phone</span> {selectedVendor.phone}</div>
                <div><span className="text-slate-500 block">Location</span> {selectedVendor.city}, {selectedVendor.country}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <div className="flex items-center space-x-2">
                <Button type="button" variant="outline" size="icon" onClick={() => setValue('quantity', Math.max(1, quantity - 1))}>-</Button>
                <Input 
                  id="quantity" 
                  type="number" 
                  className="text-center w-24"
                  {...register('quantity', { valueAsNumber: true })} 
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setValue('quantity', quantity + 1)}>+</Button>
              </div>
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="enquiryPrice">Approx. Enquiry Price (₹) *</Label>
              <Input 
                id="enquiryPrice" 
                type="number" 
                placeholder="25000"
                {...register('enquiryPrice', { valueAsNumber: true })} 
              />
              {errors.enquiryPrice && <p className="text-sm text-red-500">{errors.enquiryPrice.message}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                Estimated Total: ₹ {estimatedTotal.toLocaleString()}
              </p>
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
                    onValueChange={field.onChange} 
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
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Actual Purchase Price (₹) *</Label>
                <Input 
                  id="purchasePrice" 
                  type="number" 
                  {...register('purchasePrice', { valueAsNumber: true })} 
                />
                {errors.purchasePrice && <p className="text-sm text-red-500">{errors.purchasePrice.message}</p>}
                <p className="text-sm font-medium mt-1 text-green-700">
                  Actual Total: ₹ {actualTotal.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col justify-center">
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
