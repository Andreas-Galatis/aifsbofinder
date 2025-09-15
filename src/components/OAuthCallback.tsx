import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GHLTokenResponse } from '../types/ghl';
import { exchangeCodeForToken } from '../services/ghlAuth';
import { toast } from 'react-toastify';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Extract code and error from searchParams
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        // Handle OAuth errors returned in the URL
        if (error) {
          console.error('OAuth error:', error);
          toast.error(`Authentication error: ${error}`);
          setStatus('Authentication error occurred. Please try again.');
          navigate('/'); // Redirect to home page
          return;
        }

        // Ensure authorization code exists
        if (!code) {
          console.error('Error: No authorization code received in the callback URL');
          setStatus('Error: No authorization code received.');
          toast.error('Error: No authorization code received.');
          navigate('/'); // Redirect to home page
          return;
        }

        // Log the authorization code for debugging
        console.log('Authorization code received:', code);

        // Exchange the authorization code for a token
        console.log('Exchanging code for token...');
        const tokenData = await exchangeCodeForToken(code);

        // Log the received token data
        console.log('Token received:', tokenData);

        // Store the access token, location ID, and token expiry in localStorage
        localStorage.setItem('ghl_access_token', tokenData.access_token);
        localStorage.setItem('ghl_location_id', tokenData.locationId);
        localStorage.setItem('ghl_token_expiry', String(Date.now() + tokenData.expires_in * 1000));

        setStatus('Authorization successful! Redirecting...');
        toast.success('Successfully connected to AIRES AI!');
        navigate('/'); // Redirect to home page
      } catch (error: any) {
        // Handle errors during token exchange
        console.error('OAuth callback error:', error.response?.data || error.message || error);
        setStatus('Authorization failed. Please try again.');
        toast.error('Authorization failed. Please try again.');
        navigate('/'); // Redirect to home page
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
