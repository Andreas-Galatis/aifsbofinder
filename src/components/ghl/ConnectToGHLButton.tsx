import React from 'react';
import { Link, Loader2 } from 'lucide-react';
import { getAuthUrl } from '../../services/ghlAuth';
import { useGHLAuth } from '../../hooks/useGHLAuth';



const ConnectToGHLButton: React.FC = () => {
  const { isConnected, isLoading, disconnect } = useGHLAuth();

  const handleConnect = () => {
    window.location.href = getAuthUrl();
  };


  if (isLoading) {
    return (
      <button className="flex items-center px-4 py-2 text-aires-gray bg-gray-100 rounded-lg cursor-not-allowed">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking connection...
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {isConnected ? (
        <button
          onClick={disconnect}
          className="flex items-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
        >
          <Link className="w-4 h-4 mr-2" />
          Disconnect AIRES AI
        </button>
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