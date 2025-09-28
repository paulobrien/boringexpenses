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

export type ClaimStatus = 'unfiled' | 'filed' | 'processing' | 'approved' | 'paid';
export type PlanType = 'free' | 'pro_monthly' | 'pro_annual';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

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
          role: 'employee' | 'manager' | 'admin';
          manager_id: string | null;
          plan_type: PlanType;
          subscription_status: SubscriptionStatus;
          trial_expiry: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          company_id?: string | null;
          role?: 'employee' | 'manager' | 'admin';
          manager_id?: string | null;
          plan_type?: PlanType;
          subscription_status?: SubscriptionStatus;
          trial_expiry?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          company_id?: string | null;
          role?: 'employee' | 'manager' | 'admin';
          manager_id?: string | null;
          plan_type?: PlanType;
          subscription_status?: SubscriptionStatus;
          trial_expiry?: string | null;
          stripe_customer_id?: string | null;
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
          filed: boolean;
          status: ClaimStatus;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          filed?: boolean;
          status?: ClaimStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          filed?: boolean;
          status?: ClaimStatus;
          approved_by?: string | null;
          approved_at?: string | null;
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
          currency: string;
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
          currency?: string;
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
          currency?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          filed?: boolean;
        };
      };
      invites: {
        Row: {
          id: string;
          email: string;
          company_id: string;
          invited_by_user_id: string;
          role: 'employee' | 'manager' | 'admin';
          status: 'pending' | 'accepted' | 'revoked';
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          company_id: string;
          invited_by_user_id: string;
          role?: 'employee' | 'manager' | 'admin';
          status?: 'pending' | 'accepted' | 'revoked';
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          company_id?: string;
          invited_by_user_id?: string;
          role?: 'employee' | 'manager' | 'admin';
          status?: 'pending' | 'accepted' | 'revoked';
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status: SubscriptionStatus;
          plan_type: PlanType;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status: SubscriptionStatus;
          plan_type: PlanType;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          status?: SubscriptionStatus;
          plan_type?: PlanType;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};