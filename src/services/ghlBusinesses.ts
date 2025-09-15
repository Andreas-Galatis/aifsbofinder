import axios from 'axios';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GHLBusiness {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  description: string;
  state: string;
  postalCode: string;
  country: string;
  locationId: string;
}

export const getBusinessByLocation = async (locationId: string, accessToken: string): Promise<GHLBusiness | null> => {
  // const token = localStorage.getItem('ghl_access_token');
  
  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    const response = await axios.get(`${GHL_API_BASE}/businesses/`, {
      params: { locationId },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    if (response.data.businesses && response.data.businesses.length > 0) {
      return response.data.businesses[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching business data:', error);
    throw error;
  }
};
