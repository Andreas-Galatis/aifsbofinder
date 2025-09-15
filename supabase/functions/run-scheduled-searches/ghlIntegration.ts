import { PropertyData, SearchParams } from './types.ts';
import { TokenManager } from './tokenManager.ts';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const tokenManager = new TokenManager();

const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
};

const createOrUpdateContact = async (
  locationId: string,
  contactData: any,
  accessToken: string
) => {
  console.log('Creating/Updating contact:', { locationId, contactData });

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers,
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Contact upsert failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Contact upsert failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.contact.id;
  } catch (error) {
    console.error('Error in createOrUpdateContact:', error);
    throw error;
  }
};

export const exportToGHL = async (
  propertyData: PropertyData,
  searchParams: SearchParams,
  locationId: string
): Promise<void> => {
  console.log('Starting export to GHL:', { locationId, propertyData, searchParams });
  
  try {
    const accessToken = await tokenManager.getValidToken(locationId);
    if (!accessToken) {
      throw new Error('No valid access token found');
    }

    const companyId = await tokenManager.getCompanyId(locationId);
    if (!companyId) {
      throw new Error('No company ID found');
    }

    const [firstName = '', lastName = ''] = (propertyData.listingAgent.name || '').split(' ').map(part => part.trim());
    // Combine address1 and address2 if address2 is present and not blank
    const fullAddress1 = propertyData.address2 && propertyData.address2.trim() !== ''
      ? `${propertyData.address1} ${propertyData.address2}`
      : propertyData.address1;

   const contactData = {
      firstName: 'FSBO',
      lastName: propertyData.address.split(',')[0],
      name: `FSBO - ${propertyData.address}`,
      phone: propertyData.listingAgent.phone !== 'N/A'
        ? formatPhoneNumber(propertyData.listingAgent.phone)
        : null,
      address1: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      postalCode: propertyData.zipCode,
      website: propertyData.zillowLink,
      country: 'US',
      companyName: 'For Sale By Owner',
      source: 'AIRES FSBO Finder',
      tags: [
        'ai-fsbo-finder',
        'FSBO',
        'for-sale-by-owner',
        propertyData.propertyType,
        propertyData.city,
        propertyData.state,
        propertyData.county,
        `fsbo-${new Date().toLocaleDateString()}`,
      ],
      customFields: {
        property_price: propertyData.price,
        beds: propertyData.beds,
        baths: propertyData.baths,
        sqft: propertyData.sqft,
        year_built: propertyData.yearBuilt
      }
    };

    await createOrUpdateContact(locationId, contactData, accessToken);
    // console.log('Successfully exported contact to GHL');
    
    // await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error('Error exporting to GHL:', error);
    throw error;
  }
};