// src/data/categories.ts

// ========================
// Category definitions
// ========================
export const categories = {
  x_medicine: {
    label: "X Medicine",
    expiryRequired: true,
    discountAuto: true,
    photoRequired: true,
    supplierRequired: true,
    statusColor: true,
    showPriceField: true,
    requireBatchNumber: true,
  },
  x_cosmo: {
    label: "X Cosmo",
    expiryRequired: false,
    discountAuto: true,
    photoRequired: false,
    supplierRequired: true,
    statusColor: true,
    showPriceField: true,
    requireBatchNumber: false,
  },
  hts_medicine: {
    label: "HTS Medicine",
    expiryRequired: false,
    discountAuto: false,
    photoRequired: false,
    supplierRequired: false,
    statusColor: false,
    showPriceField: false,
    requireBatchNumber: true,
  },
  hts_cosmo: {
    label: "HTS Cosmo",
    expiryRequired: false,
    discountAuto: false,
    photoRequired: false,
    supplierRequired: false,
    statusColor: false,
    showPriceField: false,
    requireBatchNumber: false,
  },
} as const;

export type ProductCategory = keyof typeof categories;

export interface CategoryDefinition {
  label: string;
  expiryRequired: boolean;
  discountAuto: boolean;
  photoRequired: boolean;
  supplierRequired: boolean;
  statusColor: boolean;
  showPriceField: boolean;
  requireBatchNumber: boolean;
}

// ========================
// Review type
// ========================
export interface Review {
  id: string; // ✅ now required
  user: {
    id: string; // ✅ added to satisfy ReviewSection type
    name: string;
    avatar?: string;
    role?: string;
  };
  rating: number;
  text: string;
  date: string;
  verified?: boolean;
}

// ========================
// Product type
// ========================
export interface Product {
  id: string;
  name: string;
  strength: string;
  category: ProductCategory;
  quantity: number;
  location: string;

  // Optional fields based on category requirements
  expiryDate?: string;
  supplier?: string;
  photoUrl?: string;
  discount?: number;
  price?: string;
  batchNumber?: string;

  statusColor?: "good" | "near-expiry" | "expired";
  daysLeft?: number;
  uploadDate?: string;
  lastUpdated?: string;

  // Optional extra product info
  description?: string;
  indications?: string;
  contraindications?: string;
  dosage?: string;
  storage?: string;
  requiresPrescription?: boolean;
  manufacturer?: string;
  barcode?: string;

  // Reviews
  reviews?: Review[];
  averageRating?: number;
}

// ========================
// Product form values (for add/edit forms)
// ========================
export interface ProductFormValues
  extends Omit<
    Product,
    "id" | "statusColor" | "daysLeft" | "uploadDate" | "reviews" | "averageRating"
  > {
  photo?: File;
}