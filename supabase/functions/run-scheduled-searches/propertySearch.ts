import { SearchParams, PropertyData } from './types.ts';

const RAPID_API_HOST = Deno.env.get('RAPID_API_HOST');
const RAPID_API_KEY = Deno.env.get('RAPID_API_KEY');
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Property type mapping with API parameters
const propertyTypeMap: { [key: string]: string } = {
  'Houses': 'isSingleFamily',
  'Apartments': 'isApartment',
  'Condos': 'isCondo',
  'Townhomes': 'isTownhouse',
  'Manufactured': 'isManufactured',
  'Lots/Land': 'isLotLand',
  'Multi-family': 'isMultiFamily'
};

// All property type parameters
const allPropertyTypes = Object.values(propertyTypeMap);

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, params: Record<string, string>) => {
  const queryParams = new URLSearchParams(params);
  const url = `https://${RAPID_API_HOST}${endpoint}?${queryParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPID_API_KEY,
      'X-RapidAPI-Host': RAPID_API_HOST,
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

const mapProperty = (property: any) => {
  // Format address for URL
  const formattedAddress = `${property.streetAddress}-${property.city}-${property.state}-${property.zipcode}`.replace(/\s+/g, '-');

  return {
    id: property.zpid,
    address: property.streetAddress,
    city: property.city,
    state: property.state,
    county: property.county,
    zipCode: property.zipcode,
    price: property.price || 0,
    beds: property.bedrooms || 0,
    baths: property.bathrooms || 0,
    sqft: property.livingArea || 0,
    imageUrl: property.imgSrc || 'https://via.placeholder.com/400x300?text=No+Image',
    propertyType: property.homeType,
    zestimate: property.zestimate,
    taxValue: property.taxAssessedValue,
    zillowLink: `https://www.zillow.com/homedetails/${formattedAddress}/${property.zpid}_zpid/`,
    lotSize: property.lotSize,
    yearBuilt: property.yearBuilt || null,
    description: property.description,
    listingAgent: {
      name: property.listingAgent?.name || 'N/A',
      brokerName: property.listingOffice?.name || 'N/A',
      phone: property.listingAgent?.phone || 'N/A',
      email: property.listingAgent?.email || 'N/A',
      photo: null
    }
  };
};

const getListingAgentDetails = async (zpid: string) => {
  try {
    await delay(500);
    const data = await makeApiRequest('/propertyV2', { zpid });

    const propertyData = data || {};
    const yearBuilt = data?.yearBuilt;
    const county = data?.county;

    // Check if property is FSBO
    const isFSBO = propertyData.listing_sub_type?.is_FSBO === true ||
                   propertyData.listingAgent?.brokerName === 'For Sale By Owner';

    if (!isFSBO) {
      // Skip non-FSBO properties
      return null;
    }

    // Extract FSBO phone number from new API structure
    const fsboPhone = (() => {
      try {
        // Navigate: listedBy[0].elements[0-n] to find element with id: "PHONE"
        const listedBy = propertyData.listedBy;
        if (Array.isArray(listedBy) && listedBy.length > 0) {
          const elements = listedBy[0].elements;
          if (Array.isArray(elements)) {
            const phoneElement = elements.find((el: any) => el.id === "PHONE");
            if (phoneElement && phoneElement.text) {
              return phoneElement.text; // Returns "(202) 344-7523" format
            }
          }
        }
        return 'N/A';
      } catch {
        return 'N/A';
      }
    })();

    return {
      name: 'Property Owner',
      brokerName: 'For Sale By Owner',
      phone: fsboPhone || 'N/A',
      email: 'N/A',
      photo: null,
      yearBuilt: yearBuilt || null,
      county: county || 'N/A',
      isFSBO: true
    };
  } catch (error) {
    console.warn('Failed to fetch property details:', error);
    return null;
  }
};

// Main search function - FSBO ONLY
export const searchProperties = async (
  params: SearchParams,
  onPageLoaded: (pageProperties: any[]) => void
) => {
  try {
    // Force FSBO listing type
    const searchParams = {
      ...params,
      listingType: 'by_owner' // Force FSBO only
    };

    // Initialize all property types as false
    const propertyTypeParams = Object.fromEntries(
      allPropertyTypes.map(type => [type, false])
    );

    // If specific types are selected, set only those to true
    if (searchParams.homeType && searchParams.homeType.length > 0) {
      searchParams.homeType.forEach((type: string) => {
        if (propertyTypeMap[type]) {
          propertyTypeParams[propertyTypeMap[type]] = true;
        }
      });
    } else {
      // If no types selected, set all to true to show everything
      Object.keys(propertyTypeParams).forEach(key => {
        propertyTypeParams[key] = true;
      });
    }

    const allProperties: any[] = [];
    let totalPages = 1; // Default to 1 in case totalPages is not available

    for (let page = 1; page <= totalPages; page++) {
      const fetchPage = async () => {
        try {
          const apiParams = {
            location: `${searchParams.location}, ${searchParams.state}`,
            status: 'forSale',
            page: page.toString(),
            price_min: searchParams.minPrice || '0',
            price_max: searchParams.maxPrice || '10000000',
            beds_min: searchParams.beds || '0',
            baths_min: searchParams.baths || '0',
            sqft_min: searchParams.minSqft || '0',
            sqft_max: searchParams.maxSqft || '10000000',
            built_min: searchParams.minYear || '1800',
            built_max: searchParams.maxYear || '2025',
            listing_type: 'by_owner_other',
            isForSaleByOwner: 'true', // Force FSBO
            isForSaleByAgent: 'false', // Exclude agent listings
            isComingSoon: 'false',
            isForSaleForeclosure: 'false',
            isAuction: 'false',
            isNewConstruction: 'false',
            ...Object.fromEntries(
              Object.entries(propertyTypeParams).map(([key, value]) => [key, value.toString()])
            )
          };

          const data = await makeApiRequest('/search', apiParams);

          console.log('FSBO Search Params:', apiParams);
          console.log('FSBO Property Search Response:', page, data);

          const pageProperties = (data?.results || []).map(mapProperty);
          allProperties.push(...pageProperties);

          // onPageLoaded(pageProperties);

          // Extract totalPages from the first response
          if (page === 1 && data?.totalPages) {
            totalPages = data.totalPages;
          }

          return pageProperties.length > 0;
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error);
          throw error;
        }
      };

      const hasMore = await fetchPage();
      if (!hasMore) break;

      // Rate limit: 2 calls per second
      await delay(500);
    }

    // Filter to only include FSBO properties
    const fsboProperties = [];

    for (const property of allProperties) {
      try {
        const agentDetails = await getListingAgentDetails(property.id);
        if (agentDetails && agentDetails.isFSBO) {
          property.listingAgent = agentDetails;
          property.yearBuilt = agentDetails.yearBuilt;
          property.county = agentDetails.county;
          fsboProperties.push(property);
        }
      } catch (error) {
        console.error(`Error processing property ${property.id}:`, error);
        // Continue with other properties
      }
    }

    return {
      properties: fsboProperties,
      total: fsboProperties.length,
      loadAgentDetails: async (callback: (id: string, agent: any) => void) => {
        // Agent details already loaded during filtering
        fsboProperties.forEach(property => {
          callback(property.id, property.listingAgent);
        });
      }
    };

  } catch (error) {
    console.error('Error in searchProperties:', error);
    throw error;
  }
};