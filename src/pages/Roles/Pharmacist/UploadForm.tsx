import React, { useState, useCallback } from "react";
import { supabaseAdmin } from "../../../lib/supabase";
import { useUser } from "../../../context/UserContext";
import { categories } from "../../../data/categories";
import type { ProductCategory } from "../../../data/categories";
import {
  calculateDaysLeft,
  getStatusColor,
  calculateAutoDiscount,
} from "../../../utils/expiryUtils";
import "./UploadForm.css";

interface UploadFormProps {
  category: ProductCategory;
  onSuccess: (productName: string) => void;
}

interface FormData {
  name: string;
  strength: string;
  expiryDate: string;
  quantity: string;
  supplier: string;
  location_name: string;        // user-entered location name
  specificLocation: string;
  batchNumber: string;
  price: string;
  discount: string;
  description: string;
  indications: string;
  contraindications: string;
  dosage: string;
  storage: string;
  manufacturer: string;
  barcode: string;
  requiresPrescription: boolean;
  photo?: File | null;
  photoUrl?: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const UploadForm: React.FC<UploadFormProps> = ({ category, onSuccess }) => {
  const { user } = useUser();
  const categoryConfig = categories[category];

  const [formData, setFormData] = useState<FormData>({
    name: "",
    strength: "",
    expiryDate: "",
    quantity: "",
    supplier: "",
    location_name: "",
    specificLocation: "",
    batchNumber: "",
    price: "",
    discount: "",
    description: "",
    indications: "",
    contraindications: "",
    dosage: "",
    storage: "",
    manufacturer: "",
    barcode: "",
    requiresPrescription: false,
    photo: null,
    photoUrl: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));

      if (errors[name as keyof FormData]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, photo: file, photoUrl: undefined }));

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null, photoUrl: undefined }));
    setPreviewUrl(null);
  };

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.location_name.trim()) newErrors.location_name = "Location name is required";

    // Always require expiry date (no category check)
    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    }

    if (!formData.quantity || isNaN(Number(formData.quantity)))
      newErrors.quantity = "Quantity must be a number";

    if (categoryConfig.showPriceField && (!formData.price || isNaN(Number(formData.price))))
      newErrors.price = "Price must be a number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, categoryConfig]);

  // ✅ Get or create location (matches your table structure)
  const getOrCreateLocation = async (locationName: string): Promise<string> => {
    if (!user?.company_id) throw new Error("Company ID missing");

    const trimmedName = locationName.trim();
    if (!trimmedName) throw new Error("Location name cannot be empty");

    // Try to find existing location for this company
    const { data: existing, error: findError } = await supabaseAdmin
      .from("locations")
      .select("id")
      .eq("name", trimmedName)
      .eq("company_id", user.company_id)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") throw findError; // PGRST116 = no rows

    if (existing) return existing.id;

    // Create new location (only set name and company_id; city/region/country remain NULL)
    const { data: newLocation, error: insertError } = await supabaseAdmin
      .from("locations")
      .insert({ name: trimmedName, company_id: user.company_id })
      .select("id")
      .single();

    if (insertError) throw insertError;
    return newLocation.id;
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36)}.${fileExt}`;
    const filePath = `${user?.company_id}/${fileName}`;

    const { error } = await supabaseAdmin.storage.from("product-photos").upload(filePath, file);
    if (error) throw error;

    const { data } = supabaseAdmin.storage.from("product-photos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setIsSubmitting(true);

    try {
      const locationId = await getOrCreateLocation(formData.location_name);

      let photoUrl = formData.photoUrl;
      if (formData.photo) photoUrl = await uploadPhoto(formData.photo);

      const daysLeft = formData.expiryDate ? calculateDaysLeft(formData.expiryDate) : null;
      const statusColor = daysLeft !== null ? getStatusColor(daysLeft) : null;
      const autoDiscount =
        categoryConfig.discountAuto && daysLeft !== null
          ? calculateAutoDiscount(formData.expiryDate)
          : null;

      const productData = {
        name: formData.name,
        strength: formData.strength || null,
        expiry_date: formData.expiryDate || null,
        quantity: Number(formData.quantity),
        supplier: formData.supplier || null,
        location_id: locationId,
        specific_location: formData.specificLocation || null,
        batch_number: formData.batchNumber || null,
        price: formData.price ? Number(formData.price) : null,
        discount: formData.discount ? Number(formData.discount) : autoDiscount || null,
        category,
        company_id: user.company_id,
        uploaded_by: user.id,
        photo_url: photoUrl || null,
        description: formData.description || null,
        indications: formData.indications || null,
        contraindications: formData.contraindications || null,
        dosage: formData.dosage || null,
        storage: formData.storage || null,
        manufacturer: formData.manufacturer || null,
        barcode: formData.barcode || null,
        requires_prescription: formData.requiresPrescription,
        status: "pending",
        days_left: daysLeft,
        status_color: statusColor,
      };

      const { error } = await supabaseAdmin.from("products").insert(productData);
      if (error) throw error;

      onSuccess(formData.name);

      // Reset form
      setFormData({
        name: "",
        strength: "",
        expiryDate: "",
        quantity: "",
        supplier: "",
        location_name: "",
        specificLocation: "",
        batchNumber: "",
        price: "",
        discount: "",
        description: "",
        indications: "",
        contraindications: "",
        dosage: "",
        storage: "",
        manufacturer: "",
        barcode: "",
        requiresPrescription: false,
        photo: null,
        photoUrl: "",
      });
      setPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h2>Upload {categoryConfig.label}</h2>

      <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" />
      {errors.name && <span className="error">{errors.name}</span>}

      <input name="strength" value={formData.strength} onChange={handleChange} placeholder="Strength/Dosage" />

      <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" />
      {errors.quantity && <span className="error">{errors.quantity}</span>}

      {categoryConfig.showPriceField && (
        <>
          <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Unit Price" />
          {errors.price && <span className="error">{errors.price}</span>}
        </>
      )}

      {/* Always show expiry date field */}
      <input
        name="expiryDate"
        type="date"
        value={formData.expiryDate}
        onChange={handleChange}
      />
      {errors.expiryDate && <span className="error">{errors.expiryDate}</span>}

      {categoryConfig.supplierRequired && (
        <input name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Supplier" />
      )}

      {categoryConfig.requireBatchNumber && (
        <input name="batchNumber" value={formData.batchNumber} onChange={handleChange} placeholder="Batch Number" />
      )}

      <label>
        Location Name
        <input
          type="text"
          name="location_name"
          value={formData.location_name}
          onChange={handleChange}
          placeholder="e.g., Bole, Mexico Square, etc."
        />
      </label>
      {errors.location_name && <span className="error">{errors.location_name}</span>}

      <label>
        Specific Place / Landmark
        <input
          type="text"
          name="specificLocation"
          value={formData.specificLocation}
          onChange={handleChange}
          placeholder="e.g., in front of XYZ building"
        />
      </label>

      {categoryConfig.photoRequired && (
        <div>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {previewUrl && (
            <div>
              <img src={previewUrl} alt="Preview" style={{ maxWidth: 200 }} />
              <button type="button" onClick={handleRemovePhoto}>Remove</button>
            </div>
          )}
        </div>
      )}

      <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
      <textarea name="indications" value={formData.indications} onChange={handleChange} placeholder="Indications" />
      <textarea name="contraindications" value={formData.contraindications} onChange={handleChange} placeholder="Contraindications" />
      <textarea name="dosage" value={formData.dosage} onChange={handleChange} placeholder="Dosage" />
      <textarea name="storage" value={formData.storage} onChange={handleChange} placeholder="Storage Instructions" />
      <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} placeholder="Manufacturer" />
      <input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Barcode" />

      <label>
        <input
          type="checkbox"
          name="requiresPrescription"
          checked={formData.requiresPrescription}
          onChange={handleChange}
        />
        Requires Prescription
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Submit"}
      </button>
    </form>
  );
};

export default UploadForm;