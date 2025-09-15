/**
 * Modal component for displaying detailed property information
 * Shows extended property details and provides export functionality
 */
import React from 'react';
import { X, Phone, Mail, ExternalLink } from 'lucide-react';
import { PropertyData } from '../types';

interface PropertyDetailsProps {
  property: PropertyData;
  onClose: () => void;
  onExport: (property: PropertyData) => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onClose, onExport }) => {
  /**
   * Formats currency values with proper formatting
   * @param value Number to format as currency
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  /**
   * Formats number values with proper separators
   * @param value Number to format
   */
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900">{property.address}, {property.city}, {property.state} {property.zipCode}</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close details"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Property Image */}
          <div className="mt-6">
            <img 
              src={property.imageUrl} 
              alt={property.address} 
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>

          {/* Property Details Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-semibold">{formatCurrency(property.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-semibold">{property.propertyType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bedrooms</p>
                <p className="font-semibold">{property.beds}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bathrooms</p>
                <p className="font-semibold">{property.baths}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Square Feet</p>
                <p className="font-semibold">{formatNumber(property.sqft)}</p>
              </div>
              {property.yearBuilt && (
                <div>
                  <p className="text-sm text-gray-500">Year Built</p>
                  <p className="font-semibold">{property.yearBuilt}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Zestimate</p>
                <p className="font-semibold">{formatCurrency(property.zestimate ?? 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax Value</p>
                <p className="font-semibold">{formatCurrency(property.taxValue ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* Listing Agent Section */}
          <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">
            {property.listingAgent.brokerName === 'For Sale By Owner' ? 'Contact Information' : 'Listing Agent'}
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold">
              {property.listingAgent.brokerName === 'For Sale By Owner' ? 'Listed By Owner' : property.listingAgent.name}
            </p>
            {property.listingAgent.brokerName !== 'For Sale By Owner' && property.listingAgent.brokerName && (
              <p className="text-sm text-gray-600">{property.listingAgent.brokerName}</p>
            )}
            <div className="mt-2 space-y-2">
              {property.listingAgent.phone !== 'N/A' && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <a 
                    href={`tel:${property.listingAgent.phone}`}
                    className="hover:text-blue-600"
                  >
                    {property.listingAgent.phone}
                  </a>
                </div>
              )}
              {property.listingAgent.brokerName !== 'For Sale By Owner' && property.listingAgent.email !== 'N/A' && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <a 
                    href={`mailto:${property.listingAgent.email}`}
                    className="hover:text-blue-600"
                  >
                    {property.listingAgent.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => window.open(property.zillowLink, '_blank')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Zillow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;