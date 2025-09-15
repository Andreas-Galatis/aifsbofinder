import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
  company_id?: string;
}

export class TokenManager {
  private supabase;
  private tokenCache: Map<string, TokenInfo> = new Map();
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  private async getStoredToken(locationId: string): Promise<TokenInfo | null> {
    // Check cache first
    const cachedToken = this.tokenCache.get(locationId);
    if (cachedToken && cachedToken.expires_at > new Date()) {
      // console.log('Using cached token');
      return cachedToken;
    }

    // console.log('Fetching stored token for location:', locationId);
    
    const { data, error } = await this.supabase
      .from('ghl_service_tokens')
      .select('*')
      .eq('location_id', locationId)
      .single();

    if (error || !data) {
      console.log('No stored token found');
      return null;
    }

    const tokenInfo = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at),
      company_id: data.company_id,
      max_searches_limit: data.max_searches_limit
    };

    // Cache the token
    this.tokenCache.set(locationId, tokenInfo);
    
    return tokenInfo;
  }

  public async getValidToken(locationId: string): Promise<string> {
    try {
      const storedToken = await this.getStoredToken(locationId);
      
      if (!storedToken) {
        throw new Error('No token found');
      }

      if (storedToken.expires_at < new Date()) {
        throw new Error('Token is expired');
      }

      return storedToken.access_token;
    } catch (error) {
      console.error('Failed to get valid token:', error);
      throw new Error('Unable to obtain valid token');
    }
  }

  public async getCompanyId(locationId: string): Promise<string | null> {
    try {
      const storedToken = await this.getStoredToken(locationId);
      return storedToken?.company_id || null;
    } catch (error) {
      console.error('Failed to get company ID:', error);
      return null;
    }
  }

  public async getMaxSearchesLimit(locationId: string): Promise<number | null> {
    try {
      const storedToken = await this.getStoredToken(locationId);
      return storedToken?.max_searches_limit || null;
    } catch (error) {
      console.error('Failed to get max searches limit:', error);
      return null;
    }
  }
}