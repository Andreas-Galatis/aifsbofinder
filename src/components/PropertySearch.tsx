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

  // Query hook for fetching property data
  const { data, isLoading, error, refetch } = useQuery(
    ['properties', searchParams],
    () => searchProperties(searchParams, (pageProperties) => {
      setProperties((prev) => [...prev, ...pageProperties]); // Stream results
    }),
    {
      enabled: false, // Don't fetch automatically on mount
      onSuccess: (data) => {
        data?.loadAgentDetails((propertyId, details) => {
          setAgentDetails(prev => ({
            ...prev,
            [propertyId]: details
          }));
        });
      },
      onError: (err) => {
        toast.error('Failed to fetch properties. Please check your API settings.');
      }
    }
  );

  const getNextRunDate = (days: string) => {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(days, 10));
    return date.toISOString();
  };

  /*
  const exportProperties = async (propertiesToExport: any[]) => {
    try {
      // export properties sequentially
      for (const property of propertiesToExport) {
        await exportToGHL(property);
      }
      toast.success('Properties exported to AIRES AI successfully');
    } catch {
      toast.error('Failed to export properties to AIRES AI');
    }
  };
  */

  const [uiLoading, setuiLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const exportProperties = async (propertiesToExport: any[]) => {
    try {
      setuiLoading(true);
      setProgress(0);

      const totalProperties = propertiesToExport.length;
      let completedCount = 0;

      for (let i = 0; i < totalProperties; i++) {
        await exportToGHL(propertiesToExport[i], searchParams, () => {
          completedCount++;
          const progress = Math.round((completedCount / totalProperties) * 100);
          console.log(`📊 Export Progress: ${progress}%`);
          setProgress(progress);
        });
      }

      // await Promise.all(propertiesToExport.map(property => exportToGHL(property, searchParams)));
      toast.success('Properties exported to AIRES AI successfully');
    } catch (error) {
      toast.error('Failed to export properties to AIRES AI');
    } finally {
      setuiLoading(false);
    }
  };

  // Pass this function to AutomatedSearch
  const handleAutomatedSearch = async () => {
    setProperties([]);
    setAgentDetails({});
    try {
      const result = await searchProperties(searchParams, (pageProperties) => {
        setProperties(prev => [...prev, ...pageProperties]);
      });
      
      await result?.loadAgentDetails((propertyId, details) => {
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
      await exportProperties(propertiesWithAgents);

    } catch {
      toast.error('Failed to perform search');
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
    setIsSearching(true); // Indicate search is on progress
    setProperties([]); // Reset properties for new search
    setAgentDetails({}); // Reset agent details for new search

    try {
      await refetch(); // Trigger the query hook
    } catch {
      toast.error('Failed to fetch properties. Please try again.');
    } finally {
      setIsSearching(false); // Mark search as complete
    }
  };

  // Combine property data with loaded agent details
  const combinedProperties = properties.map((property) => ({
    ...property,
    listingAgent: agentDetails[property.id] || property.listingAgent,
  }));

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
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-2 bg-aires-blue text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-aires-green focus:ring-offset-2 disabled:opacity-50"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </button>
        </div>

        {/* Advanced Search Filters */}
        <SearchFilters 
          searchParams={searchParams} 
          setSearchParams={setSearchParams} />

        {/* Add AutomatedSearch component */}
        <AutomatedSearch 
          currentSearchParams={searchParams}
          onSearch={handleAutomatedSearch} />
      </div>

      {/* Property Results List */}
      <PropertyList
        properties={combinedProperties}
        loading={isLoading}
        searchParams={searchParams}
        
      />
    </div>
  );
};

export default PropertySearch;