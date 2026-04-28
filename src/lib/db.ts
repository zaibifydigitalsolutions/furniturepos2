import Dexie, { type Table } from 'dexie';

export interface User {
  id?: number;
  name: string;
  username: string;
  password: string;
  role: 'super_admin' | 'admin' | 'cashier' | 'staff';
  email: string;
  phone: string;
  address?: string;
  cnic?: string;
  salary?: number;
  joiningDate?: Date;
  emergencyContact?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  permissions: string[];
  notes?: string;
  createdAt?: Date;
}

export interface Category {
  id?: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'active' | 'inactive';
  sortOrder?: number;
  createdAt?: Date;
}

export interface Product {
  id?: number;
  categoryId: number;
  sku: string;
  name: string;
  subcategory?: string;
  brand: string;
  description: string;
  material: string;
  color: string[];
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  costPrice: number;
  sellPrice: number;
  discountable: boolean;
  taxable: boolean;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  images: string[];
  barcode?: string;
  supplier?: string;
  warrantyMonths?: number;
  status: 'active' | 'inactive' | 'discontinued';
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Inventory {
  id?: number;
  productId: number;
  productName?: string;
  sku?: string;
  type: 'stock_in' | 'stock_out' | 'damage' | 'return' | 'adjustment' | 'sale';
  quantity: number;
  reason: string;
  reference?: string;
  date: Date;
  userId: number;
  notes?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  cnic?: string;
  notes?: string;
  creditLimit?: number;
  creditBalance?: number;
  totalSpent?: number;
  visits?: number;
  lastVisit?: Date;
  createdAt?: Date;
}

export interface SaleItem {
  id?: number;
  saleId?: number;
  productId: number;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id?: number;
  invoiceNo: string;
  customerId?: number;
  userId: number;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'credit';
  amountReceived?: number;
  change?: number;
  status: 'completed' | 'refunded' | 'voided' | 'credit';
  notes?: string;
  createdAt?: Date;
}

export interface Expense {
  id?: number;
  category: string;
  amount: number;
  description: string;
  date: Date;
  userId: number;
  receiptImage?: string;
}

export interface Setting {
  id?: number;
  key: string;
  value: string;
}

export interface Session {
  id?: number;
  userId: number;
  loginAt: Date;
  logoutAt?: Date;
  ip?: string;
}

export class FurniCraftDB extends Dexie {
  users!: Table<User>;
  categories!: Table<Category>;
  products!: Table<Product>;
  inventory!: Table<Inventory>;
  customers!: Table<Customer>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  expenses!: Table<Expense>;
  settings!: Table<Setting>;
  sessions!: Table<Session>;

  constructor() {
    super('FurniCraftPOS');
    
    this.version(1).stores({
      users: '++id, username, role, email, status, createdAt',
      categories: '++id, name, status, sortOrder',
      products: '++id, categoryId, sku, name, brand, status, stock, featured',
      inventory: '++id, productId, type, date, userId',
      customers: '++id, name, phone, email',
      sales: '++id, invoiceNo, customerId, userId, status, createdAt',
      saleItems: '++id, saleId, productId',
      expenses: '++id, category, date, userId',
      settings: '++id, key',
      sessions: '++id, userId, loginAt'
    });
  }
}

export const db = new FurniCraftDB();
