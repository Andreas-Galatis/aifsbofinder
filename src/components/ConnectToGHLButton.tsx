import React from 'react';
import { Link, Loader2, Link2Off } from 'lucide-react';
import { getAuthUrl } from '../services/ghlAuth';
import { useGHLAuth } from '../hooks/useGHLAuth';
import { setGHLLocationId } from '../lib/supabase';
import { getScheduledSearches } from '../services/scheduledSearches';
import { getLocationById } from '../services/ghlLocations';

interface ConnectToGHLButtonProps {
  onConnectionChange: () => void;
}

const ConnectToGHLButton: React.FC<ConnectToGHLButtonProps> = ({ onConnectionChange }) => {
  const { isConnected, isLoading, disconnect } = useGHLAuth();
  const [hasLoadedSearches, setHasLoadedSearches] = React.useState(false);
  const [locationName, setLocationName] = React.useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);

  const handleConnect = () => {
    window.location.href = getAuthUrl();
  };

  const handleDisconnect = async () => {
    disconnect();
    setLocationName(null);
    onConnectionChange();
  };

  // Load location name when connected
  React.useEffect(() => {
    const loadLocationName = async () => {
      const locationId = localStorage.getItem('ghl_location_id');
      const accessToken = localStorage.getItem('ghl_access_token');
      if (isConnected && locationId && accessToken && !locationName) {
        setIsLoadingLocation(true);
        try {
          const location = await getLocationById(locationId, accessToken);
          if (location) {
            setLocationName(location.name);
          }
        } catch (error) {
          console.error('Error loading location name:', error);
        } finally {
          setIsLoadingLocation(false);
        }
      }
    };

    loadLocationName();
  }, [isConnected, locationName]);

  // Load saved searches only once when connection is established
  React.useEffect(() => {
    const loadSavedSearches = async () => {
      const locationId = localStorage.getItem('ghl_location_id');
      if (isConnected && locationId && !hasLoadedSearches) {
        try {
          await setGHLLocationId(locationId);
          await getScheduledSearches(locationId);
          setHasLoadedSearches(true);
          onConnectionChange();
        } catch (error) {
          console.error('Error loading saved searches:', error);
        }
      }
    };

    loadSavedSearches();
  }, [isConnected, hasLoadedSearches, onConnectionChange]);

  // Reset hasLoadedSearches when disconnected
  React.useEffect(() => {
    if (!isConnected) {
      setHasLoadedSearches(false);
    }
  }, [isConnected]);

  if (isLoading || isLoadingLocation) {
    return (
      <button className="flex items-center px-4 py-2 text-aires-gray bg-gray-100 rounded-lg cursor-not-allowed">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        {isLoading ? 'Checking connection...' : 'Loading location...'}
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <>
          <button
            className="flex items-center px-4 py-2 text-green-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Link className="w-4 h-4 mr-2" />
            {locationName ? `Connected to ${locationName}` : 'Connected to AIRES AI'}
          </button>
          <button
            onClick={handleDisconnect}
            className="flex items-center px-4 py-2 text-sm text-aires-gray hover:text-aires-darkGray"
            title="Disconnect from GHL"
          >
            <Link2Off className="h-5 w-5 mr-1" />
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          className="flex items-center px-4 py-2 text-white bg-aires-blue rounded-lg hover:bg-opacity-90"
        >
          <Link className="w-4 h-4 mr-2" />
          Connect to AIRES AI
        </button>
      )}
    </div>
  );
};

export default ConnectToGHLButton;