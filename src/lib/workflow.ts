import { supabase } from './supabase';
import type { ClaimStatus } from './supabase';

export const CLAIM_STATUSES: ClaimStatus[] = ['unfiled', 'filed', 'processing', 'approved', 'paid'];

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  'unfiled': 'Not Filed',
  'filed': 'Filed',
  'processing': 'Under Review',
  'approved': 'Approved',
  'paid': 'Paid'
};

export const STATUS_COLORS: Record<ClaimStatus, string> = {
  'unfiled': 'bg-gray-100 text-gray-800',
  'filed': 'bg-blue-100 text-blue-800',
  'processing': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-green-100 text-green-800',
  'paid': 'bg-purple-100 text-purple-800'
};

export const getNextAllowedStatuses = (
  currentStatus: ClaimStatus,
  userRole: 'employee' | 'manager' | 'admin',
  isOwner: boolean,
  isManager: boolean
): ClaimStatus[] => {
  if (userRole === 'employee' && !isManager) {
    // Employees can only change their own unfiled claims
    if (isOwner && currentStatus === 'unfiled') {
      return ['unfiled', 'filed'];
    }
    return [];
  }

  if (userRole === 'manager' && isManager) {
    // Managers can change filed/processing claims to processing/approved
    if (currentStatus === 'filed' || currentStatus === 'processing') {
      return ['processing', 'approved'];
    }
    return [];
  }

  if (userRole === 'admin') {
    // Admins can change any status except from paid
    if (currentStatus === 'paid') {
      return ['paid']; // Can't change from paid
    }
    return CLAIM_STATUSES;
  }

  return [];
};

export const canEditClaim = (
  status: ClaimStatus,
  userRole: 'employee' | 'manager' | 'admin',
  isOwner: boolean
): boolean => {
  // Only owners can edit unfiled claims
  if (status === 'unfiled' && isOwner) {
    return true;
  }
  
  // No one can edit claims that are processing, approved, or paid
  if (['processing', 'approved', 'paid'].includes(status)) {
    return false;
  }
  
  // Admins can edit filed claims
  if (status === 'filed' && userRole === 'admin') {
    return true;
  }
  
  return false;
};

export const sendWorkflowNotification = async (
  claimId: string,
  status: ClaimStatus,
  userEmail: string,
  userName: string,
  claimTitle: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-workflow-notification', {
      body: {
        claim_id: claimId,
        status: status,
        user_email: userEmail,
        user_name: userName,
        claim_title: claimTitle
      }
    });

    if (error) {
      console.error('Error sending workflow notification:', error);
      return false;
    }

    console.log('Workflow notification sent:', data);
    return true;
  } catch (error) {
    console.error('Error invoking notification function:', error);
    return false;
  }
};

export const processPayment = async (
  claimId: string,
  amount: number,
  currency: string,
  userEmail: string,
  userName: string,
  claimTitle: string,
  bankDetails?: any
) => {
  try {
    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: {
        claim_id: claimId,
        amount: amount,
        currency: currency,
        user_email: userEmail,
        user_name: userName,
        claim_title: claimTitle,
        bank_details: bankDetails
      }
    });

    if (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error invoking payment function:', error);
    return { success: false, error: error.message };
  }
};

export const updateClaimStatus = async (
  claimId: string,
  newStatus: ClaimStatus,
  userId: string
) => {
  try {
    const updates: any = {
      status: newStatus,
      approved_by: userId,
      approved_at: new Date().toISOString()
    };

    // If setting to unfiled, clear approval fields
    if (newStatus === 'unfiled') {
      updates.approved_by = null;
      updates.approved_at = null;
    }

    const { data, error } = await supabase
      .from('claims')
      .update(updates)
      .eq('id', claimId)
      .select('*, user:profiles!user_id(full_name, id)')
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating claim status:', error);
    return { success: false, error: error.message };
  }
};