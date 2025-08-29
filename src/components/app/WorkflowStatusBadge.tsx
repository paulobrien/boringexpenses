import React from 'react';
import { CheckCircle, Clock, FileCheck, XCircle, CreditCard } from 'lucide-react';
import type { ClaimStatus } from '../../lib/supabase';
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/workflow';

interface WorkflowStatusBadgeProps {
  status: ClaimStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({ 
  status, 
  showIcon = true, 
  size = 'md' 
}) => {
  const getStatusIcon = (status: ClaimStatus) => {
    const iconClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    switch (status) {
      case 'unfiled':
        return <FileCheck className={iconClass} />;
      case 'filed':
        return <CheckCircle className={iconClass} />;
      case 'processing':
        return <Clock className={iconClass} />;
      case 'approved':
        return <CheckCircle className={iconClass} />;
      case 'paid':
        return <CreditCard className={iconClass} />;
      default:
        return <XCircle className={iconClass} />;
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center space-x-1 rounded-full font-medium ${STATUS_COLORS[status]} ${sizeClasses[size]}`}>
      {showIcon && getStatusIcon(status)}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
};

export default WorkflowStatusBadge;