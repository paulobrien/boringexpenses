import React, { useState, useEffect } from 'react';
import { Receipt, Edit3, Trash2, MapPin, Calendar, PoundSterling, Search, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import EditExpenseModal from './EditExpenseModal';

interface Expense {
  id: string;
  date: string;
  description: string;
  location: string;
  amount: number;
  image_url: string | null;
  created_at: string;
}

const ViewExpenses: React.FC = () => {
  const { user, validateSession } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      loadExpenses();
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

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Expenses</h1>
        <p className="text-gray-600">
          View and manage all your recorded expenses.
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
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1 space-y-2 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {expense.description}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                  <div className="text-xl font-bold text-gray-900">
                    {formatAmount(expense.amount)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit expense"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={() => {
            loadExpenses();
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
};

export default ViewExpenses;