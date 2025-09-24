/**
 * Main property search component that handles the search interface and results
 * Manages search parameters and property data fetching
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { Search, MapPin, Filter } from 'lucide-react';
import { searchProperties } from '../services/api';
import { exportToGHL } from '../utils/ghlIntegration';
import PropertyList from './PropertyList';
import SearchFilters from './SearchFilters';
import AutomatedSearch from './AutomatedSearch';

export const PropertySearch: React.FC = () => {
  // Main search parameters state - FSBO focused
  const [searchParams, setSearchParams] = useState({
    location: '',
    state: '',
    propertyType: 'all',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    beds: '',
    baths: '',
    minSqft: '',
    maxSqft: '',
    minYear: '',
    maxYear: '',
    homeType: [] as string[],
    listingType: 'by_owner' // Force FSBO only
  });

  // State for storing agent details as they load
  const [properties, setProperties] = useState<any[]>([]);
  const [agentDetails, setAgentDetails] = useState<Record<string, any>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [foundCount, setFoundCount] = useState(0);

  // Query hook for fetching property data
  const { data, isLoading, error, refetch } = useQuery(
    ['properties', searchParams],
    () => searchProperties({...searchParams, totalCount: 0, exportedCount: 0}, (pageProperties) => {
      setProperties((prev) => {
        const newProperties = [...prev, ...pageProperties];
        setFoundCount(newProperties.length);
        return newProperties;
      }); // Stream results
    }),
    {
      enabled: false, // Don't fetch automatically on mount
      onSuccess: (data) => {
        data?.loadAgentDetails((propertyId: string, details: any) => {
          setAgentDetails(prev => ({
            ...prev,
            [propertyId]: details
          }));
        });
      },
      onError: () => {
        toast.error('Failed to fetch properties. Please check your API settings.');
      }
    }
  );

  const getNextRunDate = (days: string) => {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(days, 10));
    return date.toISOString();
  };

  // Dynamic search messages
  const searchMessages = [
    'Searching high and low for properties...',
    'Finding For Sale By Owner gems...',
    'Pinpointing matches that meet your criteria...',
    'Collecting contact information...',
    'Calling up our secret agent sources...',
    'Making a list and checking it twice...',
    'Making sure the photos match the vibe…',
    'Digging for that diamond-in-the-rough...'
  ];

  // Function to cycle through search messages
  const startSearchMessaging = () => {
    setSearchMessage(searchMessages[0]);
    let messageIndex = 0;

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % searchMessages.length;
      setSearchMessage(searchMessages[messageIndex]);
    }, 5000); // Change message every 5 seconds

    return messageInterval;
  };

  const [uiLoading, setuiLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const exportProperties = async (propertiesToExport: any[], showToasts: boolean = true) => {
    const totalProperties = propertiesToExport.length;

    if (totalProperties === 0) {
      return { exported: 0, total: 0 };
    }

    try {
      if (showToasts) {
        setuiLoading(true);
        setProgress(0);
      }
      let completedCount = 0;
      let successCount = 0;

      for (let i = 0; i < totalProperties; i++) {
        try {
          await exportToGHL(propertiesToExport[i], {...searchParams, totalCount: 0, exportedCount: 0});
          successCount++;
        } catch (error) {
          console.error(`Failed to export property ${i + 1}:`, error);
        }

        completedCount++;
        if (showToasts) {
          const progress = Math.round((completedCount / totalProperties) * 100);
          console.log(`📊 Export Progress: ${progress}%`);
          setProgress(progress);
        }
      }

      // Only show toast for manual exports
      if (showToasts) {
        if (successCount === totalProperties) {
          toast.success('Properties exported to AIRES AI successfully');
        } else if (successCount === 0) {
          toast.error('Failed to export properties to AIRES AI');
        } else {
          toast.warning(`Exported ${successCount} of ${totalProperties} properties to AIRES AI`);
        }
      }

      return { exported: successCount, total: totalProperties };
    } catch {
      if (showToasts) {
        toast.error('Failed to export properties to AIRES AI');
      }
      return { exported: 0, total: totalProperties };
    } finally {
      if (showToasts) {
        setuiLoading(false);
      }
    }
  };

  // Pass this function to AutomatedSearch
  const handleAutomatedSearch = async (): Promise<{exported: number, total: number}> => {
    setIsSearching(true);
    setProperties([]);
    setAgentDetails({});
    setFoundCount(0);

    // Start the dynamic messaging for automated search
    const messageInterval = startSearchMessaging();

    try {
      const result = await searchProperties({...searchParams, totalCount: 0, exportedCount: 0}, (pageProperties) => {
        setProperties(prev => {
          const newProperties = [...prev, ...pageProperties];
          setFoundCount(newProperties.length);
          return newProperties;
        });
      });

      await result?.loadAgentDetails((propertyId: string, details: any) => {
        setAgentDetails(prev => ({
          ...prev,
          [propertyId]: details
        }));
      });

      // Export the properties after loading agent details
      const propertiesWithAgents = properties.map(property => ({
        ...property,
        listingAgent: agentDetails[property.id] || property.listingAgent,
      }));

      const exportResult = await exportProperties(propertiesWithAgents, false);
      return exportResult;

    } catch {
      toast.error('Failed to perform search');
      return { exported: 0, total: 0 };
    } finally {
      setIsSearching(false);
      clearInterval(messageInterval);
      setSearchMessage('');
    }
  };

  useEffect(() => {
    const checkScheduledSearches = async () => {
      const scheduledSearches = JSON.parse(localStorage.getItem('scheduledSearches') || '[]');
      const now = new Date();
      
      for (const search of scheduledSearches) {
        if (new Date(search.nextRun) <= now) {
          setSearchParams(search.searchParams);
          await refetch();
          
          search.lastRun = now.toISOString();
          search.nextRun = getNextRunDate(search.frequency);
        }
      }
      
      localStorage.setItem('scheduledSearches', JSON.stringify(scheduledSearches));
    };

    const interval = setInterval(checkScheduledSearches, 60000);
    return () => clearInterval(interval);
  }, [handleAutomatedSearch]);

  /**
   * Handles the search submission
   * Validates required fields and triggers the search
   */
  const handleSearch = async () => {
    if (!searchParams.location || !searchParams.state) {
      toast.warning('Please enter both city and state');
      return;
    }

    setIsSearching(true);
    setProperties([]);
    setAgentDetails({});
    setFoundCount(0);

    // Start the dynamic messaging
    const messageInterval = startSearchMessaging();

    try {
      await refetch();
    } catch {
      toast.error('Failed to fetch properties. Please try again.');
    } finally {
      setIsSearching(false);
      clearInterval(messageInterval);
      setSearchMessage('');
    }
  };

  // Combine property data with loaded agent details
  const combinedProperties = properties.map((property) => ({
    ...property,
    listingAgent: agentDetails[property.id] || property.listingAgent,
  }));

  if (isSearching || isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold mb-6 text-gray-900">Searching FSBO Properties</h3>

          {/* Property Count Display */}
          {foundCount > 0 && (
            <div className="mb-4 p-3 bg-aires-blue/10 rounded-lg border border-aires-blue/20">
              <p className="text-aires-blue font-semibold text-lg">
                {foundCount} {foundCount === 1 ? 'property' : 'properties'} found
              </p>
            </div>
          )}

          {/* Dynamic Message */}
          <div className="mb-6 text-center">
            <p className="text-gray-700 text-base mb-2">{searchMessage || 'Please wait while we find FSBO properties'}</p>
          </div>

          {/* Loading Animation */}
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-aires-blue"></div>
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-aires-blue rounded-full animate-pulse"></div>
              <div className="h-2 w-2 bg-aires-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 bg-aires-blue rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-sm text-gray-500">This may take a few moments...</p>
          </div>
        </div>
      </div>
    );
  }

   if (uiLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Exporting Properties...</h3>
          <div className="w-64 bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-gray-700">{progress}% completed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Find FSBO Properties
          </h2>
        </div>
        {/* Search Input Fields */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-aires-gray h-5 w-5" />
              <input
                type="text"
                placeholder="Enter city or zip code"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aires-green focus:border-transparent"
                value={searchParams.location || ''}
                onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
              />
            </div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="State (e.g., CA)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aires-green focus:border-transparent"
              value={searchParams.state || ''}
              onChange={(e) => setSearchParams({ ...searchParams, state: e.target.value.toUpperCase() })}
              maxLength={2}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || isSearching}
            className="flex items-center justify-center px-6 py-2 bg-aires-blue text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-aires-green focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading || isSearching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Advanced Search Filters */}
        <SearchFilters 
          searchParams={searchParams} 
          setSearchParams={setSearchParams} />

        {/* Add AutomatedSearch component */}
        <AutomatedSearch
          currentSearchParams={{...searchParams, totalCount: 0, exportedCount: 0}}
          onSearch={handleAutomatedSearch} />
      </div>

      {/* Property Results List */}
      <PropertyList
        properties={combinedProperties}
        loading={isLoading}
        searchParams={{...searchParams, totalCount: 0, exportedCount: 0}}

      />
    </div>
  );
};

export default PropertySearch;