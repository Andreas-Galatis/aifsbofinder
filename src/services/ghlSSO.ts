/* import CryptoJS from 'crypto-js';
import { exchangeCodeForToken } from './ghlAuth';

interface GHLUserData {
  userId: string;
  locationId: string;
  companyId: string;
  sessionKey: string;
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

  private decryptPayload(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ssoKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to decrypt SSO payload:', error);
      throw new Error('Invalid SSO payload');
    }
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

    console.log('Received message:', event.data);
  }

  public async getUserInfo(): Promise<GHLUserData> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for GHL response'));
      }, 5000);

      const messageHandler = async (event: MessageEvent) => {
        const allowedOrigins = [
          'https://app.gohighlevel.com',
          'https://marketplace.leadconnectorhq.com'
        ];

        if (!allowedOrigins.includes(event.origin)) {
          return;
        }

        if (event.data.message === 'REQUEST_USER_DATA_RESPONSE') {
          clearTimeout(timeoutId);
          window.removeEventListener('message', messageHandler);

          try {
            // Decrypt the SSO payload using the SSO key
            const decryptedData = this.decryptPayload(event.data.payload);
            console.log('Decrypted SSO data:', decryptedData);

            // Use the existing token exchange function from ghlAuth
            const tokenData = await exchangeCodeForToken(decryptedData.code);
            console.log('Token exchange successful:', tokenData);

            // Store the tokens and location ID
            localStorage.setItem('ghl_access_token', tokenData.access_token);
            localStorage.setItem('ghl_location_id', decryptedData.activeLocation);
            localStorage.setItem('ghl_token_expiry', String(Date.now() + tokenData.expires_in * 1000));

            resolve({
              userId: decryptedData.userId,
              locationId: decryptedData.activeLocation,
              companyId: decryptedData.companyId,
              sessionKey: decryptedData.code
            });
          } catch (error) {
            console.error('Failed to process SSO data:', error);
            reject(error);
          }
        }
      };

      window.addEventListener('message', messageHandler);

      try {
        window.parent.postMessage({ 
          message: 'REQUEST_USER_DATA',
          origin: window.location.origin
        }, '*');
      } catch (error) {
        clearTimeout(timeoutId);
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
*/