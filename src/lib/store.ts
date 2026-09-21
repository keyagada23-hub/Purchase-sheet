import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Product, Vendor, Enquiry, Brand, MasterCategory, Role } from '@/types';

// Mock Initial Data
const initialUsers: User[] = [
  { id: 'u1', name: 'John Doe', username: 'john', password: 'password', email: 'john@example.com', role: 'User', department: 'Procurement', location: 'HQ', status: 'Active', lastLogin: '' },
  { id: 'u2', name: 'Jane Smith', username: 'admin', password: 'password', email: 'admin@example.com', role: 'Admin', department: 'Management', location: 'HQ', status: 'Active', lastLogin: '' },
  { id: 'u3', name: 'Dev Ops', username: 'dev', password: 'password', email: 'dev@example.com', role: 'Developer', department: 'IT', location: 'HQ', status: 'Active', lastLogin: '' },
];

const initialBrands: Brand[] = [
  { id: 'b1', name: 'Dell' },
  { id: 'b2', name: 'HP' },
  { id: 'b3', name: 'Logitech' },
  { id: 'b4', name: 'Samsung' },
];

const initialCategories: MasterCategory[] = [
  { id: 'c1', name: 'Electronics', type: 'Product' },
  { id: 'c2', name: 'IT Equipment', type: 'Product' },
  { id: 'c3', name: 'Office Furniture', type: 'Product' },
  { id: 'c4', name: 'Manufacturer', type: 'Vendor' },
  { id: 'c5', name: 'Distributor', type: 'Vendor' },
];

const initialVendors: Vendor[] = [
  { id: 'v1', name: 'ABC Technologies', code: 'V-001', categoryId: 'c5', contactPerson: 'Alice', phone: '1234567890', email: 'alice@abc.com', address: '123 Tech St', city: 'Tech City', state: 'TS', country: 'IN', taxId: 'TAX123', website: 'abc.com', status: 'Active' },
  { id: 'v2', name: 'XYZ Computers', code: 'V-002', categoryId: 'c4', contactPerson: 'Bob', phone: '0987654321', email: 'bob@xyz.com', address: '456 IT Park', city: 'IT City', state: 'IS', country: 'IN', taxId: 'TAX456', website: 'xyz.com', status: 'Active' },
];

const initialProducts: Product[] = [
  { id: 'p1', name: 'Dell Latitude 5440', code: 'P-001', sku: 'DELL-5440', barcode: '123456789012', brandId: 'b1', categoryId: 'c2', description: 'Business Laptop', photoUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80', unit: 'Nos', defaultVendorId: 'v1', status: 'Active' },
  { id: 'p2', name: 'Logitech MX Master 3S', code: 'P-002', sku: 'LOGI-MX3S', barcode: '987654321098', brandId: 'b3', categoryId: 'c2', description: 'Wireless Mouse', photoUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80', unit: 'Nos', defaultVendorId: 'v2', status: 'Active' },
];

interface AppState {
  // Auth State
  currentUser: User | null;
  login: (username: string, password?: string) => boolean;
  logout: () => void;

  // DB State
  users: User[];
  products: Product[];
  vendors: Vendor[];
  enquiries: Enquiry[];
  brands: Brand[];
  categories: MasterCategory[];

  // Actions
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (id: string) => void;

  addEnquiry: (enquiry: Enquiry) => void;
  updateEnquiry: (enquiry: Enquiry) => void;
  deleteEnquiry: (id: string) => void;

  addCategory: (category: MasterCategory) => void;
  deleteCategory: (id: string) => void;

  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      login: (username, password) => {
        const { users } = get();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),

      users: initialUsers,
      products: initialProducts,
      vendors: initialVendors,
      enquiries: [],
      brands: initialBrands,
      categories: initialCategories,

      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (product) => set((state) => ({ products: state.products.map(p => p.id === product.id ? product : p) })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter(p => p.id !== id) })),

      addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
      updateVendor: (vendor) => set((state) => ({ vendors: state.vendors.map(v => v.id === vendor.id ? vendor : v) })),
      deleteVendor: (id) => set((state) => ({ vendors: state.vendors.filter(v => v.id !== id) })),

      addEnquiry: (enquiry) => set((state) => ({ enquiries: [...state.enquiries, enquiry] })),
      updateEnquiry: (enquiry) => set((state) => ({ enquiries: state.enquiries.map(e => e.id === enquiry.id ? enquiry : e) })),
      deleteEnquiry: (id) => set((state) => ({ enquiries: state.enquiries.filter(e => e.id !== id) })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (user) => set((state) => ({ users: state.users.map(u => u.id === user.id ? user : u) })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter(u => u.id !== id) })),
    }),
    {
      name: 'procurement-storage-v2',
    }
  )
);
