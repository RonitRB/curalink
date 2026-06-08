import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
// We use the service role key in the backend to bypass RLS when necessary (e.g. verifying tokens or administrative tasks)
// However, for typical queries, we will use RLS by passing the user's JWT.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  process.exit(1);
}

// Admin client (bypasses RLS) - Use carefully!
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Creates a Supabase client scoped to the authenticated user.
 * This ensures Row Level Security (RLS) is enforced.
 * @param {string} userJwt - The JWT from the Authorization header
 */
export const createSupabaseClient = (userJwt) => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${userJwt}`,
      },
    },
  });
};
