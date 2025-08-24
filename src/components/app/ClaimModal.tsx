import React, { useState, useEffect } from 'react';
import { X, Save, FileText, FolderOpen, FileCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { ClaimStatus } from '../../lib/supabase';
import { canEditClaim } from '../../lib/workflow';
import WorkflowStatusBadge from './WorkflowStatusBadge';

interface Claim {
  id: string;
  title: string;
  description: string;
  filed?: boolean;
  status: ClaimStatus;
}

interface ClaimModalProps {
  claim?: Claim | null;
  onClose: () => void;
  onSave: () => void;
}

const ClaimModal: React.FC<ClaimModalProps> = ({ claim, onClose, onSave }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [filed, setFiled] = useState(false);
  const [status, setStatus] = useState<ClaimStatus>('unfiled');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const isEditable = !claim || canEditClaim(claim.status, profile?.role || 'employee', true);

  useEffect(() => {
    if (claim) {
      setFormData({
        title: claim.title,
        description: claim.description,
      });
      setFiled(claim.filed || false);
      setStatus(claim.status || 'unfiled');
    }
  }, [claim]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const updates: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
      };

      // Only allow status changes for unfiled claims by employees
      if (!claim || claim.status === 'unfiled') {
        updates.status = filed ? 'filed' : 'unfiled';
        updates.filed = filed;
      }

      if (claim) {
        // Update existing claim
        const { error } = await supabase
          .from('claims')
          .update(updates)
          .eq('id', claim.id);

        if (error) throw error;
      } else {
        // Create new claim
        const { error } = await supabase
          .from('claims')
          .insert({
            user_id: user.id,
            ...updates,
          });

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving claim:', error);
      alert('Error saving claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {claim ? 'Edit Claim' : 'New Claim'}
                </h2>
                {claim && <WorkflowStatusBadge status={claim.status} />}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Warning for non-editable claims */}
          {!isEditable && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                This claim cannot be edited because it is currently {claim?.status}. 
                Contact your manager or admin to change the status if needed.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 mr-2" />
                Claim Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={!isEditable}
                placeholder="e.g., Business Trip to London, Q1 Office Supplies"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                disabled={!isEditable}
                placeholder="Add any additional details about this claim..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Filed Status */}
            {isEditable && (!claim || claim.status === 'unfiled') && (
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-4">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Filing Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filed"
                      checked={!filed}
                      onChange={() => setFiled(false)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Not Filed</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filed"
                      checked={filed}
                      onChange={() => setFiled(true)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Filed</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mark claim as filed when submitted to your corporate system
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              {isEditable && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {claim ? 'Save Changes' : 'Create Claim'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClaimModal;