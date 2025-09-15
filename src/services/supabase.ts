import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface SavedSearch {
  id: string;
  user_id?: string;
  search_params: any;
  frequency_days: number;
  last_run?: string;
  next_run?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  search_id: string;
  property_data: any;
  exported_to_ghl: boolean;
  ghl_contact_id?: string;
  created_at: string;
}