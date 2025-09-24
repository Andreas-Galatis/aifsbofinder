/**
 * Utility module for Go High Level (GHL) integration
 * Handles exporting property data to GHL via OAuth API with duplicate prevention
 */
import axios from 'axios';
import { PropertyData } from '../types';
import { hasValidGHLCredentials } from '../services/ghlAuth';
import { SearchParams } from '../types';
import { supabase } from '../lib/supabase';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
// delay helper function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates an axios instance with authorization headers
 */
const createGHLClient = () => {
  const token = localStorage.getItem('ghl_access_token');
  console.log('🔧 Creating GHL client with token:', token ? '[REDACTED]' : 'No token found');
  
  return axios.create({
    baseURL: GHL_API_BASE,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
};

const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
};

/**
 * Searches for an existing contact in GHL using multiple criteria
 */
const searchContact = async (client: any, locationId: string, agentName: string, phone: string) => {
  console.log('🔍 Searching for contact:', { agentName, phone, locationId });
  
  try {
    // Split name into first and last
    const [firstName = '', lastName = ''] = agentName.split(' ').map(part => part.trim());
    const formattedPhone = phone !== 'N/A' ? formatPhoneNumber(phone) : null;

    console.log('🔍 Search criteria:', {
      firstName,
      lastName,
      formattedPhone,
      locationId
    });

    // Try phone search first if available
    if (formattedPhone) {
      console.log('📱 Searching by phone:', formattedPhone);
      const phoneSearch = await client.post('/contacts/search', {
        locationId,
        page: 1,
        pageLimit: 1,
        filters: [{
          field: 'phone',
          operator: 'eq',
          value: formattedPhone
        }]
      });

      console.log('📱 Phone search response:', phoneSearch.data);

      if (phoneSearch.data.contacts?.[0]) {
        console.log('✅ Contact found by phone:', phoneSearch.data.contacts[0]);
        return phoneSearch.data.contacts[0];
      }
    }

    console.log('❌ No existing contact found');
    return null;
  } catch (error) {
    console.error('🚫 Error searching for contact:', error);
    if (axios.isAxiosError(error)) {
      console.error('Request details:', {
        url: error.config?.url,
        headers: error.config?.headers,
        response: error.response?.data
      });
    }
    return null;
  }
};

/**
 * Creates or updates a contact in GHL
 */
const createOrUpdateContact = async (
  client: any, 
  locationId: string, 
  existingContact: any | null, 
  contactData: any
) => {
  try {
    if (existingContact) {
      console.log('🔄 Updating existing contact:', existingContact.id);
      console.log('📝 Update data:', contactData);
      
      // Update existing contact
      const updatedTags = [...new Set([...(existingContact.tags || []), ...contactData.tags])];
      console.log('🏷️ Merged tags:', updatedTags);
      
      const response = await client.put(`/contacts/${existingContact.id}`, {
        ...contactData,
        tags: updatedTags
      });
      console.log('✅ Contact updated successfully:', response.data);
      return existingContact.id;
    } else {
      console.log('➕ Creating new contact');
      console.log('📝 Contact data:', contactData);
      
      // Create new contact
      const response = await client.post('/contacts/', {
        ...contactData,
        locationId
      });
      console.log('✅ New contact created:', response.data);
      return response.data.contact.id;
    }
  } catch (error) {
    console.error('🚫 Error in createOrUpdateContact:', error);
    if (axios.isAxiosError(error)) {
      console.error('Request details:', {
        url: error.config?.url,
        headers: error.config?.headers,
        response: error.response?.data
      });
    }
    throw error;
  }
};


/**
 * Exports property data to GHL as a contact
 */
export const exportToGHL = async (
  propertyData: PropertyData, 
  searchParams: SearchParams,
  progressCallback: (completed: number, total: number) => void = () => {}
): Promise<void> => {
  console.log('📤 Starting export to GHL:', propertyData);

  if (!hasValidGHLCredentials()) {
    console.error('❌ Invalid GHL credentials or token expired');
    throw new Error('AIRES AI authentication required');
  }

  const locationId = localStorage.getItem('ghl_location_id');
  if (!locationId) {
    throw new Error('AIRES AI location ID missing');
  }

  const client = createGHLClient();

  try {
    // Split agent name into first and last name
    const [firstName = '', lastName = ''] = (propertyData.listingAgent.name || '').split(' ').map(part => part.trim());

    console.log('👤 Agent details:', {
      name: propertyData.listingAgent.name,
      firstName,
      lastName,
      phone: propertyData.listingAgent.phone
    });

    // Search for existing contact
    const existingContact = await searchContact(
      client,
      locationId,
      propertyData.listingAgent.name,
      propertyData.listingAgent.phone
    );

    // Prepare contact data with FSBO-specific information
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
      ]
    };

    console.log('📝 Prepared contact data:', contactData);

    const currentCount = (searchParams.exportedCount || 0) + 1;
    const totalCount = searchParams.totalCount || 1;

    // Create or update the contact
    const contactId = await createOrUpdateContact(client, locationId, existingContact, contactData);
    console.log('✅ Export completed successfully. Contact ID:', contactId);

     
   // Store the export in search_results without a search_id for manual searches
    const { error: insertError } = await supabase
      .from('search_results')
      .insert({
        property_data: propertyData,
        exported_to_ghl: true
      });

    if (insertError) {
      console.error('Error storing search result:', insertError);
      throw new Error(`Failed to store search result: ${insertError.message}`);
    }

    progressCallback(currentCount, totalCount);
    await delay(100);

  } catch (error) {
    console.error('🚫 Error exporting to AIRES AI:', error);
    if (axios.isAxiosError(error)) {
      console.error('Request details:', {
        url: error.config?.url,
        headers: error.config?.headers,
        response: error.response?.data
      });
    }
    throw error;
  }
};