import React, { useState } from 'react';
import { Plus, Calendar, MapPin, PoundSterling, FileText, Check, Camera, Image, X, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineExpenses } from '../../hooks/useOfflineExpenses';
import { useOffline } from '../../hooks/useOffline';

interface Claim {
  id: string;
  title: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

const AddExpense: React.FC = () => {
  const { user, profile } = useAuth();
  const { addExpense, loading: offlineLoading, isOnline } = useOfflineExpenses();
  const { db } = useOffline();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [claimId, setClaimId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM format
    description: '',
    location: '',
    amount: '',
  });

  // Load claims on component mount
  React.useEffect(() => {
    if (user && db) {
      loadClaims();
      loadCategories();
    }
  }, [user, db]);

  const loadClaims = async () => {
    if (!user || !db) return;

    try {
      // Load from local database first for offline support
      const localClaims = await db.getAll('claims', 'user_id', user.id);
      setClaims(localClaims || []);

      // If online, also sync with Supabase
      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('claims')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          // Update local database with fresh data
          if (data && data.length > 0) {
            for (const claim of data) {
              await db.put('claims', claim);
            }
            setClaims(data);
          }
        } catch (onlineError) {
          console.warn('Failed to sync claims from server:', onlineError);
          // Continue with local data
        }
      }
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  const loadCategories = async () => {
    if (!user || !profile?.company_id || !db) {
      setCategories([]);
      return;
    }

    try {
      // Load from local database first
      const localCategories = await db.getAll('expense_categories', 'company_id', profile.company_id);
      setCategories(localCategories || []);

      // If online, also sync with Supabase
      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .eq('company_id', profile.company_id)
            .order('name', { ascending: true });

          if (error) throw error;
          
          // Update local database with fresh data
          if (data && data.length > 0) {
            for (const category of data) {
              await db.put('expense_categories', category);
            }
            setCategories(data);
          }
        } catch (onlineError) {
          console.warn('Failed to sync categories from server:', onlineError);
          // Continue with local data
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const MAX_SIDE = 1280;

      // Helper: promisify toBlob
      const toBlobAsync = (canvas: HTMLCanvasElement, type?: string, quality?: number) =>
        new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

      // Try to honor EXIF orientation using createImageBitmap when available
      let sourceWidth: number;
      let sourceHeight: number;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if ('createImageBitmap' in window) {
        try {
          const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
          sourceWidth = bitmap.width;
          sourceHeight = bitmap.height;
          const scale = Math.min(1, MAX_SIDE / Math.max(sourceWidth, sourceHeight));
          const width = Math.max(1, Math.round(sourceWidth * scale));
          const height = Math.max(1, Math.round(sourceHeight * scale));
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(bitmap, 0, 0, width, height);
        } catch {
          // Fallback to Image element route below
          const dataUrl = await new Promise<string>((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.readAsDataURL(file);
          });
          await new Promise<void>((resolve) => {
            const img = document.createElement('img');
            img.onload = () => {
              sourceWidth = img.width;
              sourceHeight = img.height;
              const scale = Math.min(1, MAX_SIDE / Math.max(sourceWidth, sourceHeight));
              const width = Math.max(1, Math.round(sourceWidth * scale));
              const height = Math.max(1, Math.round(sourceHeight * scale));
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              resolve();
            };
            img.src = dataUrl;
          });
        }
      } else {
        // No createImageBitmap support; use Image element
        const dataUrl = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.readAsDataURL(file);
        });
        await new Promise<void>((resolve) => {
          const img = document.createElement('img');
          img.onload = () => {
            sourceWidth = img.width;
            sourceHeight = img.height;
            const scale = Math.min(1, MAX_SIDE / Math.max(sourceWidth, sourceHeight));
            const width = Math.max(1, Math.round(sourceWidth * scale));
            const height = Math.max(1, Math.round(sourceHeight * scale));
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            resolve();
          };
          img.src = dataUrl;
        });
      }

      // Try encoding with the original type first; if it fails (e.g., HEIC), fall back to JPEG
      let outType = file.type;
      let blob = await toBlobAsync(canvas, outType, 0.95);
      if (!blob) {
        outType = 'image/jpeg';
        blob = await toBlobAsync(canvas, outType, 0.95);
      }
      if (!blob) return; // give up silently if still unsupported

      const resizedName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const resizedFile = new File([blob], resizedName, {
        type: outType,
        lastModified: Date.now(),
      });

      setImageFile(resizedFile);
      const previewUrl = URL.createObjectURL(resizedFile);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(previewUrl);
      extractReceiptData(resizedFile);
    } catch (err) {
      // Swallow errors; image is optional
      console.error('Image processing failed', err);
    }
  };

  const extractReceiptData = async (file: File) => {
    setExtracting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated. Cannot extract receipt data.');
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-receipt-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract receipt data');
      }

      const extractedData = await response.json();
      
      // Only update fields if AI extraction was confident
      if (extractedData.confidence > 0.3) {
        setFormData(prev => ({
          ...prev,
          description: extractedData.description || prev.description,
          location: extractedData.location || prev.location,
          amount: extractedData.amount ? extractedData.amount.toString() : prev.amount,
          date: extractedData.date ? new Date(extractedData.date).toISOString().slice(0, 16) : prev.date,
        }));
      }
    } catch (error) {
      console.error('Error extracting receipt data:', error);
      // Don't show error to user, just log it - receipt extraction is a nice-to-have feature
    } finally {
      setExtracting(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const uploadImage = async (file: File, expenseId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${expenseId}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // Validate form data
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      // Handle image upload for offline scenarios
      let imageUrl = null;
      if (imageFile) {
        setUploading(true);
        
        if (isOnline) {
          // Try to upload image immediately if online
          const tempId = crypto.randomUUID();
          imageUrl = await uploadImage(imageFile, tempId);
        } else {
          // Store image data locally for later upload
          const reader = new FileReader();
          const imageDataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(imageFile);
          });
          
          // Store base64 image temporarily (in real app, you'd use IndexedDB or similar)
          imageUrl = imageDataUrl;
        }
        setUploading(false);
      }

      // Use offline-aware expense creation
      await addExpense({
        user_id: user!.id,
        date: formData.date,
        description: formData.description,
        location: formData.location,
        amount: parseFloat(formData.amount),
        claim_id: claimId || null,
        category_id: categoryId || null,
        image_url: imageUrl,
        filed: false,
      });

      setSuccess(true);
      setFormData({
        date: new Date().toISOString().slice(0, 16),
        description: '',
        location: '',
        amount: '',
      });
      setClaimId('');
      setCategoryId('');
      setImageFile(null);
      setImagePreview(null);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Expense</h1>
        <p className="text-gray-600">
          Record your business expenses quickly and easily.
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <span className="text-green-800">
              Expense added successfully!
            </span>
            {!isOnline && (
              <p className="text-green-700 text-sm mt-1">
                💾 Saved offline - will sync when connection is restored
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div>
            <label htmlFor="date" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 mr-2" />
              Date and Time
            </label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select the date and time when the expense occurred
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 mr-2" />
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="What was this expense for?"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a clear description of what this expense was for
            </p>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              Location (Optional)
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Where did this expense occur?"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add location details for better tracking
            </p>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <PoundSterling className="h-4 w-4 mr-2" />
              Cost
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">£</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the total cost of the expense
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor="category" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 mr-2" />
              Category (Optional)
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Categorize this expense for better reporting and analysis
            </p>
          </div>

          {/* Claim Association */}
          <div>
            <label htmlFor="claim" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FolderOpen className="h-4 w-4 mr-2" />
              Associated Claim (Optional)
            </label>
            <select
              id="claim"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">No claim (unassociated)</option>
              {claims.map((claim) => (
                <option key={claim.id} value={claim.id}>
                  {claim.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Associate this expense with a claim for better organization
            </p>
          </div>
          {/* Image Upload */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Camera className="h-4 w-4 mr-2" />
              Receipt Image (Optional) {extracting && <span className="text-blue-600 ml-2">- Extracting data...</span>}
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Image className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">Add a photo of your receipt</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      <label className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 inline-flex items-center">
                        <Image className="h-4 w-4 mr-2" />
                        Choose from Gallery
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="max-w-full max-h-96 object-contain w-full rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Optional: Attach a photo of your receipt. AI will automatically extract expense details.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploading || extracting}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {loading || uploading || extracting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                {uploading ? 'Uploading Image...' : extracting ? 'Extracting Data...' : 'Add Expense'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;