import axios from 'axios';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GHLLocation {
  id: string;
  name: string;
  companyId: string;
  domain: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
  timezone: string;
}

export const getLocationById = async (locationId: string, accessToken: string): Promise<GHLLocation | null> => {
  if (!accessToken) {
    throw new Error('No access token provided');
  }

  try {
    const response = await axios.get(`${GHL_API_BASE}/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    if (response.data.location) {
      return response.data.location;
    }

    return null;
  } catch (error) {
    console.error('Error fetching location data:', error);
    throw error;
  }
};