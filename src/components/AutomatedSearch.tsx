import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, X, Edit2, Trash2, Filter, Bot } from 'lucide-react';
import { SearchParams } from '../types';
import { toast } from 'react-toastify';
import SearchFilters from './SearchFilters';
import { searchProperties } from '../services/api';

interface AutomatedSearchProps {
  currentSearchParams: SearchParams;
  onSearch: () => Promise<void>;
}

interface ScheduledSearch {
  id: string;
  frequency: string;
  searchParams: SearchParams;
  lastRun?: string;
  nextRun?: string;
}

const AutomatedSearch: React.FC<AutomatedSearchProps> = ({ currentSearchParams, onSearch }) => {
  const [frequency, setFrequency] = useState('7'); // Default to 7 days
  const [savedSearches, setSavedSearches] = useState<ScheduledSearch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<ScheduledSearch | null>(null);
  const [editingParams, setEditingParams] = useState<SearchParams | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  useEffect(() => {
    const searches = JSON.parse(localStorage.getItem('scheduledSearches') || '[]');
    setSavedSearches(searches);
  }, []);

  const saveScheduledSearch = async () => {
    try {
      // Perform initial search using the passed function
      await onSearch();
      
      const newSearch: ScheduledSearch = {
        id: crypto.randomUUID(),
        frequency,
        searchParams: currentSearchParams,
        lastRun: new Date().toISOString(),
        nextRun: getNextRunDate(frequency)
      };
      
      const updatedSearches = [...savedSearches, newSearch];
      localStorage.setItem('scheduledSearches', JSON.stringify(updatedSearches));
      setSavedSearches(updatedSearches);
      
      toast.success('Search scheduled and initial search completed!');
    } catch (error) {
      toast.error('Failed to perform initial search');
    }
  };

  const updateSearch = (search: ScheduledSearch) => {
    const updatedSearch = {
      ...search,
      searchParams: editingParams || search.searchParams,
      nextRun: getNextRunDate(search.frequency)
    };
    
    const updatedSearches = savedSearches.map(s => 
      s.id === search.id ? updatedSearch : s
    );
    localStorage.setItem('scheduledSearches', JSON.stringify(updatedSearches));
    setSavedSearches(updatedSearches);
    setEditingSearch(null);
    setEditingParams(null);
    toast.success('Search updated successfully!');
  };

  const startEditing = (search: ScheduledSearch) => {
    setEditingSearch(search);
    setEditingParams(search.searchParams);
  };

  const deleteSearch = (id: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== id);
    localStorage.setItem('scheduledSearches', JSON.stringify(updatedSearches));
    setSavedSearches(updatedSearches);
    toast.success('Search deleted successfully!');
  };
  
  const getNextRunDate = (days: string) => {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(days, 10));
    return date.toISOString();
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
    if (params.homeType.length > 0) {
      filters.push(`Types: ${params.homeType.join(', ')}`);
    }
    filters.push(`Listing: ${params.listingType === 'by_agent' ? 'By Agent' : 'For Sale by Owner'}`);

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
                    onClick={saveScheduledSearch}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-aires-blue to-aires-lightBlue text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Assign Agent</span>
                  </button>

                  {/* Tooltip */}
                  {showTooltip && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg relative">
                        When selected, the AI agent will automatically make searches for you based on your filters and frequency and send the contacts to AIRES AI
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assigned Agents Counter */}
                {savedSearches.length > 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-2 py-1.5 text-aires-gray hover:text-aires-darkGray bg-white/50 rounded-lg border border-aires-blue/10"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{savedSearches.length} {savedSearches.length === 1 ? 'agent currently assigned' : 'agents currently assigned'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">AIRES-AI agents</h2>
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
                          Search for {search.searchParams.location}, {search.searchParams.state}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Frequency: Every {search.frequency} days
                        </p>
                        {renderSearchDetails(search.searchParams)}
                        {search.lastRun && (
                          <p className="text-sm text-gray-500 mt-2">
                            Last run: {formatDate(search.lastRun)}
                          </p>
                        )}
                        {search.nextRun && (
                          <p className="text-sm text-gray-500">
                            Next run: {formatDate(search.nextRun)}
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
                    value={editingSearch.frequency}
                    onChange={(e) => setEditingSearch({
                      ...editingSearch,
                      frequency: e.target.value
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