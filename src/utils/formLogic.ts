// ========================
// File: /src/utils/formLogic.ts
// ========================

import { categories } from '../data/categories';
import type { ProductCategory } from '../data/categories';
import { calculateDaysLeft, getStatusColor, calculateAutoDiscount } from './expiryUtils';

export type FormFieldType = 'text' | 'number' | 'date' | 'select' | 'file';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    message?: string;
  };
}

export interface FormConfig {
  category: ProductCategory;
  fields: FormField[];
}

// ========================
// Static Addis Ababa neighborhoods
// ========================
export const addisAbabaLocations = [
  'Bole',
  'Bole Rwanda',
  'Mexico Square',
  '4 Kilo',
  '5 Kilo',
  'Kazanchis',
  'Meskel Square',
  'Piassa',
  'Merkato',
  'Sarbet',
];

// ========================
// Generate dynamic form configuration
// ========================
export const getFormConfig = (categoryKey: ProductCategory): FormConfig => {
  const category = categories[categoryKey];

  const baseFields: FormField[] = [
    {
      name: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Amoxicillin 500mg Capsule',
      validation: {
        pattern: /^[a-zA-Z0-9\s\/\-]+$/,
        message: 'Only letters, numbers, spaces, / and - are allowed',
      },
    },
    {
      name: 'strength',
      label: 'Strength/Dosage',
      type: 'text',
      required: false,
      placeholder: 'e.g., 200mg/5ml',
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
      required: true,
      placeholder: 'Number of units/boxes',
      validation: {
        min: 1,
        message: 'Quantity must be at least 1',
      },
    },
    {
      name: 'location',
      label: 'Location (Neighborhood)',
      type: 'select',
      required: true,
      options: addisAbabaLocations, // ✅ static options
    },
    {
      name: 'specificLocation',
      label: 'Specific Place / Landmark',
      type: 'text',
      required: false,
      placeholder: 'e.g., in front of XYZ building',
    },
  ];

  const categoryFields: FormField[] = [];

  if (category.expiryRequired) {
    categoryFields.push({
      name: 'expiryDate',
      label: 'Expiry Date',
      type: 'date',
      required: true,
      validation: { message: 'Expiry date must be in the future' },
    });
  }

  if (category.supplierRequired) {
    categoryFields.push({
      name: 'supplier',
      label: 'Supplier',
      type: 'text',
      required: true,
      placeholder: 'e.g., PharmaLink Ethiopia',
    });
  }

  if (category.photoRequired) {
    categoryFields.push({
      name: 'photo',
      label: 'Product Photo',
      type: 'file',
      required: true,
      validation: { message: 'Product photo is required' },
    });
  }

  if (category.requireBatchNumber) {
    categoryFields.push({
      name: 'batchNumber',
      label: 'Batch Number',
      type: 'text',
      required: true,
      placeholder: 'Enter batch number',
    });
  }

  if (category.showPriceField) {
    categoryFields.push({
      name: 'price',
      label: 'Price',
      type: 'number',
      required: true,
      placeholder: 'Unit price',
    });
  }

  return {
    category: categoryKey,
    fields: [...baseFields, ...categoryFields],
  };
};

// ========================
// Validate form data
// ========================
export const validateForm = (
  formData: Record<string, any>,
  config: FormConfig
): Record<string, string> => {
  const errors: Record<string, string> = {};

  config.fields.forEach((field) => {
    const value = formData[field.name];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.name] = `${field.label} is required`;
      return;
    }

    if (field.validation) {
      if (field.validation.pattern && value && !field.validation.pattern.test(value)) {
        errors[field.name] = field.validation.message || 'Invalid format';
      }

      if (field.type === 'number' && field.validation.min !== undefined && value < field.validation.min) {
        errors[field.name] = field.validation.message || `Value must be at least ${field.validation.min}`;
      }

      if (field.name === 'expiryDate' && value) {
        const daysLeft = calculateDaysLeft(String(value));
        if (daysLeft < 0) errors[field.name] = 'Expiry date must be in the future';
      }
    }
  });

  return errors;
};

// ========================
// Process form data before submit
// ========================
export const processFormData = (formData: Record<string, any>, category: ProductCategory) => {
  const processedData: Record<string, any> = { ...formData };

  if (formData.quantity !== undefined) processedData.quantity = Number(formData.quantity);
  if (formData.price !== undefined) processedData.price = Number(formData.price);

  const cat = categories[category];
  if (cat.expiryRequired && formData.expiryDate) {
    const daysLeft = calculateDaysLeft(String(formData.expiryDate));
    processedData.daysLeft = daysLeft;
    processedData.statusColor = getStatusColor(daysLeft);

    if (cat.discountAuto && daysLeft < 90 && daysLeft >= 0) {
      processedData.discount = calculateAutoDiscount(formData.expiryDate);
    }
  }

  return processedData;
};

export default {
  getFormConfig,
  validateForm,
  processFormData,
};