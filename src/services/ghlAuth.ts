import axios from 'axios';
import { GHLTokenResponse } from '../types/ghl';

const GHL_CLIENT_ID = import.meta.env.VITE_GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = import.meta.env.VITE_GHL_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

// Check if user is already logged in to GHL
export const checkGHLSession = async () => {
  console.log('🔍 Checking GHL session...');
  
  try {
    // Check if we have valid credentials
    if (!isTokenExpired() && hasValidGHLCredentials()) {
      console.log('✅ Valid credentials found in storage');
      return {
        isAuthenticated: true,
        locationId: localStorage.getItem('ghl_location_id')
      };
    }

    console.log('❌ No valid authentication found');
    return { isAuthenticated: false };
  } catch (error) {
    console.error('🚫 Error checking GHL session:', error);
    if (axios.isAxiosError(error)) {
      console.error('Request details:', {
        url: error.config?.url,
        headers: error.config?.headers,
        response: error.response?.data
      });
    }
    return { isAuthenticated: false };
  }
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string): Promise<GHLTokenResponse> => {
  console.log('🔄 Exchanging authorization code for token...');

  const encodedParams = new URLSearchParams();
  encodedParams.set('client_id', GHL_CLIENT_ID);
  encodedParams.set('client_secret', GHL_CLIENT_SECRET);
  encodedParams.set('grant_type', 'authorization_code');
  encodedParams.set('code', code);
  encodedParams.set('user_type', 'Location');
  encodedParams.set('redirect_uri', REDIRECT_URI);

  // Base64 encode the client ID and secret for the Authorization header
  const basicAuth = btoa(`${GHL_CLIENT_ID}:${GHL_CLIENT_SECRET}`);

  const options = {
    method: 'POST',
    url: 'https://services.leadconnectorhq.com/oauth/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `Basic ${basicAuth}`,
      'Version': '2021-07-28'
    },
    data: encodedParams,
  };

  try {
    console.log('📡 Token exchange request:', {
      url: options.url,
      headers: { ...options.headers, Authorization: '[REDACTED]' },
      params: Object.fromEntries(encodedParams)
    });

    const { data } = await axios.request(options);
    console.log('✅ Token exchange successful:', {
      tokenReceived: !!data.access_token,
      expiresIn: data.expires_in,
      locationId: data.locationId
    });
    return data;
  } catch (error) {
    console.error('🚫 Error exchanging code for token:', error);
    if (axios.isAxiosError(error)) {
      console.error('Request details:', {
        url: error.config?.url,
        headers: error.config?.headers,
        response: error.response?.data
      });
    }
    throw error;
  }
};

// Get the OAuth URL for login
export const getAuthUrl = () => {
  const url = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&client_id=${GHL_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=contacts.write contacts.readonly locations.readonly`;
  console.log('🔗 Generated OAuth URL:', url);
  return url;
};

export const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem('ghl_token_expiry');
  const isExpired = !expiry || Date.now() > parseInt(expiry, 10);
  console.log('🕒 Token expiry check:', {
    expiry,
    currentTime: Date.now(),
    isExpired
  });
  return isExpired;
};

export const hasValidGHLCredentials = () => {
  const hasToken = !!localStorage.getItem('ghl_access_token');
  const hasLocation = !!localStorage.getItem('ghl_location_id');
  console.log('🔑 GHL credentials check:', {
    hasToken,
    hasLocation,
    isValid: hasToken && hasLocation
  });
  return hasToken && hasLocation;
};