
export type Role = 'User' | 'Admin' | 'Developer';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: Role;
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
  model: string;
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
  photoUrl?: string;
  status: 'Active' | 'Inactive';
}

export interface Vendor {
  id: string;
  name: string;
  categoryId: string;
  phone: string;
  email?: string;
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
  purchaseQuantity?: number;
  serialNumber?: string;
  barcode?: string;
  userId: string;
  status: 'Open' | 'Closed' | 'Cancelled';
  purchaseReason?: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  entity: 'User' | 'Product' | 'Vendor' | 'Enquiry' | 'Category' | 'Brand';
  entityName: string;
  details: string;
  timestamp: string;
}
