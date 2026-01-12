import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Missing Supabase environment variables! Check .env file.");
  // We do not throw here to prevent white-screen. Components will fail gracefully or show errors.
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Helper to get the current session asynchronously
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

/**
 * Helper to get the company ID of the logged-in user.
 * Currently returns the user ID as a fallback since the exact schema for company_id is not defined.
 */
export const getUserCompanyId = async () => {
  const session = await getSession();
  if (!session?.user) return null;

  // 1. Check user metadata (set during onboarding/login)
  if (session.user.user_metadata?.company_id) {
    return session.user.user_metadata.company_id;
  }

  // 2. Check memberships table (more reliable than fallback)
  const { data: membership } = await supabase
    .from('memberships')
    .select('company_id')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();

  if (membership?.company_id) {
    return membership.company_id;
  }

  // 3. Fallback to user.id (Legacy/Compat)
  return session.user.id;
};
