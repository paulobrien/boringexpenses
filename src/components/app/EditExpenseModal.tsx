import React, { useState } from 'react';
import { X, Save, Calendar, MapPin, DollarSign, FileText, Camera, Image, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrencyByCode } from '../../lib/currencies';
import CurrencySelector from '../common/CurrencySelector';

interface Expense {
  id: string;
  claim_id: string | null;
  category_id: string | null;
  date: string;
  description: string;
  location: string;
  amount: number;
  currency: string;
  image_url: string | null;
}

interface Claim {
  id: string;
  title: string;
  description: string;
}
interface Category {
  id: string;
  name: string;
}

interface EditExpenseModalProps {
  expense: Expense;
  claims: Claim[];
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
  initialImagePreviewUrl?: string | null;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  claims,
  categories,
  onClose,
  onSave,
  initialImagePreviewUrl,
}) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialImagePreviewUrl || expense.image_url
  );
  const [uploading, setUploading] = useState(false);
  const [claimId, setClaimId] = useState<string>(expense.claim_id || '');
  const [categoryId, setCategoryId] = useState<string>(expense.category_id || '');
  const [currency, setCurrency] = useState<string>(expense.currency || 'GBP');
  const [formData, setFormData] = useState({
    date: new Date(expense.date).toISOString().slice(0, 16),
    description: expense.description,
    location: expense.location,
    amount: expense.amount.toString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${expense.id}.${fileExt}`;
      const filePath = `${expense.id.split('-')[0]}/${fileName}`; // Use first part of expense ID as user folder

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = expense.image_url;
      if (imageFile) {
        setUploading(true);
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
        setUploading(false);
      } else if (imagePreview === null) {
        imageUrl = null;
      }

      const { error } = await supabase
        .from('expenses')
        .update({
          date: formData.date,
          description: formData.description,
          location: formData.location,
          amount: parseFloat(formData.amount),
          currency: currency,
          claim_id: claimId || null,
          category_id: categoryId || null,
          image_url: imageUrl,
        })
        .eq('id', expense.id);

      if (error) throw error;
      onSave();
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error updating expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Expense</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

            {/* Currency Selection */}
            <CurrencySelector
              selectedCurrency={currency}
              onCurrencyChange={setCurrency}
              label="Currency"
            />

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 mr-2" />
                Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">{getCurrencyByCode(currency)?.symbol || currency}</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
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
                Receipt Image (Optional)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 mb-2 text-sm">Add a photo of your receipt</p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center text-sm">
                          <Camera className="h-4 w-4 mr-1" />
                          Take Photo
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                        <label className="cursor-pointer bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 inline-flex items-center text-sm">
                          <Image className="h-4 w-4 mr-1" />
                          Choose File
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
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
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
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                {loading || uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;