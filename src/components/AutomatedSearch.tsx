import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, X, Trash2, Bot } from 'lucide-react';
import { SearchParams } from '../types';
import { toast } from 'react-toastify';
import { databaseService } from '../services/database';

interface AutomatedSearchProps {
  currentSearchParams: SearchParams;
  onSearch: () => Promise<void>;
}

const AutomatedSearch: React.FC<AutomatedSearchProps> = ({
  currentSearchParams,
  onSearch
}) => {
  const [frequency, setFrequency] = useState('7');
  const [savedSearches, setSavedSearches] = useState<unknown[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    const searches = await databaseService.getSavedSearches();
    setSavedSearches(searches);
  };

  const saveScheduledSearch = async () => {
    try {
      setLoading(true);

      // Perform initial search
      await onSearch();

      // Save to database
      await databaseService.saveSearch(
        currentSearchParams,
        parseInt(frequency)
      );

      // Reload searches
      await loadSavedSearches();

      toast.success('FSBO search scheduled and saved to database!');
    } catch {
      toast.error('Failed to save search');
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      await databaseService.deleteSearch(searchId);
      await loadSavedSearches();
    } catch {
      toast.error('Failed to delete search');
    }
  };

  return (
    <>
      <div className="mt-6 border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-aires-blue" />
            <h3 className="text-lg font-semibold text-gray-900">
              FSBO Auto-Search Agent
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-r from-aires-blue/5 to-aires-lightBlue/5 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            Schedule automated searches for FSBO properties and save them to the database.
            The AI agent will find For Sale By Owner listings and export them to AIRES AI.
          </p>

          <div className="flex items-center justify-between">
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
                <span className="px-2 py-1.5 bg-aires-blue/5 text-aires-gray text-sm border-l border-aires-blue/20">
                  days
                </span>
              </div>

              <button
                onClick={saveScheduledSearch}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-aires-blue to-aires-lightBlue text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save FSBO Search</span>
              </button>

              {savedSearches.length > 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center px-2 py-1.5 text-aires-gray hover:text-aires-darkGray bg-white/50 rounded-lg border border-aires-blue/10"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {savedSearches.length} saved {savedSearches.length === 1 ? 'search' : 'searches'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing saved searches */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Saved FSBO Searches
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {savedSearches.map((search: any) => (
                  <div key={search.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          FSBO Properties in {search.search_params.location}, {search.search_params.state}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Frequency: Every {search.frequency_days} days
                        </p>
                        {search.last_run && (
                          <p className="text-sm text-gray-500 mt-2">
                            Last run: {new Date(search.last_run).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => deleteSearch(search.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
    </>
  );
};

export default AutomatedSearch;