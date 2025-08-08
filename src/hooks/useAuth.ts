import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes including token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
          // Create profile asynchronously without blocking
          if (session?.user) {
            Promise.resolve(supabase.from('profiles').upsert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || '',
            })).catch(console.error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
        } else {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Add session validation helper
  const validateSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await supabase.auth.signOut();
        setUser(null);
        return false;
      }
      
      // Check if token is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          await supabase.auth.signOut();
          setUser(null);
          return false;
        }
        
        setUser(refreshedSession.user);
      }
      
      return !!session;
    } catch (error) {
      await supabase.auth.signOut();
      setUser(null);
      return false;
    }
  };
  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
    }
    return { error };
  };

  return {
    user,
    loading,
    validateSession,
    signInWithEmail,
    verifyOtp,
    signOut,
  };
}