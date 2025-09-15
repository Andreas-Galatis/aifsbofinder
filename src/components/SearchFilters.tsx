import React from 'react';
import { Filter, Home, DollarSign, Maximize, BedDouble, Bath, UserCheck, Calendar } from 'lucide-react';

interface SearchFiltersProps {
  searchParams: {
    location: string;
    state: string;
    propertyType: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
    beds: string;
    baths: string;
    minSqft: string;
    maxSqft: string;
    minYear: string;
    maxYear: string;
    homeType: string[];
    listingType: string;
  };
  setSearchParams: (params: any) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ searchParams, setSearchParams }) => {
  const homeTypes = [
    'Houses',
    'Apartments',
    'Condos',
    'Townhomes',
    'Manufactured',
    'Lots/Land',
    'Multi-family'
  ];

  const handleHomeTypeToggle = (type: string) => {
    const currentTypes = searchParams.homeType;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    setSearchParams({ ...searchParams, homeType: newTypes });
  };

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aires-green focus:border-transparent";
  const buttonClasses = (active: boolean) => `px-3 py-1 rounded-full text-sm ${
    active
      ? 'bg-aires-green bg-opacity-20 text-aires-darkGray border-aires-green'
      : 'bg-gray-100 text-aires-gray border-gray-200'
  } border hover:bg-aires-green hover:bg-opacity-10`;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-aires-gray mr-2" />
        <h3 className="text-sm font-medium text-aires-darkGray">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Listing Type Filter 
        <div className="space-y-2">
          <label className="block text-sm font-medium text-aires-darkGray mb-1">
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 mr-1 text-aires-gray" />
              Listing Type
            </div>
          </label>
          <select
            value={searchParams.listingType}
            onChange={(e) => setSearchParams({ ...searchParams, listingType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aires-green focus:border-transparent"
          >
            <option value="by_agent">Listed by Agent</option> 
            <option value="by_owner_other">For Sale by Owner</option>
          </select>
        </div>
        */}

        {/* Price Range Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-aires-darkGray mb-1">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-aires-gray" />
              Price Range
            </div>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Min Price"
              value={searchParams.minPrice || ''}
              onChange={(e) => setSearchParams({ ...searchParams, minPrice: e.target.value })}
              className={inputClasses}
            />
            <input
              type="text"
              placeholder="Max Price"
              value={searchParams.maxPrice || ''}
              onChange={(e) => setSearchParams({ ...searchParams, maxPrice: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Beds & Baths Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-aires-darkGray mb-1">
            <div className="flex items-center">
              <BedDouble className="h-4 w-4 mr-1 text-aires-gray" />
              Beds & Baths
            </div>
          </label>
          <div className="flex space-x-2">
            <select
              value={searchParams.beds}
              onChange={(e) => setSearchParams({ ...searchParams, beds: e.target.value })}
              className={inputClasses}
            >
              <option value="">Beds</option>
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}+ beds</option>
              ))}
            </select>
            <select
              value={searchParams.baths}
              onChange={(e) => setSearchParams({ ...searchParams, baths: e.target.value })}
              className={inputClasses}
            >
              <option value="">Baths</option>
              {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                <option key={num} value={num}>{num}+ baths</option>
              ))}
            </select>
          </div>
        </div>

        {/* Square Footage Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-aires-darkGray mb-1">
            <div className="flex items-center">
              <Maximize className="h-4 w-4 mr-1 text-aires-gray" />
              Square Feet
            </div>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Min Sqft"
              value={searchParams.minSqft || ''}
              onChange={(e) => setSearchParams({ ...searchParams, minSqft: e.target.value })}
              className={inputClasses}
            />
            <input
              type="text"
              placeholder="Max Sqft"
              value={searchParams.maxSqft || ''}
              onChange={(e) => setSearchParams({ ...searchParams, maxSqft: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Year Built Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-aires-darkGray mb-1">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-aires-gray" />
              Year Built
            </div>
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min Year"
              value={searchParams.minYear || ''}
              onChange={(e) => setSearchParams({ ...searchParams, minYear: e.target.value })}
              min="1800"
              max={new Date().getFullYear()}
              className={inputClasses}
            />
            <input
              type="number"
              placeholder="Max Year"
              value={searchParams.maxYear || ''}
              onChange={(e) => setSearchParams({ ...searchParams, maxYear: e.target.value })}
              min="1800"
              max={new Date().getFullYear()}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Home Type Filter */}
        <div className="space-y-2 lg:col-span-2">
          <label className="block text-sm font-medium text-aires-darkGray mb-1">
            <div className="flex items-center">
              <Home className="h-4 w-4 mr-1 text-aires-gray" />
              Home Type
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            {homeTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleHomeTypeToggle(type)}
                className={buttonClasses(searchParams.homeType.includes(type))}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;