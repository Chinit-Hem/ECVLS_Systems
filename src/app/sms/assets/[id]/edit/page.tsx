"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Save, Loader2, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { compressImage } from '@/lib/compressImage';
import { validateAssetForm } from '@/lib/sms-validation';
import type { SmsStatus } from '@/lib/sms-types';

interface Asset {
  id: string;
  name: string;
  item_code: string;
  type: string;
  category?: string;
  quantity: number;
  location?: string;
  assigned_to?: string;
  description?: string;
  status: SmsStatus;
  image_url?: string;
}

interface FormErrors {
  [key: string]: string[];
}

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState({
    name: '',
    itemCode: '',
    type: '',
    category: '',
    quantity: 1,
    location: '',
    assignedTo: '',
    description: '',
    status: 'Available' as SmsStatus,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const isDirtyRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (assetId) {
      fetchAsset();
    }
  }, [assetId]);

  const fetchAsset = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sms/assets/${assetId}`);
      if (response.ok) {
        const data = await response.json();
        const assetData = data.data || data.asset;
        setAsset(assetData);
        setForm({
          name: assetData.name || '',
          itemCode: assetData.item_code || '',
          type: assetData.type || '',
          category: assetData.category || '',
          quantity: assetData.quantity || 1,
          location: assetData.location || '',
          assignedTo: assetData.assigned_to || '',
          description: assetData.description || '',
          status: assetData.status || 'Available',
        });
        setFieldErrors({});
      } else {
        const errData = await response.json().catch(() => ({}));
        setSubmitError(errData.error || 'Asset not found');
      }
    } catch (err) {
      setSubmitError('Failed to load asset');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  const validateForm = useCallback((formData: typeof form): FormErrors => {
    const { errors: validationErrors } = validateAssetForm(formData);
    setFieldErrors(validationErrors);
    return validationErrors;
  }, []);

  const handleInputChange = useCallback((field: string, value: string | number) => {
    isDirtyRef.current = true;
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleImageChange = useCallback(async (file: File) => {
    if (!file) return;
    setImageFile(file);
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
      setCompressedImage(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      setCompressedImage(file); // Fallback to original
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setSubmitError('Please fix form errors');
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('item_code', form.itemCode);
      formData.append('type', form.type);
      formData.append('category', form.category);
      formData.append('quantity', form.quantity.toString());
      formData.append('location', form.location || '');
      formData.append('assigned_to', form.assignedTo || '');
      formData.append('description', form.description || '');
      formData.append('status', form.status);
      if (compressedImage) {
        formData.append('image', compressedImage);
      }

      const response = await fetch(`/api/sms/assets/${assetId}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        isDirtyRef.current = false;
        router.push('/sms/assets');
        router.refresh(); // Optimistic update
      } else {
        const errData = await response.json();
        // Parse field errors if API returns them
        if (errData.errors && typeof errData.errors === 'object') {
          setFieldErrors(errData.errors);
          setSubmitError('Please fix the errors below');
        } else {
          setSubmitError(errData.error || errData.message || 'Failed to update asset');
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p>Loading asset...</p>
        </div>
      </div>
    );
  }

  if (submitError === 'Asset not found' || !asset) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Link href="/sms/assets" className="inline-flex items-center gap-2 p-2 -m-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 mb-8 font-medium transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
          Back to Assets
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-800 text-lg mb-4">{submitError}</p>
          <Link href="/sms/assets" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">
            Go to Assets List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link 
        href="/sms/assets" 
        className="inline-flex items-center gap-2 p-2 -m-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 mb-8 font-medium transition-all shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm border hover:border-slate-200"
      >
        <ArrowLeft className="w-5 h-5" />
        Assets
      </Link>
      <h1 className="text-3xl font-bold mb-8">Edit Asset</h1>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Name *</label>
          <input 
            id="name"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-200' : ''}`}
            value={form.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={saving}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {fieldErrors.name && (
            <div id="name-error" className="mt-1 flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {fieldErrors.name[0]}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="itemCode" className="block text-sm font-medium mb-2">Item Code</label>
            <input 
              id="itemCode"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.itemCode ? 'border-red-500 ring-1 ring-red-200' : ''}`}
              value={form.itemCode}
              onChange={(e) => handleInputChange('itemCode', e.target.value)}
              disabled={saving}
              aria-invalid={!!fieldErrors.itemCode}
            />
            {fieldErrors.itemCode && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.itemCode[0]}</div>
            )}
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2">Type *</label>
            <input 
              id="type"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.type ? 'border-red-500 ring-1 ring-red-200' : ''}`}
              value={form.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={saving}
              aria-invalid={!!fieldErrors.type}
            />
            {fieldErrors.type && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.type[0]}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2">Quantity</label>
            <input 
              id="quantity"
              type="number"
              min="1"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.quantity ? 'border-red-500 ring-1 ring-red-200' : ''}`}
              value={form.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              disabled={saving}
              aria-invalid={!!fieldErrors.quantity}
            />
            {fieldErrors.quantity && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.quantity[0]}</div>
            )}
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">Status</label>
            <select 
              id="status"
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.status ? 'border-red-500 ring-1 ring-red-200' : ''}`}
              value={form.status}
              onChange={(e) => handleInputChange('status', e.target.value as SmsStatus)}
              disabled={saving}
              aria-invalid={!!fieldErrors.status}
            >
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Borrowed">Borrowed</option>
            </select>
            {fieldErrors.status && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.status[0]}</div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-2">Location</label>
          <input 
            id="location"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.location ? 'border-red-500 ring-1 ring-red-200' : ''}`}
            value={form.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            disabled={saving}
          />
          {fieldErrors.location && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.location[0]}</div>
          )}
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium mb-2">Assigned To</label>
          <input 
            id="assignedTo"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.assignedTo ? 'border-red-500 ring-1 ring-red-200' : ''}`}
            value={form.assignedTo || ''}
            onChange={(e) => handleInputChange('assignedTo', e.target.value)}
            disabled={saving}
          />
          {fieldErrors.assignedTo && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.assignedTo[0]}</div>
          )}
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-2">Image</label>
          <input 
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] || null as any)}
            className="w-full p-3 border border-dashed rounded-xl hover:border-emerald-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            disabled={saving}
          />
          {(asset?.image_url || imageFile) && (
            <div className="mt-2">
              {imageFile && <p className="text-sm text-slate-600 mb-1">New image selected (will replace current)</p>}
              <img 
                src={imageFile ? URL.createObjectURL(imageFile) : asset!.image_url!} 
                alt="Preview" 
                className="w-24 h-24 object-cover rounded-xl border shadow-sm max-w-full h-auto" 
              />
            </div>
          )}
          {compressedImage && (
            <p className="text-xs text-emerald-600 mt-1">Compressed: {(compressedImage.size / 1024).toFixed(1)} KB</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
          <textarea 
            id="description"
            className={`w-full p-3 border rounded-xl h-24 resize-vertical focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${fieldErrors.description ? 'border-red-500 ring-1 ring-red-200' : ''}`}
            value={form.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={saving}
            aria-invalid={!!fieldErrors.description}
          />
          {fieldErrors.description && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</div>
          )}
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {isDirtyRef.current && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            Unsaved changes detected. Don't forget to save!
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => {
              if (isDirtyRef.current && !confirm('Discard changes?')) return;
              router.back();
            }}
            disabled={saving}
            className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 disabled:opacity-50 transition-colors flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 transition-all flex items-center gap-2 justify-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Update Asset
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

