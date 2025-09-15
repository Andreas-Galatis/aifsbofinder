import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../services/ghlAuth';
import { storeTokens } from '../services/tokenService';
import { setUserContext } from '../lib/supabase';
import { setGHLLocationId } from '../lib/supabase';
import { toast } from 'react-toastify';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          toast.error(`Authentication error: ${error}`);
          setStatus('Authentication error occurred. Please try again.');
          navigate('/');
          return;
        }

        if (!code) {
          console.error('Error: No authorization code received in the callback URL');
          setStatus('Error: No authorization code received.');
          toast.error('Error: No authorization code received.');
          navigate('/');
          return;
        }

        console.log('Starting OAuth callback flow with code');

        const tokenData = await exchangeCodeForToken(code);
        
        if (!tokenData.locationId) {
          console.error('No location ID received in token data');
          throw new Error('No location ID received');
        }
        
        console.log('Token exchange successful, location ID:', tokenData.locationId);

        localStorage.setItem('ghl_access_token', tokenData.access_token);
        localStorage.setItem('ghl_location_id', tokenData.locationId);
        localStorage.setItem('ghl_token_expiry', String(Date.now() + tokenData.expires_in * 1000));
        localStorage.setItem('ghl_company_id', tokenData.companyId);

        await setGHLLocationId(tokenData.locationId);

        console.log('Storing tokens in Supabase...');

        try {
          await storeTokens(
            tokenData.locationId,
            tokenData.access_token,
            tokenData.refresh_token,
            tokenData.expires_in,
            tokenData.companyId
          );
          console.log('Tokens stored successfully');
        } catch (tokenError) {
          console.error('Error storing tokens:', tokenError);
          // Don't throw here - the authentication was successful, just log the error
          toast.warning('Authentication successful, but there was an issue storing some settings.');
        }

        setStatus('Authorization successful! Redirecting...');
        toast.success('Successfully connected to AIRES AI!');
        navigate('/');
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
        setStatus('Authorization failed. Please try again.');
        toast.error('Authorization failed. Please try again.');
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Connecting to AIRES AI</h2>
          <p className="mt-2 text-sm text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;