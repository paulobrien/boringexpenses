import React, { useState, useEffect } from 'react';
import { Receipt, Edit3, Trash2, MapPin, Calendar, PoundSterling, Search, Image, Download, FileCheck, FileX, Plus, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import EditExpenseModal from './EditExpenseModal';
import ClaimModal from './ClaimModal';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

interface Expense {
  id: string;
  claim_id: string | null;
  category_id: string | null;
  date: string;
  description: string;
  location: string;
  amount: number;
  image_url: string | null;
  filed: boolean;
  created_at: string;
  filed: boolean;
}

interface Claim {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

const ViewExpenses: React.FC = () => {
  const { user, profile, validateSession } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadExpenses();
      loadClaims();
      loadCategories();
    }
  }, [user]);

  const getSignedImageUrl = async (imagePath: string): Promise<string | null> => {
    try {
      // Extract the path from the full URL if it's a full URL
      const path = imagePath.includes('supabase.co') 
        ? imagePath.split('/images/')[1] 
        : imagePath;
      
      const { data, error } = await supabase.storage
        .from('images')
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  };
  const loadExpenses = async () => {
    const isValidSession = await validateSession();
    if (!isValidSession || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      
      // Load signed URLs for images
      const urlPromises: Record<string, Promise<string | null>> = {};
      data?.forEach(expense => {
        if (expense.image_url) {
          urlPromises[expense.id] = getSignedImageUrl(expense.image_url);
        }
      });
      
      const resolvedUrls: Record<string, string> = {};
      for (const [expenseId, promise] of Object.entries(urlPromises)) {
        const url = await promise;
        if (url) {
          resolvedUrls[expenseId] = url;
        }
      }
      setImageUrls(resolvedUrls);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    const isValidSession = await validateSession();
    if (!isValidSession || !user) return;

    try {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  const loadCategories = async () => {
    const isValidSession = await validateSession();
    if (!isValidSession || !user || !profile?.company_id) {
      setCategories([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExpenses(expenses.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense. Please try again.');
    }
  };

  const deleteClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to delete this claim? All expenses in this claim will become unassociated.')) return;

    try {
      const { error } = await supabase
        .from('claims')
        .delete()
        .eq('id', claimId);

      if (error) throw error;
      
      setClaims(claims.filter(claim => claim.id !== claimId));
      // Reload expenses to reflect unassociated status
      loadExpenses();
    } catch (error) {
      console.error('Error deleting claim:', error);
      alert('Error deleting claim. Please try again.');
    }
  };
  const toggleFiledStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ filed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setExpenses(expenses.map(expense => 
        expense.id === id ? { ...expense, filed: !currentStatus } : expense
      ));
    } catch (error) {
      console.error('Error updating filed status:', error);
      alert('Error updating filed status. Please try again.');
    }
  };

  const toggleClaimExpansion = (claimId: string) => {
    const newExpanded = new Set(expandedClaims);
    if (newExpanded.has(claimId)) {
      newExpanded.delete(claimId);
    } else {
      newExpanded.add(claimId);
    }
    setExpandedClaims(newExpanded);
  };
  const downloadExpensesAsZip = async () => {
    if (filteredExpenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    setExporting(true);

    try {
      const zip = new JSZip();
      
      // Prepare Excel data
      const excelData = [];
      const imagePromises: Promise<void>[] = [];
      
      // Add header row
      excelData.push([
        'Date',
        'Description', 
        'Category',
        'Location',
        'Amount (£)',
        'Claim',
        'Filed',
        'Image Filename',
        'Created At'
      ]);

      // Process each expense
      filteredExpenses.forEach((expense, index) => {
        const imageFilename = expense.image_url ? `expense_${expense.id}.jpg` : '';
        const claimTitle = expense.claim_id 
          ? claims.find(c => c.id === expense.claim_id)?.title || 'Unknown Claim'
          : 'Unassociated';
        const categoryName = getCategoryName(expense.category_id) || '';
        
        excelData.push([
          new Date(expense.date).toLocaleString('en-GB'),
          expense.description,
          categoryName,
          expense.location || '',
          expense.amount,
          claimTitle,
          expense.filed ? 'Yes' : 'No',
          imageFilename,
          new Date(expense.created_at).toLocaleString('en-GB')
        ]);

        // Download image if exists
        if (expense.image_url) {
          const imagePromise = downloadAndAddImageToZip(
            zip, 
            expense.image_url, 
            imageFilename
          );
          imagePromises.push(imagePromise);
        }
      });

      // Create Excel file
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // Date
        { wch: 30 }, // Description
        { wch: 20 }, // Category
        { wch: 25 }, // Location
        { wch: 12 }, // Amount
        { wch: 20 }, // Claim
        { wch: 8 },  // Filed
        { wch: 25 }, // Image Filename
        { wch: 20 }  // Created At
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
      
      // Generate Excel file as array buffer
      const excelBuffer = XLSX.write(workbook, { 
        type: 'array', 
        bookType: 'xlsx' 
      });
      
      // Add Excel file to ZIP
      zip.file('expenses.xlsx', excelBuffer);

      // Wait for all images to download
      await Promise.all(imagePromises);

      // Generate ZIP file
      const zipContent = await zip.generateAsync({ type: 'blob' });

      // Download ZIP file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipContent);
      link.download = `expenses_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error exporting expenses:', error);
      alert('Error exporting expenses. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const downloadAndAddImageToZip = async (
    zip: JSZip, 
    imageUrl: string, 
    filename: string
  ): Promise<void> => {
    try {
      // Get signed URL if needed
      let downloadUrl = imageUrl;
      if (imageUrl.includes('supabase.co') && !imageUrl.includes('token=')) {
        const path = imageUrl.split('/images/')[1];
        const { data, error } = await supabase.storage
          .from('images')
          .createSignedUrl(path, 3600);
        
        if (!error && data) {
          downloadUrl = data.signedUrl;
        }
      }

      const response = await fetch(downloadUrl);
      if (response.ok) {
        const imageBlob = await response.blob();
        zip.file(`images/${filename}`, imageBlob);
      }
    } catch (error) {
      console.error(`Error downloading image ${filename}:`, error);
      // Continue with other images even if one fails
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unassociatedExpenses = filteredExpenses.filter(expense => !expense.claim_id);
  const getClaimExpenses = (claimId: string) => 
    filteredExpenses.filter(expense => expense.claim_id === claimId);
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderExpenseCard = (expense: Expense) => (
    <div key={expense.id} className={`rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 ml-0 ${
      expense.filed 
        ? 'bg-gray-50 opacity-60' 
        : 'bg-white'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${
              expense.filed ? 'text-gray-500' : 'text-gray-900'
            }`}>
              {expense.description}
            </h3>
            {expense.category_id && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                expense.filed 
                  ? 'bg-gray-200 text-gray-500' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {getCategoryName(expense.category_id)}
              </span>
            )}
            {expense.filed && (
              <div className="flex items-center text-green-600 text-sm bg-green-100 px-2 py-1 rounded-full">
                <FileCheck className="h-3 w-3 mr-1" />
                Filed
              </div>
            )}
          </div>
          <div className={`flex flex-wrap items-center gap-4 text-sm ${
            expense.filed ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(expense.date)}
            </div>
            {expense.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {expense.location}
              </div>
            )}
          </div>
        </div>
        
        {/* Image Preview */}
        {expense.image_url && (
          <div className="flex-shrink-0">
            {imageUrls[expense.id] ? (
              <img
                src={imageUrls[expense.id]}
                alt="Receipt"
                className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                onClick={() => window.open(imageUrls[expense.id], '_blank')}
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between lg:justify-end gap-4 flex-shrink-0">
          <div className={`text-xl font-bold ${
            expense.filed ? 'text-gray-500' : 'text-gray-900'
          }`}>
            {formatAmount(expense.amount)}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleFiledStatus(expense.id, expense.filed)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                expense.filed 
                  ? 'text-green-600 hover:bg-green-50' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={expense.filed ? 'Mark as not filed' : 'Mark as filed'}
            >
              {expense.filed ? <FileCheck className="h-4 w-4" /> : <FileX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setEditingExpense(expense)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                expense.filed 
                  ? 'text-blue-400 hover:bg-blue-25' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="Edit expense"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteExpense(expense.id)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                expense.filed 
                  ? 'text-red-400 hover:bg-red-25' 
                  : 'text-red-600 hover:bg-red-50'
              }`}
              title="Delete expense"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Expenses</h1>
          </div>
          <button
            onClick={() => setShowClaimModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Claim
          </button>
        </div>
        <p className="text-gray-600">
          View and manage all your recorded expenses organized by claims.
        </p>
      </div>

      {/* Search and Stats */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={downloadExpensesAsZip}
              disabled={exporting || filteredExpenses.length === 0}
              className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exporting ? 'Exporting...' : 'Export All'}
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{filteredExpenses.length}</p>
              <p className="text-sm text-gray-600">Expenses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{formatAmount(totalAmount)}</p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
          </div>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No expenses found' : 'No expenses yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms.' 
              : 'Start by adding your first expense.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Claims */}
          {claims.map((claim) => {
            const claimExpenses = getClaimExpenses(claim.id);
            const claimTotal = claimExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            const isExpanded = expandedClaims.has(claim.id);
            
            return (
              <div key={claim.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => toggleClaimExpansion(claim.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{claim.title}</h2>
                        {claim.description && (
                          <p className="text-gray-600 text-sm">{claim.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{claimExpenses.length}</p>
                        <p className="text-xs text-gray-600">Expenses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{formatAmount(claimTotal)}</p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingClaim(claim)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit claim"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteClaim(claim.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete claim"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && claimExpenses.length > 0 && (
                  <div className="border-t border-gray-100 p-6 pt-4 bg-gray-50 space-y-4">
                    {claimExpenses.map(renderExpenseCard)}
                  </div>
                )}
                
                {isExpanded && claimExpenses.length === 0 && (
                  <div className="border-t border-gray-100 p-6 pt-4 bg-gray-50 text-center text-gray-500">
                    No expenses in this claim yet
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Unassociated Expenses */}
          {unassociatedExpenses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Receipt className="h-5 w-5 text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-900">Unassociated Expenses</h2>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{unassociatedExpenses.length}</p>
                      <p className="text-xs text-gray-600">Expenses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {formatAmount(unassociatedExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
                      </p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 space-y-4">
                {unassociatedExpenses.map(renderExpenseCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          claims={claims}
          categories={categories}
          onClose={() => setEditingExpense(null)}
          onSave={() => {
            loadExpenses();
            setEditingExpense(null);
          }}
        />
      )}

      {(showClaimModal || editingClaim) && (
        <ClaimModal
          claim={editingClaim}
          onClose={() => {
            setShowClaimModal(false);
            setEditingClaim(null);
          }}
          onSave={() => {
            loadClaims();
            setShowClaimModal(false);
            setEditingClaim(null);
          }}
        />
      )}
    </div>
  );
};

export default ViewExpenses;