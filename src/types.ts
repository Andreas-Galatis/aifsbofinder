// Type definitions for the property data interface
export interface PropertyData {
  // Basic property identification
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;

  // Core property characteristics
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl: string;
  propertyType: string;

  // Additional property details
  zestimate?: number;        // Zillow's estimated market value
  taxValue?: number;         // Tax assessed value
  zillowLink?: string;       // Direct link to Zillow listing
  lotSize?: number;          // Property lot size
  neighborhood?: string;     // Neighborhood name
  subdivision?: string;      // Subdivision name
  yearBuilt?: number;        // Year the property was built
  description?: string;      // Full property description

  // Listing agent information
  listingAgent: {
    name: string;
    brokerName?: string;
    phone: string;
    email: string;
  };
}

// Search parameters interface for property queries
export interface SearchParams {
  // Location parameters
  location: string;          // City name
  state: string;            // State code (e.g., CA)
  
  // Property type filters
  propertyType: string;     // General property type
  homeType: string[];       // Specific home types (e.g., SingleFamily, Condo)
  
  // Price range
  minPrice: string;
  maxPrice: string;
  
  // Sorting and pagination
  sort: string;             // Sort order (e.g., newest, price)
  
  // Property characteristics filters
  beds: string;             // Minimum number of bedrooms
  baths: string;            // Minimum number of bathrooms
  minSqft: string;          // Minimum square footage
  maxSqft: string;          // Maximum square footage
  minYear: string;          // Minimum year built
  maxYear: string;          // Maximum year built

  // Listing Types
  listingType: string;      // For sale by agent or owner
}