import { useState, useCallback } from 'react';
import { useOffline } from './useOffline';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface Expense {
  id?: string;
  user_id: string;
  claim_id?: string | null;
  category_id?: string | null;
  date: string;
  description: string;
  location?: string;
  amount: number;
  image_url?: string | null;
  filed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useOfflineExpenses = () => {
  const { db, isOnline } = useOffline();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const addExpense = useCallback(async (expense: Expense) => {
    if (!db || !user) throw new Error('Database not available or user not authenticated');

    setLoading(true);
    try {
      const expenseId = expense.id || crypto.randomUUID();
      const now = new Date().toISOString();

      const fullExpense = {
        ...expense,
        id: expenseId,
        user_id: user.id,
        created_at: now,
        updated_at: now,
        _pending_upload: !isOnline,
        _synced: false
      };

      if (isOnline) {
        // Try to save directly to Supabase first
        try {
          const { data, error } = await supabase
            .from('expenses')
            .insert({
              id: expenseId,
              user_id: user.id,
              claim_id: expense.claim_id || null,
              category_id: expense.category_id || null,
              date: expense.date,
              description: expense.description,
              location: expense.location || '',
              amount: expense.amount,
              image_url: expense.image_url || null,
              filed: expense.filed || false
            })
            .select()
            .single();

          if (error) throw error;

          // Also save to local database as synced
          await db.put('expenses', {
            ...fullExpense,
            _pending_upload: false,
            _synced: true
          });

          return data;
        } catch (onlineError) {
          console.warn('Online save failed, falling back to offline mode:', onlineError);
          // Fall through to offline save
        }
      }

      // Save offline
      await db.put('expenses', fullExpense);
      return fullExpense;
    } finally {
      setLoading(false);
    }
  }, [db, user, isOnline]);

  const getExpenses = useCallback(async () => {
    if (!db || !user) return [];

    try {
      const expenses = await db.getAll('expenses', 'user_id', user.id);
      return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }, [db, user]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    if (!db || !user) throw new Error('Database not available or user not authenticated');

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const currentExpense = await db.get('expenses', id);
      
      if (!currentExpense) {
        throw new Error('Expense not found');
      }

      const updatedExpense = {
        ...currentExpense,
        ...updates,
        updated_at: now,
        _pending_upload: !isOnline,
        _synced: false
      };

      if (isOnline) {
        try {
          const { error } = await supabase
            .from('expenses')
            .update({
              ...updates,
              updated_at: now
            })
            .eq('id', id);

          if (error) throw error;

          // Update local database as synced
          updatedExpense._pending_upload = false;
          updatedExpense._synced = true;
        } catch (onlineError) {
          console.warn('Online update failed, saving offline:', onlineError);
        }
      }

      await db.put('expenses', updatedExpense);
    } finally {
      setLoading(false);
    }
  }, [db, user, isOnline]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!db || !user) throw new Error('Database not available or user not authenticated');

    setLoading(true);
    try {
      if (isOnline) {
        try {
          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (onlineError) {
          console.warn('Online delete failed:', onlineError);
        }
      }

      await db.delete('expenses', id);
    } finally {
      setLoading(false);
    }
  }, [db, user, isOnline]);

  const getPendingCount = useCallback(async () => {
    if (!db || !user) return 0;

    try {
      const pending = await db.getAll('expenses', '_pending_upload', true);
      return pending.filter(expense => expense.user_id === user.id).length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }, [db, user]);

  return {
    addExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
    getPendingCount,
    loading,
    isOnline
  };
};