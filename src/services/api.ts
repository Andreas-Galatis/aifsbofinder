import axios, { AxiosError } from 'axios';
import { SearchParams } from '../types';

const RAPID_API_KEY = import.meta.env.VITE_RAPID_API_KEY;
const RAPID_API_HOST = import.meta.env.VITE_RAPID_API_HOST;

export const propertyApi = axios.create({
  baseURL: `https://${RAPID_API_HOST}`,
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': RAPID_API_HOST,
  },
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    throw {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data
    };
  }
  throw { message: 'An unexpected error occurred' };
};

// Property type mapping with API parameters
const propertyTypeMap = {
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
      name: 'Loading...',
      brokerName: 'Loading...',
      phone: 'Loading...',
      email: 'Loading...',
      photo: null
    }
  };
};


const getListingAgentDetails = async (zpid: string, listingType: string) => {
  try {
    await delay(500);
    const response = await propertyApi.get('/propertyV2', {
      params: { zpid }
    });

    // Log the response to debug
    console.log('Property Details Response:', response.data);

    const propertyData = response.data || {};
    const yearBuilt = response.data?.yearBuilt;
    const county = response.data?.county;
    const attributionInfo = response.data?.attributionInfo || {};

    // check if FSBO
    if (propertyData.listing_sub_type.is_FSBO === true) {
      listingType = 'by_owner_other';
    } else { listingType = 'by_agent'; }


    // Add FSBO phone number handling
    if (listingType === 'by_owner_other') {
      // Extract FSBO phone from listedBy array if available
      const listedBy = propertyData.listedBy || [];
      console.log('ListedBy data:', listedBy);

      //const phoneElement = listedBy[0]?.elements?.find(item => item.id === 'PHONE');
      //const fsboPhone = phoneElement?.text || 'N/A';
      const fsboPhone = (`${response.data?.listing_agent.phone.areacode || ''} ${response.data?.listing_agent.phone.prefix || ''} ${response.data?.listing_agent.phone.number || ''}`) || 'N/A';
      console.log('FSBO phone:', fsboPhone);
      
      
      return {
        name: 'Property Owner', // Default name for FSBO
        brokerName: 'For Sale By Owner',
        phone: fsboPhone || 'N/A',
        email: 'N/A',
        photo: null,
        yearBuilt: yearBuilt || null,
        county: county || 'N/A'
      };
    }
    
    return {
      name: attributionInfo.agentName || 'N/A',
      brokerName: attributionInfo.brokerName || 'N/A',
      phone: attributionInfo.agentPhoneNumber || 'N/A',
      email: attributionInfo.agentEmail || 'N/A',
      photo: null,
      yearBuilt: yearBuilt || null,
      county: county || 'N/A'
    };

    

  } catch (error) {
    console.warn('Failed to fetch agent details:', error);
    return {
      name: 'N/A',
      brokerName: 'N/A',
      phone: 'N/A',
      email: 'N/A',
      photo: null
    };
  }
};

// Main search function
export const searchProperties = async (
  params: SearchParams,
  onPageLoaded: (pageProperties: any[]) => void
) => {
  try {
    // Initialize all property types as false
    const propertyTypeParams = Object.fromEntries(
      allPropertyTypes.map(type => [type, false])
    );

    // If specific types are selected, set only those to true
    if (params.homeType.length > 0) {
      params.homeType.forEach(type => {
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

    //const MAX_PAGES = 20;
    const allProperties: any[] = [];
    let totalPages = 1; // Default to 1 in case totalPages is not available

    for (let page = 1; page <= totalPages; page++) {
      const fetchPage = async () => {
        const response = await propertyApi.get('/search', {
          params: {
            location: `${params.location}, ${params.state}`,
            status: 'forSale',
            page: page.toString(), // Dynamic page number
            price_min: params.minPrice || '0',
            price_max: params.maxPrice || '10000000',
            beds_min: params.beds || '0',
            baths_min: params.baths || '0',
            sqft_min: params.minSqft || '0',
            sqft_max: params.maxSqft || '10000000',
            built_min: params.minYear || '1800',
            built_max: params.maxYear || '2025',
            listing_type: params.listingType,
            isForSaleByOwner: params.listingType === 'by_owner_other' ? 'true' : 'false',
            isForSaleByAgent: params.listingType === 'by_agent' ? 'true' : 'false',
            isForSaleForeclosure: 'false',
            isAuction: 'false',

            ...propertyTypeParams,
          },
        });

        
        console.log('Search Params:', response.config.params);
        console.log('Property Search Response:',page, response.data);

        const pageProperties = (response.data.results || []).map(mapProperty);
        allProperties.push(...pageProperties);

        onPageLoaded(pageProperties);

        // Extract totalPages from the first response
        if (page === 1 && response.data.totalPages) {
          totalPages = response.data.totalPages;
        }

        return pageProperties.length > 0; // Return whether there are more results
      };

      // Fetch the page and limit the rate
      const hasMore = await fetchPage();
      if (!hasMore) break;

      // Rate limit: 2 calls per second
      await delay(500); // 500 ms between calls
    }

      return {
        properties: allProperties,
        total: allProperties.length,
        loadAgentDetails: async (onAgentDetailsLoaded: (propertyId: string, agentDetails: any) => void) => {
          for (const property of allProperties) {
            // Pass listingType to getListingAgentDetails
            const agentDetails = await getListingAgentDetails(property.id, params.listingType);
            if (agentDetails.yearBuilt) {
              property.yearBuilt = agentDetails.yearBuilt;
            }
            property.county = agentDetails.county;
            onAgentDetailsLoaded(property.id, agentDetails);
          }
        },
      };
    
  } catch (error) {
    handleError(error);
  }
};

// Get property details by ZPID
export const getPropertyDetails = async (propertyId: string) => {
  try {
    const [propertyResponse, agentDetails] = await Promise.all([
      propertyApi.get('/propertyV2', {
        params: { zpid: propertyId }
      }),
      getListingAgentDetails(propertyId)
    ]);

    const data = propertyResponse.data?.data;
    return {
      id: propertyId,
      address: data?.address?.streetAddress,
      city: data?.address?.city,
      state: data?.address?.state,
      county: data?.county,
      zipCode: data?.address?.zipcode,
      price: data?.list_price || 0,
      beds: data?.bedrooms,
      baths: data?.bathrooms,
      sqft: data?.living_area,
      lotSize: data?.lot_size,
      imageUrl: data?.photos?.[0] || 'https://via.placeholder.com/600x400?text=No+Image+Available',
      propertyType: data?.home_type,
      neighborhood: data?.address?.neighborhood,
      subdivision: data?.address?.subdivision,
      yearBuilt: data?.year_built,
      description: data?.description || 'No description available.',
      listingAgent: agentDetails,
      hdpUrl: data?.hdpUrl
    };
  } catch (error) {
    handleError(error);
  }
};