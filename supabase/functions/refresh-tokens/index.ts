import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import axios from 'npm:axios@1.7.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const GHL_CLIENT_ID = Deno.env.get('GHL_CLIENT_ID');
const GHL_CLIENT_SECRET = Deno.env.get('GHL_CLIENT_SECRET');
const REFRESH_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token';

async function refreshToken(refreshToken: string): Promise<any> {
  const encodedParams = new URLSearchParams();
  encodedParams.set('client_id', GHL_CLIENT_ID!);
  encodedParams.set('client_secret', GHL_CLIENT_SECRET!);
  encodedParams.set('grant_type', 'refresh_token');
  encodedParams.set('refresh_token', refreshToken);

  const basicAuth = btoa(`${GHL_CLIENT_ID}:${GHL_CLIENT_SECRET}`);

  const response = await axios.post(REFRESH_TOKEN_URL, encodedParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `Basic ${basicAuth}`,
      'Version': '2021-07-28',
    },
  });

  return response.data;
}

async function handleTokenRefresh() {
  try {
    // Get tokens that expire in the next hour
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    const { data: tokens, error: fetchError } = await supabaseClient
      .from('ghl_service_tokens')
      .select('*')
      .lt('expires_at', oneHourFromNow.toISOString());

    if (fetchError) throw fetchError;

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({
        message: 'No tokens need refreshing',
        refreshed: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const results = {
      refreshed: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const token of tokens) {
      try {
        const newTokenData = await refreshToken(token.refresh_token);
        
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + newTokenData.expires_in);

        await supabaseClient
          .from('ghl_service_tokens')
          .update({
            access_token: newTokenData.access_token,
            refresh_token: newTokenData.refresh_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
            max_searches_limit: token.max_searches_limit // Preserve existing limit
          })
          .eq('location_id', token.location_id);

        results.refreshed++;
        results.details.push({
          location_id: token.location_id,
          status: 'success',
          preserved_limit: token.max_searches_limit
        });
      } catch (error) {
        console.error(`Error refreshing token for location ${token.location_id}:`, error);
        results.errors++;
        results.details.push({
          location_id: token.location_id,
          status: 'error',
          error: error.message
        });
      }

      // Add delay between refreshes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(JSON.stringify({
      message: 'Token refresh completed',
      ...results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in handleTokenRefresh:', error);
    return new Response(JSON.stringify({
      error: error.message,
      refreshed: 0,
      errors: 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  return handleTokenRefresh();
});