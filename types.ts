
export enum ProductStatus {
  Hot = '🔥 مطلوب',
  Interesting = '👀 مهتم به',
  Cold = '💸 ضعيف التفاعل',
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discount?: number;
  description: string;
  scans: number;
  sales: number;
  imageUrl: string;
  lastScanned?: string;
  stock: number; // New field
  discountExpiration?: string; // New field (ISO string)
}

export interface Sale {
  productId: string;
  quantity: number;
  date: string;
}

export type Page = 'dashboard' | 'products' | 'sales' | 'pos' | 'promo';

export interface Notification {
    id: string;
    type: 'low_stock' | 'expiring_promo';
    message: string;
    productId: string;
    timestamp: string;
}
