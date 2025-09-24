import React, { useState } from 'react';
import { Building2, MapPin, Bed, Bath, Square, List, Grid, Download, ExternalLink, Phone, Mail, Calendar, Home, Check, Landmark, TrendingUpIcon, Map} from 'lucide-react';
import { PropertyData } from '../types';
import PropertyDetails from './PropertyDetails';
import { exportToGHL } from '../utils/ghlIntegration';
import { hasValidGHLCredentials, getAuthUrl } from '../services/ghlAuth';
import { toast } from 'react-toastify';

interface PropertyListProps {
  properties: PropertyData[];
  loading: boolean;
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
  }
}

const PropertyList: React.FC<PropertyListProps> = ({ properties = [], loading, searchParams }) => {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const isAllSelected = properties.length > 0 && properties.every(p => selectedProperties.has(p.id));
  

  const handleExport = async (property: PropertyData) => {
    try {
      if (!hasValidGHLCredentials()) {
        window.location.href = getAuthUrl();
        return;
      }
      await exportToGHL(property, searchParams);
      toast.success('Property exported to AIRES AI successfully');
    } catch {
      toast.error('Failed to export property to AIRES AI');
    }
  };

  const handleExportAll = async () => {
    try {
      setExportLoading(true);
      setExportProgress(0);

      const totalProperties = properties.length;
      let completedCount = 0;

      for (let i = 0; i < totalProperties; i++) {
        await exportToGHL(properties[i], searchParams);
        completedCount++;
        const progress = Math.round((completedCount / totalProperties) * 100);
        setExportProgress(progress);
      }

      toast.success('All properties exported to AIRES AI successfully');
    } catch {
      toast.error('Failed to export properties to AIRES AI');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportSelected = async () => {
    try {
      setExportLoading(true);
      setExportProgress(0);

      const selectedProps = properties.filter(p => selectedProperties.has(p.id));
      const totalProperties = selectedProps.length;
      let completedCount = 0;

      for (const property of selectedProps) {
        await exportToGHL(property, searchParams);
        completedCount++;
        const progress = Math.round((completedCount / totalProperties) * 100);
        setExportProgress(progress);
      }

      toast.success('Selected properties exported to AIRES AI successfully');
    } catch {
      toast.error('Failed to export properties to AIRES AI');
    } finally {
      setExportLoading(false);
    }
  };

  const togglePropertySelection = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    setSelectedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllSelected) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(properties.map(p => p.id)));
    }
  };

  const formatPrice = (price: number = 0) => {
    return price.toLocaleString();
  };

  const formatNumber = (num: number = 0) => {
    return num.toLocaleString();
  };

  if (exportLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Exporting Properties...</h3>
          <div className="w-64 bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-gray-700">{exportProgress}% completed</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!Array.isArray(properties) || properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No properties found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search parameters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewType('grid')}
              className={`p-2 rounded-lg ${viewType === 'grid' ? 'bg-aires-blue text-white' : 'bg-gray-100'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-2 rounded-lg ${viewType === 'list' ? 'bg-aires-blue text-white' : 'bg-gray-100'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          {viewType === 'list' && (
            <button
              onClick={toggleSelectAll}
              className="text-sm text-aires-gray hover:text-aires-blue flex items-center space-x-2"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                selectedProperties.size === properties.length 
                  ? 'bg-aires-blue text-white' 
                  : 'border-2 border-aires-blue'
              }`}>
                {isAllSelected && <Check className="h-3 w-3" />}
              </div>
              <span>{isAllSelected ? 'Unselect All' : 'Select All'}</span>
            </button>
          )}
        </div>
        {viewType === 'list' && selectedProperties.size > 0 ? (
          <button
            onClick={handleExportSelected}
            className="flex items-center px-4 py-2 bg-aires-blue text-white rounded-lg hover:bg-opacity-90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Selected ({selectedProperties.size})
          </button>
        ) : (
          <button
            onClick={handleExportAll}
            className="flex items-center px-4 py-2 bg-aires-blue text-white rounded-lg hover:bg-opacity-90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </button>
        )}
      </div>
      
      <div className={viewType === 'grid' ? 
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
        "space-y-4"
      }>
        {properties.map((property, index) => (
          <div 
          key={`${property.id}-${index}`} 
            className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${
              viewType === 'list' ? 'flex' : ''
            }`}
            onClick={() => setSelectedProperty(property)}
          >
            <div className="relative">
              <img
                src={property.imageUrl}
                alt={property.address}
                className={viewType === 'list' ? "w-48 h-32 object-cover" : "w-full h-48 object-cover"}
              />
              {viewType === 'list' && (
                <div 
                  className="absolute top-2 left-2"
                  onClick={(e) => togglePropertySelection(e, property.id)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    selectedProperties.has(property.id) 
                      ? 'bg-aires-blue text-white' 
                      : 'bg-white border-2 border-aires-blue'
                  }`}>
                    {selectedProperties.has(property.id) && <Check className="h-4 w-4" />}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">${formatPrice(property.price)}</h3>
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <p className="text-sm">{property.address}, {property.city}, {property.state} {property.zipCode}</p>
                  </div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Map className="h-4 w-4 mr-1" />
                    <p className="text-sm">{property.county}</p>
                  </div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Home className="h-4 w-4 mr-1" />
                    <p className="text-sm">{property.propertyType}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(property);
                  }}
                  className="p-2 text-aires-gray hover:text-aires-blue"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  <span>{property.beds} beds</span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  <span>{property.baths} baths</span>
                </div>
                <div className="flex items-center">
                  <Square className="h-4 w-4 mr-1" />
                  <span>{formatNumber(property.sqft)} sqft</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Built {property.yearBuilt || 'N/A'}</span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Landmark className="h-4 w-4 mr-1" />
                  <span>Tax value ${formatPrice(property.taxValue) || 'N/A'}</span>
                </div>  
              </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <TrendingUpIcon className="h-4 w-4 mr-1" />
                  <span>Zestimate  ${formatPrice(property.zestimate) || 'N/A'}</span>
                </div>
              

              {property.listingAgent && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {property.listingAgent.brokerName === 'For Sale By Owner' ? 'Listed By Owner' : property.listingAgent.name}
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {property.listingAgent.phone !== 'N/A' && (
                      <a 
                        href={`tel:${property.listingAgent.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center hover:text-aires-blue"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{property.listingAgent.phone}</span>
                      </a>
                    )}
                    {property.listingAgent.brokerName !== 'For Sale By Owner' && property.listingAgent.email !== 'N/A' && (
                      <a 
                        href={`mailto:${property.listingAgent.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center hover:text-aires-blue"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onExport={handleExport}
        />
      )}
    </>
  );
};

export default PropertyList;