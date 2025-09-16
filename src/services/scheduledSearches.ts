import { supabase } from '../lib/supabase';
import { SearchParams } from '../types';
import { Database } from '../lib/database.types';

type ScheduledSearch = Database['public']['Tables']['scheduled_searches']['Row'];

// Get the max searches limit for a specific location
const getMaxSearchesLimit = async (ghlLocationId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('ghl_service_tokens')
    .select('max_searches_limit')
    .eq('location_id', ghlLocationId)
    .limit(1);

  if (error) {
    console.error('Error fetching max searches limit:', error);
    // Return default limit if there's an error
    return 100;
  }

  return (data && data.length > 0) ? data[0].max_searches_limit : 100;
};

export const createScheduledSearch = async (
  ghlLocationId: string,
  searchParams: SearchParams,
  frequencyDays: number
): Promise<ScheduledSearch> => {

  // First set the GHL location ID in the session
  const { error: setLocationError } = await supabase.rpc('set_ghl_location_id', {
    location_id: ghlLocationId
  });

  if (setLocationError) {
    console.error('Error setting location ID:', setLocationError);
    throw setLocationError;
  }

   // Get the max searches limit for this location
  const maxSearchesLimit = await getMaxSearchesLimit(ghlLocationId);

  // Check current number of active searches for this location
  const { data: existingSearches, error: countError } = await supabase
    .from('scheduled_searches')
    .select('id')
    .eq('ghl_location_id', ghlLocationId)
    .eq('active', true);

  if (countError) {
    console.error('Error fetching existing scheduled searches:', countError);
    throw countError;
  }

  // Enforce the limit
  if (existingSearches && existingSearches.length >= maxSearchesLimit) {
    throw new Error(`Maximum limit of ${maxSearchesLimit} automated searches reached. Please delete some existing searches before creating new ones.`);
  }
  
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + frequencyDays);

  const { data, error } = await supabase
    .from('scheduled_searches')
    .insert({
      ghl_location_id: ghlLocationId,
      search_params: searchParams,
      frequency_days: frequencyDays,
      next_run: nextRun.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating scheduled search:', error);
    throw error;
  }

  return data;
};

export const getScheduledSearches = async (ghlLocationId: string): Promise<ScheduledSearch[]> => {
  
  // Set the GHL location ID in the session
  const { error: setLocationError } = await supabase.rpc('set_ghl_location_id', {
    location_id: ghlLocationId
  });

  if (setLocationError) {
    console.error('Error setting location ID:', setLocationError);
    throw setLocationError;
  }

  const { data, error } = await supabase
    .from('scheduled_searches')
    .select('*')
    .eq('ghl_location_id', ghlLocationId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scheduled searches:', error);
    throw error;
  }

  return data || [];
};

export const updateScheduledSearch = async (
  searchId: string,
  updates: Partial<Database['public']['Tables']['scheduled_searches']['Update']>
): Promise<ScheduledSearch> => {
  // Set the GHL location ID in the session
  const locationId = localStorage.getItem('ghl_location_id');
  if (!locationId) {
    throw new Error('No GHL location ID found');
  }

  const { error: setLocationError } = await supabase.rpc('set_ghl_location_id', {
    location_id: locationId
  });

  if (setLocationError) {
    console.error('Error setting location ID:', setLocationError);
    throw setLocationError;
  }

  // First verify the search exists and belongs to the user
  /*
  const { data: searches, error: fetchError } = await supabase
    .from('scheduled_searches')
    .select('*')
    .eq('id', searchId)
    .eq('ghl_location_id', locationId);

  if (fetchError) {
    console.error('Error fetching scheduled search:', fetchError);
    throw fetchError;
  }

  if (!searches || searches.length === 0) {
    throw new Error('Scheduled search not found');
  }
  */

  // Then perform the update
  const { data, error } = await supabase
    .from('scheduled_searches')
    .update(updates)
    .eq('id', searchId)
    .eq('ghl_location_id', locationId)
    .select();

  if (error) {
    console.error('Error updating scheduled search:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to update scheduled search');
  }

  return data[0];
};

export const deleteScheduledSearch = async (searchId: string): Promise<void> => {
  // First set the GHL location ID in the session
  const locationId = localStorage.getItem('ghl_location_id');
  if (!locationId) {
    throw new Error('No GHL location ID found');
  }

  const { error: setLocationError } = await supabase.rpc('set_ghl_location_id', {
    location_id: locationId
  });

  if (setLocationError) {
    console.error('Error setting location ID:', setLocationError);
    throw setLocationError;
  }

  // Then attempt to delete the search
  const { error } = await supabase
    .from('scheduled_searches')
    .delete()
    .eq('id', searchId);

  if (error) {
    console.error('Error deleting scheduled search:', error);
    throw error;
  }
};

export const updateSearchRunTime = async (searchId: string): Promise<void> => {
  
  // Set the GHL location ID in the session
  const locationId = localStorage.getItem('ghl_location_id');
  if (!locationId) {
    throw new Error('No GHL location ID found');
  }

  const { error: setLocationError } = await supabase.rpc('set_ghl_location_id', {
    location_id: locationId
  });

  if (setLocationError) {
    console.error('Error setting location ID:', setLocationError);
    throw setLocationError;
  }

  const { data: searches, error: searchError } = await supabase
    .from('scheduled_searches')
    .select('frequency_days')
    .eq('id', searchId);

  if (searchError) {
    throw searchError;
  }

  if (!searches || searches.length === 0) {
    throw new Error('Search not found');
  }

  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + searches[0].frequency_days);

  const { error } = await supabase
    .from('scheduled_searches')
    .update({
      last_run: new Date().toISOString(),
      next_run: nextRun.toISOString(),
    })
    .eq('id', searchId);

  if (error) {
    throw error;
  }
};

// Export the function to get max searches limit for use in other components
export { getMaxSearchesLimit };