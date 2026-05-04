import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

/**
 * Hook that returns whether the current signed-in user has the is_admin flag
 * set on their public.profiles row. Returns null while loading.
 */
export function useIsAdmin(): boolean | null {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) {
      setIsAdmin(null);
      return;
    }
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(Boolean((data as { is_admin?: boolean }).is_admin));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return isAdmin;
}

/**
 * Mask a secret value for display: show only the last 4 chars.
 */
export function maskSecret(last4: string | null): string {
  if (!last4 || last4.length === 0) return '••••••••';
  return `••••••••${last4}`;
}
