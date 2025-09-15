export interface GHLTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    locationId: string;
  }
  
  export interface GHLError {
    message: string;
    code: string;
    status: number;
  }