import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const setGHLLocationId = async (locationId: string) => {
  const { error } = await supabase.rpc('set_ghl_location_id', {
    location_id: locationId
  });
  
  if (error) {
    console.error('Error setting GHL location ID:', error);
    throw error;
  }
};

export const setUserContext = async (userId: string, companyId: string) => {
  console.log('Setting user context:', { userId, companyId }); // ADD THIS LINE
  const { error } = await supabase.rpc('set_user_context', {
    user_id: userId,
    company_id: companyId
  });
  
  if (error) {
    console.error('Error setting user context:', error);
    throw error;
  }
};

