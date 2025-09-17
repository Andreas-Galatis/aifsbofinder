import React, { useEffect } from 'react';
import { Building2, Database } from 'lucide-react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import PropertySearch from './components/PropertySearch';
import OAuthCallback from './components/OAuthCallback';
import ConnectToGHLButton from './components/ConnectToGHLButton';
import { checkGHLSession } from './services/ghlAuth';
import { setGHLLocationId } from './lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const sessionData = await checkGHLSession();
        if (sessionData.isAuthenticated) {
          const locationId = localStorage.getItem('ghl_location_id');
          if (locationId) {
            await setGHLLocationId(locationId);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleConnectionChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aires-lightGray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aires-blue mx-auto"></div>
          <p className="mt-4 text-aires-darkGray">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-aires-lightGray">
                <header className="bg-white border-b border-gray-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-8 w-8 text-aires-blue" />
                        <div>
                          <h1 className="text-xl font-bold text-aires-darkGray">AIRES Property Finder</h1>
                          <p className="text-sm text-aires-gray">Property Data Integration</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <ConnectToGHLButton onConnectionChange={handleConnectionChange} />
                      </div>
                    </div>
                  </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <PropertySearch key={refreshKey}/>
                </main>

                <ToastContainer
                  position="bottom-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </div>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;