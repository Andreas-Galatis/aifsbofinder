import { useState, useEffect } from 'react';
import { checkGHLSession, isTokenExpired } from '../services/ghlAuth';

export const useGHLAuth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isTokenExpired()) {
          setIsConnected(true);
          return;
        }

        const sessionData = await checkGHLSession();
        if (sessionData.isAuthenticated) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const disconnect = () => {
    localStorage.removeItem('ghl_access_token');
    localStorage.removeItem('ghl_location_id');
    localStorage.removeItem('ghl_token_expiry');
    setIsConnected(false);
  };

  return {
    isConnected,
    isLoading,
    disconnect
  };
};