import React, { useState } from 'react';
import { Plus, Calendar, MapPin, FileText, Check, Camera, Image, X, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

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
  const { user, validateSession } = useAuth();
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
    date: new Date().toISOString().slice(0, 16),
    description: '',
    location: '',
    amount: '',
  });

  React.useEffect(() => {
    if (user) {
      loadClaims();
      loadCategories();
    }
  }, [user]);

  const loadClaims = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('claims').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('expense_categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
      extractReceiptData(file);
    }
  };

  const extractReceiptData = async (file: File) => {
    setExtracting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-receipt-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract receipt data');
      }
      const extractedData = await response.json();
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
    } finally {
      setExtracting(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File, expenseId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${expenseId}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValidSession = await validateSession();
    if (!isValidSession || !user) {
      setError('User not authenticated. Please refresh and try again.');
      return;
    }
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.amount || parseFloat(formData.amount) <= 0) throw new Error('Amount must be greater than 0');
      
      const { data, error } = await supabase.from('expenses').insert({
        user_id: user.id,
        date: formData.date,
        description: formData.description,
        location: formData.location,
        amount: parseFloat(formData.amount),
        claim_id: claimId || null,
        category_id: categoryId || null,
        filed: false,
      }).select().single();
      if (error) throw error;

      if (imageFile && data) {
        setUploading(true);
        const imageUrl = await uploadImage(imageFile, data.id);
        if (imageUrl) {
          const { error: updateError } = await supabase.from('expenses').update({ image_url: imageUrl }).eq('id', data.id);
          if (updateError) console.error('Error updating expense with image:', updateError);
        }
        setUploading(false);
      }

      setSuccess(true);
      setFormData({ date: new Date().toISOString().slice(0, 16), description: '', location: '', amount: '' });
      setClaimId('');
      setCategoryId('');
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tighter">Add New Expense</h1>
        <p className="text-text-secondary">Record your business expenses quickly and easily.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center">
          <Check className="h-5 w-5 text-success mr-2" />
          <span className="text-success">Expense added successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center">
          <span className="text-error">{error}</span>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl shadow-lg p-8 border border-gray-300/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fields */}
          {[
            { id: 'date', label: 'Date and Time', icon: Calendar, type: 'datetime-local', required: true, placeholder: '' },
            { id: 'description', label: 'Description', icon: FileText, type: 'textarea', required: true, placeholder: 'What was this expense for?' },
            { id: 'location', label: 'Location (Optional)', icon: MapPin, type: 'text', required: false, placeholder: 'Where did this expense occur?' },
            { id: 'amount', label: 'Cost', icon: () => <span className="font-bold">£</span>, type: 'number', required: true, placeholder: '0.00' }
          ].map(field => (
            <div key={field.id}>
              <label htmlFor={field.id} className="flex items-center text-sm font-medium text-text-secondary mb-2">
                <field.icon className="h-4 w-4 mr-2" />
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea id={field.id} name={field.id} value={formData[field.id]} onChange={handleChange} rows={3} placeholder={field.placeholder} required={field.required} className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200" />
              ) : (
                <div className="relative">
                  {field.id === 'amount' && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary"><field.icon /></div>}
                  <input type={field.type} id={field.id} name={field.id} value={formData[field.id]} onChange={handleChange} required={field.required} placeholder={field.placeholder} step={field.id === 'amount' ? '0.01' : undefined} min={field.id === 'amount' ? '0' : undefined} className={`w-full ${field.id === 'amount' ? 'pl-8' : 'pl-4'} pr-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200`} />
                </div>
              )}
            </div>
          ))}

          {/* Category & Claim Selection */}
          {[
            { id: 'category', label: 'Category (Optional)', value: categoryId, setter: setCategoryId, options: categories, placeholder: 'Select a category' },
            { id: 'claim', label: 'Associated Claim (Optional)', value: claimId, setter: setClaimId, options: claims, placeholder: 'No claim (unassociated)' }
          ].map(select => (
            <div key={select.id}>
              <label htmlFor={select.id} className="flex items-center text-sm font-medium text-text-secondary mb-2">
                {select.id === 'category' ? <FileText className="h-4 w-4 mr-2" /> : <FolderOpen className="h-4 w-4 mr-2" />}
                {select.label}
              </label>
              <select id={select.id} value={select.value} onChange={(e) => select.setter(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200 appearance-none">
                <option value="">{select.placeholder}</option>
                {select.options.map(opt => <option key={opt.id} value={opt.id}>{opt.title || opt.name}</option>)}
              </select>
            </div>
          ))}

          {/* Image Upload */}
          <div>
            <label className="flex items-center text-sm font-medium text-text-secondary mb-2">
              <Camera className="h-4 w-4 mr-2" />
              Receipt Image (Optional) {extracting && <span className="text-accent ml-2">- Extracting data...</span>}
            </label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300/20 rounded-lg p-6 text-center hover:border-accent/50 transition-colors duration-200">
                <div className="space-y-4">
                  <div className="flex justify-center"><Image className="h-12 w-12 text-gray-300/50" /></div>
                  <div>
                    <p className="text-text-secondary mb-2">Add a photo of your receipt</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <label className="cursor-pointer bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity duration-200 inline-flex items-center">
                        <Camera className="h-4 w-4 mr-2" /> Take Photo
                        <input type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white/10 text-text-primary px-4 py-2 rounded-lg hover:bg-white/20 transition-colors duration-200 inline-flex items-center">
                        <Image className="h-4 w-4 mr-2" /> Choose from Gallery
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Receipt preview" className="w-full h-48 object-cover rounded-lg border border-gray-300/20" />
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-error text-white p-1 rounded-full hover:opacity-90 transition-opacity duration-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-text-secondary/70 mt-1">Optional: Attach a photo. AI will automatically extract expense details.</p>
          </div>

          <button type="submit" disabled={loading || uploading || extracting} className="w-full bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 flex items-center justify-center">
            {loading || uploading || extracting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus className="mr-2 h-5 w-5" />{uploading ? 'Uploading...' : extracting ? 'Extracting...' : 'Add Expense'}</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;