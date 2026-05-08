import { createClient } from '@supabase/supabase-js';

// 1. Grab environment variables from Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Validation check (helpful for debugging if the app fails to connect)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// 3. Initialize the Supabase Client
// Note: We are keeping the default settings for now to make development easy.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // This keeps the user logged in even after refreshing
    autoRefreshToken: true,
  },
});

/* 
  FUTURE AUTHENTICATION CONFIGURATION:
  When you are ready to handle redirects or specific auth behaviors, 
  you can update the client options above. For now, this standard 
  setup is all you need for database operations.
*/