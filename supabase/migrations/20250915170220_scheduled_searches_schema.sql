/*
  # Create scheduled searches schema

  1. New Tables
    - `scheduled_searches`
      - `id` (uuid, primary key)
      - `ghl_location_id` (text, not null)
      - `search_params` (jsonb, not null)
      - `frequency_days` (integer, not null)
      - `last_run` (timestamptz)
      - `next_run` (timestamptz)
      - `created_at` (timestamptz)
      - `active` (boolean)

  2. Security
    - Enable RLS on `scheduled_searches` table
    - Add policy for authenticated users to manage their own searches based on GHL location ID
*/

CREATE TABLE IF NOT EXISTS scheduled_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_location_id text NOT NULL,
  search_params jsonb NOT NULL,
  frequency_days integer NOT NULL,
  last_run timestamptz,
  next_run timestamptz,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  user_id text,
  company_id text
);

ALTER TABLE scheduled_searches ENABLE ROW LEVEL SECURITY;

REATE POLICY "Users can manage their own searches with user context"
  ON scheduled_searches
  FOR ALL
  USING (
    ghl_location_id = current_setting('app.ghl_location_id', true)
    AND (
      user_id IS NULL OR 
      user_id = current_setting('app.current_user_id', true)::text
    )
    AND (
      company_id IS NULL OR 
      company_id = current_setting('app.current_company_id', true)::text
    )
  );

COMMENT ON TABLE scheduled_searches IS 'Scheduled property searches for GHL locations';