
export type Role = 'User' | 'Admin' | 'Developer';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: Role;
  department: string;
  location: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export interface MasterCategory {
  id: string;
  name: string;
  type: 'Product' | 'Vendor';
}

export interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  barcode: string;
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  photoUrl: string;
  unit: string;
  defaultVendorId: string;
  status: 'Active' | 'Inactive';
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  taxId: string;
  website: string;
  status: 'Active' | 'Inactive';
}

export interface Enquiry {
  id: string;
  date: string;
  productId: string;
  vendorId: string;
  quantity: number;
  enquiryPrice: number;
  notes: string;
  isPurchased: boolean;
  purchasePrice?: number;
  userId: string;
  status: 'Open' | 'Closed' | 'Cancelled';
  purchaseReason?: string;
}

export interface Brand {
  id: string;
  name: string;
}
