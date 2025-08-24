import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle, Clock, CreditCard } from 'lucide-react';
import type { ClaimStatus } from '../../lib/supabase';
import { getNextAllowedStatuses, updateClaimStatus, sendWorkflowNotification, processPayment } from '../../lib/workflow';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import { useAuth } from '../../hooks/useAuth';

interface Claim {
  id: string;
  title: string;
  description: string;
  status: ClaimStatus;
  user?: {
    id: string;
    full_name: string;
  };
}

interface ClaimApprovalModalProps {
  claim: Claim;
  onClose: () => void;
  onStatusUpdate: () => void;
}

const ClaimApprovalModal: React.FC<ClaimApprovalModalProps> = ({
  claim,
  onClose,
  onStatusUpdate
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus>(claim.status);
  const [comment, setComment] = useState('');

  if (!profile) return null;

  const allowedStatuses = getNextAllowedStatuses(
    claim.status,
    profile.role,
    claim.user?.id === profile.id,
    true // Assume manager relationship for now
  );

  const handleStatusUpdate = async () => {
    if (selectedStatus === claim.status) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const result = await updateClaimStatus(claim.id, selectedStatus, profile.id);
      
      if (!result.success) {
        alert('Error updating claim status: ' + result.error);
        return;
      }

      // Send notification
      if (claim.user) {
        await sendWorkflowNotification(
          claim.id,
          selectedStatus,
          `${claim.user.full_name}@example.com`, // Placeholder email
          claim.user.full_name,
          claim.title
        );
      }

      // Process payment if status is set to paid
      if (selectedStatus === 'paid') {
        // This would normally get total amount from expenses in the claim
        // For now, using placeholder values
        await processPayment(
          claim.id,
          100.00, // Placeholder amount
          'GBP',
          `${claim.user?.full_name}@example.com` || '',
          claim.user?.full_name || '',
          claim.title
        );
      }

      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating claim status:', error);
      alert('Error updating claim status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowSteps = () => {
    const allSteps: ClaimStatus[] = ['unfiled', 'filed', 'processing', 'approved', 'paid'];
    const currentIndex = allSteps.indexOf(claim.status);
    
    return allSteps.map((step, index) => ({
      status: step,
      isActive: index <= currentIndex,
      isCurrent: step === claim.status,
      isNext: index === currentIndex + 1
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Approve Claim</h2>
                <p className="text-gray-600">{claim.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Workflow Progress */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Progress</h3>
            <div className="flex items-center justify-between">
              {getWorkflowSteps().map((step, index) => (
                <React.Fragment key={step.status}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.isActive 
                        ? step.isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.status === 'unfiled' && <Clock className="h-5 w-5" />}
                      {step.status === 'filed' && <CheckCircle className="h-5 w-5" />}
                      {step.status === 'processing' && <Clock className="h-5 w-5" />}
                      {step.status === 'approved' && <CheckCircle className="h-5 w-5" />}
                      {step.status === 'paid' && <CreditCard className="h-5 w-5" />}
                    </div>
                    <WorkflowStatusBadge status={step.status} showIcon={false} size="sm" />
                  </div>
                  {index < getWorkflowSteps().length - 1 && (
                    <ArrowRight className={`h-4 w-4 ${step.isActive ? 'text-green-600' : 'text-gray-300'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Update Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              {allowedStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`p-3 rounded-lg border text-left transition-colors duration-200 ${
                    selectedStatus === status
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <WorkflowStatusBadge status={status} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a comment about this status change..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusUpdate}
              disabled={loading || selectedStatus === claim.status}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <Clock className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimApprovalModal;