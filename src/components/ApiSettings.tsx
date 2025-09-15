/**
 * API Settings Modal Component
 * Manages API keys and webhook URLs for external service integration
 */
import React, { useState } from 'react';
import { X, Key, Link } from 'lucide-react';

interface ApiSettingsProps {
  onClose: () => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ onClose }) => {
  // Initialize settings from localStorage
  const [settings, setSettings] = useState({
    rapidApiKey: localStorage.getItem('rapidApiKey') || '',
    ghlWebhookUrl: localStorage.getItem('ghlWebhookUrl') || ''
  });

  /**
   * Saves settings to localStorage and closes the modal
   */
  const handleSave = () => {
    localStorage.setItem('rapidApiKey', settings.rapidApiKey);
    localStorage.setItem('ghlWebhookUrl', settings.ghlWebhookUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">API Settings</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close settings"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Rapid API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Rapid API Key
                </div>
              </label>
              <input
                type="password"
                value={settings.rapidApiKey}
                onChange={(e) => setSettings({ ...settings, rapidApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your Rapid API key"
              />
            </div>

            {/* GHL Webhook URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Link className="h-4 w-4 mr-2" />
                  GHL Webhook URL
                </div>
              </label>
              <input
                type="url"
                value={settings.ghlWebhookUrl}
                onChange={(e) => setSettings({ ...settings, ghlWebhookUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your GHL webhook URL"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;