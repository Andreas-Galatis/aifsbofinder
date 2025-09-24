import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, X, Edit2, Trash2, Bot } from 'lucide-react';
import { SearchParams } from '../types';
import { toast } from 'react-toastify';
import SearchFilters from './SearchFilters';
import {
  createScheduledSearch,
  getScheduledSearches,
  updateScheduledSearch,
  deleteScheduledSearch,
  getMaxSearchesLimit
} from '../services/scheduledSearches';
import { hasValidGHLCredentials, getAuthUrl } from '../services/ghlAuth';
import { Database } from '../lib/database.types';

type ScheduledSearch = Database['public']['Tables']['scheduled_searches']['Row'];

interface AutomatedSearchProps {
  currentSearchParams: SearchParams;
  onSearch: () => Promise<{exported: number, total: number}>;
}

const AutomatedSearch: React.FC<AutomatedSearchProps> = ({ currentSearchParams, onSearch }) => {
  const [frequency, setFrequency] = useState('7'); // Default to 7 days
  const [savedSearches, setSavedSearches] = useState<ScheduledSearch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<ScheduledSearch | null>(null);
  const [editingParams, setEditingParams] = useState<SearchParams | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [maxSearchesLimit, setMaxSearchesLimit] = useState<number>(100);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  
  
  const loadSearches = async () => {
    try {
      if (!hasValidGHLCredentials()) {
        console.warn('No valid GHL credentials found');
        setIsAuthenticated(false);
        setSavedSearches([]);
        return;
      }

      const locationId = localStorage.getItem('ghl_location_id');
      if (!locationId) {
        console.warn('No GHL location ID found');
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      // Load both searches and max limit
      const [searches, maxLimit] = await Promise.all([
        getScheduledSearches(locationId),
        getMaxSearchesLimit(locationId)
      ]);

      setSavedSearches(searches);
      setMaxSearchesLimit(maxLimit);
    } catch (error) {
      console.error('Error loading scheduled searches:', error);
      toast.error('Failed to load scheduled searches');
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    loadSearches();
  }, []);

  // Monitor authentication state changes
  useEffect(() => {
    const checkAuth = () => {
      const authState = hasValidGHLCredentials();
      setIsAuthenticated(authState);

      // If auth state changed and they're not authenticated, clear searches
      if (!authState) {
        setSavedSearches([]);
      }
    };

    // Check on mount
    checkAuth();

    // Check every 30 seconds for token expiry
    const interval = setInterval(checkAuth, 30000);

    return () => clearInterval(interval);
  }, []);

  const saveScheduledSearch = async () => {
    try {
      // Double-check authentication before doing anything
      if (!hasValidGHLCredentials()) {
        toast.error('Please connect to AIRES AI first');
        window.location.href = getAuthUrl();
        return;
      }

      const locationId = localStorage.getItem('ghl_location_id');
      if (!locationId) {
        toast.error('Please connect to AIRES AI first');
        window.location.href = getAuthUrl();
        return;
      }

      // Perform initial search with progress UI
      const searchResult = await onSearch();

      // Create scheduled search in database
      const newSearch = await createScheduledSearch(
        locationId,
        currentSearchParams,
        parseInt(frequency, 10)
      );

      // Immediately update the UI with the new search
      setSavedSearches(prev => [newSearch, ...prev]);

      // Also update the max limit by re-fetching just that value
      const updatedLimit = await getMaxSearchesLimit(locationId);
      setMaxSearchesLimit(updatedLimit);

      // Show contextual success message based on search results
      if (searchResult.total === 0) {
        toast.success('AIRES agent assigned! No properties found at this time, but your agent will keep searching.');
      } else if (searchResult.exported === searchResult.total) {
        toast.success(`AIRES agent assigned! Found ${searchResult.total} ${searchResult.total === 1 ? 'property' : 'properties'} and exported to AIRES AI.`);
      } else if (searchResult.exported === 0) {
        toast.error(`AIRES agent assigned! Found ${searchResult.total} ${searchResult.total === 1 ? 'property' : 'properties'} but export failed.`);
      } else {
        toast.warning(`AIRES agent assigned! Found ${searchResult.total} properties, exported ${searchResult.exported} successfully.`);
      }

    } catch (error) {
      console.error('Error saving scheduled search:', error);
      // Check if the error is due to exceeding the limit on the backend
      if (error.message && error.message.includes('Maximum limit')) {
        toast.error(error.message);
      } else {
      toast.error('Failed to schedule search');
      }
    }
  };

  const updateSearch = async (search: ScheduledSearch) => {
    try {
      if (!editingParams) {
        throw new Error('No search parameters to update');
      }

      // Ensure frequency_days is a number
      const frequencyDays = parseInt(search.frequency_days.toString(), 10);
      if (isNaN(frequencyDays)) {
        throw new Error('Invalid frequency days value');
      }

      // Convert numeric string values to numbers in editingParams
      const normalizedParams = {
        ...editingParams,
        minPrice: editingParams.minPrice ? parseInt(editingParams.minPrice, 10).toString() : '',
        maxPrice: editingParams.maxPrice ? parseInt(editingParams.maxPrice, 10).toString() : '',
        beds: editingParams.beds ? parseInt(editingParams.beds, 10).toString() : '',
        baths: editingParams.baths ? parseInt(editingParams.baths, 10).toString() : '',
        minSqft: editingParams.minSqft ? parseInt(editingParams.minSqft, 10).toString() : '',
        maxSqft: editingParams.maxSqft ? parseInt(editingParams.maxSqft, 10).toString() : '',
        minYear: editingParams.minYear ? parseInt(editingParams.minYear, 10).toString() : '',
        maxYear: editingParams.maxYear ? parseInt(editingParams.maxYear, 10).toString() : '',
       
      };

      const updatedSearch = await updateScheduledSearch(search.id, {
        search_params: normalizedParams,
        frequency_days: frequencyDays,
      });
      
      setSavedSearches(prev => 
        prev.map(s => s.id === updatedSearch.id ? updatedSearch : s)
      );
      
      setEditingSearch(null);
      setEditingParams(null);
      toast.success('Search updated successfully!');
    } catch (error) {
      console.error('Error updating search:', error);
      toast.error(`Failed to update search: ${error.message}`);
    }
  };

  const startEditing = (search: ScheduledSearch) => {
    setEditingSearch(search);
    setEditingParams(search.search_params as SearchParams);
  };

  const deleteSearch = async (id: string) => {
    try {
      await deleteScheduledSearch(id);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
      toast.success('Search deleted successfully!');
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSearchDetails = (params: SearchParams) => {
    const filters = [];
    
    if (params.minPrice || params.maxPrice) {
      filters.push(`Price: ${params.minPrice || '0'} - ${params.maxPrice || 'Any'}`);
    }
    if (params.beds) {
      filters.push(`${params.beds}+ beds`);
    }
    if (params.baths) {
      filters.push(`${params.baths}+ baths`);
    }
    if (params.minSqft || params.maxSqft) {
      filters.push(`${params.minSqft || '0'} - ${params.maxSqft || 'Any'} sqft`);
    }
    if (params.minYear || params.maxYear) {
      filters.push(`Year: ${params.minYear || '0'} - ${params.maxYear || 'Any'}`);
    }

    
    return filters.length > 0 ? (
      <div className="mt-2 text-sm text-gray-600">
        <p className="font-medium">Filters:</p>
        <ul className="list-disc list-inside ml-2">
          {filters.map((filter, index) => (
            <li key={index}>{filter}</li>
          ))}
        </ul>
      </div>
    ) : null;
  };

  // Check if tthe user is approaching the liimit
  const isApproachingLimit = savedSearches.length >= maxSearchesLimit * 0.9; // 90% of limit
  const isAtLimit = savedSearches.length >= maxSearchesLimit; // At limit

  return (
    <>
      <div className="mt-6 bg-gradient-to-r from-aires-blue/5 to-aires-lightBlue/5 rounded-lg p-4 border border-aires-blue/10">
        <div className="flex items-center space-x-6">
          {/* Bot Icon with Gradient */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-aires-lightBlue to-aires-blue rounded-full blur opacity-30"></div>
            <div className="relative bg-white p-2 rounded-full">
              <Bot className="h-8 w-8 text-aires-blue" />
            </div>
          </div>

          {/* Title and Days Input Group */}
          <div className="flex items-center space-x-6 flex-1">
            <div>
              <h3 className="text-sm font-medium text-aires-darkGray">Assign an AIRES agent for your search</h3>
              <p className="text-xs text-aires-gray">Set AIRES agent search frequency in days</p>
              {isApproachingLimit && (
                <p className="text-xs text-orange-600 mt-1">
                  {isAtLimit
                    ? `Limit reached: ${savedSearches.length}/${maxSearchesLimit} searches`
                    : `Approaching limit: ${savedSearches.length}/${maxSearchesLimit} searches`
                  }
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-aires-gray" />
              <div className="flex items-center bg-white rounded-lg border border-aires-blue/20 overflow-hidden">
                <input
                  type="number"
                  min="1"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-16 px-2 py-1.5 border-0 focus:ring-0 text-center"
                />
                <span className="px-2 py-1.5 bg-aires-blue/5 text-aires-gray text-sm border-l border-aires-blue/20">days</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Assign Button with Tooltip Container */}
                <div className="relative">
                  <button
                    onClick={isAuthenticated ? saveScheduledSearch : () => {
                      toast.error('Please connect to AIRES AI first');
                      window.location.href = getAuthUrl();
                    }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    disabled={isAuthenticated && isAtLimit}
                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg transition-all duration-200 shadow-sm ${
                      !isAuthenticated
                        ? 'bg-gray-300 text-gray-500 hover:bg-gray-400'
                        : isAtLimit
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-aires-blue to-aires-lightBlue text-white hover:opacity-90'
                    }`}
                  >
                    <Save className="h-4 w-4" />
                    <span>Assign Agent</span>
                  </button>

                  {/* Tooltip */}
                  {showTooltip && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg relative">
                        {!isAuthenticated
                          ? 'Please connect to AIRES AI first to assign agents for automated searches'
                          : isAtLimit
                          ? `You have reached the maximum limit of ${maxSearchesLimit} automated searches. Please delete some existing searches to create new ones.`
                          : 'When selected, the AI agent will automatically make searches for you based on your filters and frequency and send the contacts to AIRES AI'
                        }
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assigned Agents Counter */}
                {isAuthenticated && savedSearches.length > 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-2 py-1.5 text-aires-gray hover:text-aires-darkGray bg-white/50 rounded-lg border border-aires-blue/10"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {savedSearches.length} {savedSearches.length === 1 ? 'agent currently assigned' : 'agents currently assigned'}
                      {isApproachingLimit && (
                        <span className={`ml-1 ${isAtLimit ? 'text-red-600' : 'text-orange-600'}`}>
                          ({savedSearches.length}/{maxSearchesLimit})
                        </span>
                      )}
                      </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isAuthenticated && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AIRES-AI agents</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {savedSearches.length}/{maxSearchesLimit} searches used
                    {isApproachingLimit && (
                      <span className={`ml-2 ${isAtLimit ? 'text-red-600' : 'text-orange-600'}`}>
                        {isAtLimit ? '(Limit reached)' : '(Approaching limit)'}
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <div key={search.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          Search for {search.search_params.propertyType} in {search.search_params.location}, {search.search_params.state} 
                        </h3>
                        <p className="text-sm text-gray-500">
                          Frequency: Every {search.frequency_days} days
                        </p>
                        {renderSearchDetails(search.search_params as SearchParams)}
                        {search.last_run && (
                          <p className="text-sm text-gray-500 mt-2">
                            Last run: {formatDate(search.last_run)}
                          </p>
                        )}
                        {search.next_run && (
                          <p className="text-sm text-gray-500">
                            Next run: {formatDate(search.next_run)}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(search)}
                          className="p-2 text-aires-gray hover:text-aires-darkGray hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteSearch(search.id)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Edit Search</h2>
                <button 
                  onClick={() => {
                    setEditingSearch(null);
                    setEditingParams(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingSearch.frequency_days}
                    onChange={(e) => setEditingSearch({
                      ...editingSearch,
                      frequency_days: parseInt(e.target.value, 10)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aires-green focus:border-transparent"
                  />
                </div>

                {editingParams && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Search Parameters</h3>
                    <SearchFilters
                      searchParams={editingParams}
                      setSearchParams={setEditingParams}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setEditingSearch(null);
                      setEditingParams(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateSearch(editingSearch)}
                    className="px-4 py-2 bg-aires-blue text-white rounded-lg hover:bg-opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutomatedSearch;