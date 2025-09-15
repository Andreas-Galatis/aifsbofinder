import { supabase } from '../lib/supabase';

export interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
  company_id: string;
  max_searches_limit?: number;
}

export const storeTokens = async (
  locationId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  companyId: string,
  maxSearchesLimit?: number
): Promise<void> => {
  const localStorageLocationId = localStorage.getItem('ghl_location_id');

  console.log('Storing tokens:', {
    locationId,
    localStorageLocationId,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    companyId,
    providedMaxSearchesLimit: maxSearchesLimit
  });

  if (locationId !== localStorageLocationId) {
    console.error('Location IDs do not match:', { locationId, localStorageLocationId });
    throw new Error('Location IDs do not match');
  }

  const { error: setLocationError } = await supabase.rpc('set_ghl_location_id', {
    location_id: locationId
  });

  console.log('Setting GHL location ID in Supabase:', locationId);

  if (setLocationError) {
    console.error('Error setting location ID:', setLocationError);
    throw new Error('Failed to set location ID');
  }

  // Check if a record already exists for this location
  const { data: existingTokens, error: fetchError } = await supabase
    .from('ghl_service_tokens')
    .select('max_searches_limit')
    .eq('location_id', locationId)
    .limit(1);

  if (fetchError) { 
    console.error('Error checking existing token:', fetchError);
    throw new Error('Failed to check existing token');
  }

  // Determine the max_searches_limit to use
  let finalMaxSearchesLimit: number;

  if (locationId ==='5YrB6A0F3YI4XSvjfD25') {
    // Special case for AIRES location ID
    finalMaxSearchesLimit = 700;
    console.log('Using special max_searches_limit for AIRES location:', finalMaxSearchesLimit);
  } else {
    // Other records use default
    finalMaxSearchesLimit = 100; // Default value
    console.log('Using default max_searches_limit:', finalMaxSearchesLimit);
  }

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  const { error } = await supabase
    .from('ghl_service_tokens')
    .upsert({
      location_id: locationId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
      company_id: companyId,
      max_searches_limit: finalMaxSearchesLimit
    }, {
      onConflict: 'location_id'
    });

  if (error) {
    console.error('Error storing tokens:', error);
    throw new Error('Failed to store tokens');
  }

  console.log('Successfully stored tokens in Supabase with max_searches_limit:', finalMaxSearchesLimit);
};

export const getStoredToken = async (locationId: string): Promise<TokenInfo | null> => {
  console.log('Getting stored token for location:', locationId);
  
  const { data, error } = await supabase
    .from('ghl_service_tokens')
    .select('*')
    .eq('location_id', locationId)
    .limit(1);

  if (error) {
    console.error('Error fetching stored token:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No stored token found');
    return null;
  }

  const tokenData = data[0];

  console.log('Found stored token:', {
    hasAccessToken: !!tokenData.access_token,
    hasRefreshToken: !!tokenData.refresh_token,
    expiresAt: tokenData.expires_at,
    companyId: tokenData.company_id,
    maxSearchesLimit: tokenData.max_searches_limit
  });

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: new Date(tokenData.expires_at),
    company_id: tokenData.company_id,
    max_searches_limit: tokenData.max_searches_limit
  };
};

