export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      scheduled_searches: {
        Row: {
          id: string
          ghl_location_id: string
          search_params: Json
          frequency_days: number
          last_run: string | null
          next_run: string | null
          created_at: string | null
          active: boolean | null
        }
        Insert: {
          id?: string
          ghl_location_id: string
          search_params: Json
          frequency_days: number
          last_run?: string | null
          next_run?: string | null
          created_at?: string | null
          active?: boolean | null
        }
        Update: {
          id?: string
          ghl_location_id?: string
          search_params?: Json
          frequency_days?: number
          last_run?: string | null
          next_run?: string | null
          created_at?: string | null
          active?: boolean | null
        }
      }
      search_results: {
        Row: {
          id: string
          search_id: string | null
          property_data: Json
          exported_to_ghl: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          search_id?: string | null
          property_data: Json
          exported_to_ghl?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          search_id?: string | null
          property_data?: Json
          exported_to_ghl?: boolean | null
          created_at?: string | null
        }
      }
      ghl_service_tokens: {
        Row: {
          id: string
          location_id: string
          access_token: string
          refresh_token: string | null
          expires_at: string
          created_at: string | null
          updated_at: string | null
          company_id: string
          max_searches_limit: number
        }
        Insert: {
          id?: string
          location_id: string
          access_token: string
          refresh_token?: string | null
          expires_at: string
          created_at?: string | null
          updated_at?: string | null
          company_id: string
          max_searches_limit?: number
        }
        Update: {
          id?: string
          location_id?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: string
          created_at?: string | null
          updated_at?: string | null
          company_id?: string
          max_searches_limit?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_ghl_location_id: {
        Args: {
          location_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}