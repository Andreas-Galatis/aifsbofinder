import axios from 'axios';
import { GHLTokenResponse } from '../types/ghl';

const GHL_CLIENT_ID = import.meta.env.VITE_GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = import.meta.env.VITE_GHL_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const REFRESH_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token';

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('ghl_refresh_token');
  if (!refreshToken) {
    console.warn('No refresh token found in localStorage');
    return null;
  }

  const encodedParams = new URLSearchParams();
  encodedParams.set('client_id', GHL_CLIENT_ID);
  encodedParams.set('client_secret', GHL_CLIENT_SECRET);
  encodedParams.set('grant_type', 'refresh_token');
  encodedParams.set('refresh_token', refreshToken);

  const basicAuth = btoa(`${GHL_CLIENT_ID}:${GHL_CLIENT_SECRET}`);

  try {
    const { data } = await axios.post(REFRESH_TOKEN_URL, encodedParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'Version': '2021-07-28',
      },
    });

    localStorage.setItem('ghl_access_token', data.access_token);
    localStorage.setItem('ghl_refresh_token', data.refresh_token);
    localStorage.setItem('ghl_token_expiry', String(Date.now() + data.expires_in * 1000));
    localStorage.setItem('ghl_company_id', data.companyId);

    console.log('🔁 Access token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    return null;
  }
};

export const checkGHLSession = async () => {
  console.log('🔍 Checking session...');
  
  try {
    if (hasValidGHLCredentials()) {
      if (!isTokenExpired()) {
        console.log('✅ Valid token');
        return {
          isAuthenticated: true,
          locationId: localStorage.getItem('ghl_location_id'),
        };
      } else {
        console.log('🔄 Token expired, attempting refresh...');
        const newToken = await refreshAccessToken();
        if (newToken) {
          return {
            isAuthenticated: true,
            locationId: localStorage.getItem('ghl_location_id'),
          };
        }
      }
    }

    console.log('❌ No valid authentication found');
    return { isAuthenticated: false };
  } catch (error) {
    console.error('🚫 Error checking session:', error);
    return { isAuthenticated: false };
  }
};

export const exchangeCodeForToken = async (code: string): Promise<GHLTokenResponse> => {
  console.log('🔄 Exchanging authorization code for token...');

  const encodedParams = new URLSearchParams();
  encodedParams.set('client_id', GHL_CLIENT_ID);
  encodedParams.set('client_secret', GHL_CLIENT_SECRET);
  encodedParams.set('grant_type', 'authorization_code');
  encodedParams.set('code', code);
  encodedParams.set('user_type', 'Location');
  encodedParams.set('redirect_uri', REDIRECT_URI);

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
    const { data } = await axios.request(options);
    localStorage.setItem('ghl_refresh_token', data.refresh_token);
    localStorage.setItem('ghl_company_id', data.companyId);
    return data;
  } catch (error) {
    console.error('🚫 Error exchanging code for token:', error);
    throw error;
  }
};

export const getAuthUrl = () => {
  return `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${REDIRECT_URI}&client_id=${GHL_CLIENT_ID}&scope=contacts.write contacts.readonly locations.readonly&loginWindowOpenMode=self`;
};

export const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem('ghl_token_expiry');
  return !expiry || Date.now() > parseInt(expiry, 10);
};

export const hasValidGHLCredentials = () => {
  const hasToken = !!localStorage.getItem('ghl_access_token');
  const hasLocation = !!localStorage.getItem('ghl_location_id');
  const hasCompanyId = !!localStorage.getItem('ghl_company_id');
  const tokenNotExpired = !isTokenExpired();

  console.log('🔑 Credentials check:', {
    hasToken,
    hasLocation,
    hasCompanyId,
    tokenNotExpired,
    isValid: hasToken && hasLocation && hasCompanyId && tokenNotExpired
  });

  return hasToken && hasLocation && hasCompanyId && tokenNotExpired;
};