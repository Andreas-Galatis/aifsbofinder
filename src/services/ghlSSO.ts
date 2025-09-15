import CryptoJS from 'crypto-js';
import { exchangeCodeForToken } from './ghlAuth';

interface GHLUserData {
  userId: string;
  locationId: string;
  companyId: string;
  sessionKey: string;
  type: 'agency' | 'location';
  role: string;
  userName: string;
  email: string;
  activeLocation?: string;
}

class GHLSSOService {
  private static instance: GHLSSOService;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private readonly ssoKey: string;

  private constructor() {
    this.ssoKey = import.meta.env.VITE_GHL_SSO_KEY;
    this.messageListener = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageListener);
  }

  public static getInstance(): GHLSSOService {
    if (!GHLSSOService.instance) {
      GHLSSOService.instance = new GHLSSOService();
    }
    return GHLSSOService.instance;
  }

  private handleMessage(event: MessageEvent) {
    const allowedOrigins = [
      'https://app.gohighlevel.com',
      'https://marketplace.leadconnectorhq.com'
    ];

    if (!allowedOrigins.includes(event.origin)) {
      console.warn('Received message from unauthorized origin:', event.origin);
      return;
    }

    console.log('Received postMessage event:', {
      origin: event.origin,
      message: event.data?.message
    });
  }

  public async getUserInfo(): Promise<GHLUserData> {
    console.log('Requesting user info from GHL...');
    return new Promise((resolve, reject) => {
      const messageHandler = async (event: MessageEvent) => {
        const allowedOrigins = [
          'https://app.gohighlevel.com',
          'https://marketplace.leadconnectorhq.com'
        ];

        if (!allowedOrigins.includes(event.origin)) {
          return;
        }

        if (event.data.message === 'REQUEST_USER_DATA_RESPONSE') {
          window.removeEventListener('message', messageHandler);

          try {
            console.log('Received user data response from GHL');
            
            // Send encrypted data to Netlify function for decryption
            const response = await fetch('/.netlify/functions/decrypt-user-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ encryptedData: event.data.payload })
            });

            if (!response.ok) {
              throw new Error('Failed to decrypt user data');
            }

            const userData = await response.json();
            console.log('Successfully decrypted user data');

            // Exchange code for token
            console.log('Exchanging code for token...');
            const tokenData = await exchangeCodeForToken(userData.code);
            console.log('Token exchange successful:', {
              hasAccessToken: !!tokenData.access_token,
              hasRefreshToken: !!tokenData.refresh_token,
              locationId: tokenData.locationId
            });

            // Store tokens and location ID
            localStorage.setItem('ghl_access_token', tokenData.access_token);
            localStorage.setItem('ghl_location_id', userData.activeLocation || '');
            localStorage.setItem('ghl_token_expiry', String(Date.now() + tokenData.expires_in * 1000));
            localStorage.setItem('ghl_user_id', userData.userId);
            localStorage.setItem('ghl_company_id', userData.companyId);
            localStorage.setItem('ghl_user_type', userData.type);
            localStorage.setItem('ghl_user_role', userData.role);

            console.log('Successfully stored user data in localStorage');

            resolve({
              userId: userData.userId,
              locationId: userData.activeLocation || '',
              companyId: userData.companyId,
              sessionKey: userData.code,
              type: userData.type,
              role: userData.role,
              userName: userData.userName,
              email: userData.email,
              activeLocation: userData.activeLocation
            });
          } catch (error) {
            console.error('Failed to process SSO data:', error);
            reject(error);
          }
        }
      };

      try {
        // Add event listener before sending message
        window.addEventListener('message', messageHandler);
        
        console.log('Sending REQUEST_USER_DATA message to parent window');
        window.parent.postMessage({ 
          message: 'REQUEST_USER_DATA',
          origin: window.location.origin
        }, '*');
      } catch (error) {
        console.error('Failed to send message to parent window:', error);
        window.removeEventListener('message', messageHandler);
        reject(error);
      }
    });
  }

  public cleanup() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }
}

export const ghlSSO = GHLSSOService.getInstance();