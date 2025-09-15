/*
  # Create search results schema

  1. New Tables
    - `search_results`
      - `id` (uuid, primary key)
      - `search_id` (uuid, references scheduled_searches)
      - `property_data` (jsonb, not null)
      - `exported_to_ghl` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `search_results` table
    - Add policy for authenticated users to access their own search results
    - Add foreign key constraint to scheduled_searches
*/

CREATE TABLE IF NOT EXISTS search_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid REFERENCES scheduled_searches(id) ON DELETE CASCADE,
  property_data jsonb NOT NULL,
  exported_to_ghl boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id text,
  company_id text
);

ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own search results with user context"
  ON search_results
  FOR ALL
  USING (
    (search_id IS NULL) OR  -- Allow manual searches (no search_id)
    EXISTS (
      SELECT 1 FROM scheduled_searches s
      WHERE s.id = search_results.search_id
      AND s.ghl_location_id = current_setting('app.ghl_location_id', true)
      AND (
        s.user_id IS NULL OR 
        s.user_id = current_setting('app.current_user_id', true)::text
      )
      AND (
        s.company_id IS NULL OR 
        s.company_id = current_setting('app.current_company_id', true)::text
      )
    )
  );

COMMENT ON TABLE search_results IS 'Results from scheduled property searches';