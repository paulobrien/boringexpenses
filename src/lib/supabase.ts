import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      claims: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_categories: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          claim_id: string | null;
          category_id: string | null;
          date: string;
          description: string;
          location: string;
          amount: number;
          image_url: string | null;
          created_at: string;
          updated_at: string;
          filed: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          claim_id?: string | null;
          category_id?: string | null;
          date: string;
          description: string;
          location?: string;
          amount: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          filed?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          claim_id?: string | null;
          category_id?: string | null;
          date?: string;
          description?: string;
          location?: string;
          amount?: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          filed?: boolean;
        };
      };
    };
  };
};