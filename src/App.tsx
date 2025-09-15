import React, { useEffect } from 'react';
import { Building2, Database } from 'lucide-react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import PropertySearch from './components/PropertySearch';
import OAuthCallback from './components/OAuthCallback';
import ConnectToGHLButton from './components/ghl/ConnectToGHLButton';
import { checkGHLSession } from './services/ghlAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    const initializeSSO = async () => {
      try {
        const sessionData = await checkGHLSession();
        if (sessionData.isAuthenticated) {
          // Session exists, tokens will be handled by useGHLAuth
          console.log('SSO session detected');
        }
      } catch (error) {
        console.error('Error checking SSO session:', error);
      }
    };

    initializeSSO();
  }, []);

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
                        <ConnectToGHLButton />
                        <a
                          href="#"
                          className="flex items-center text-sm text-aires-gray hover:text-aires-darkGray"
                          title="View Documentation"
                        >
                          <Database className="h-5 w-5 mr-1" />
                          Docs
                        </a>
                      </div>
                    </div>
                  </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <PropertySearch />
                </main>

                <ToastContainer
                  position="bottom-right"
                  autoClose={3000}
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