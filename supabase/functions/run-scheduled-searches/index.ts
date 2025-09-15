import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { searchProperties } from './propertySearch.ts';
import { exportToGHL } from './ghlIntegration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function handleScheduledSearches() {
  try {
    // Get only the next scheduled search that is due to run
    const { data: searches, error: searchError } = await supabaseClient
      .from('scheduled_searches')
      .select('*')
      .eq('active', true)
      .lte('next_run', new Date().toISOString())
      .order('next_run', { ascending: true })
      .limit(1);

    if (searchError) throw searchError;

    // If no searches are due, return early
    if (!searches || searches.length === 0) {
      console.log('No scheduled searches due to run');
      return new Response(JSON.stringify({ 
        message: 'No scheduled searches due to run',
        total_searches: 0,
        processed: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const search = searches[0];
    console.log(`Processing search ${search.id} for location ${search.ghl_location_id}`);

    try {
      // Run the property search
      const properties = await searchProperties(search.search_params);
      console.log(`Found ${properties.length} properties for search ${search.id}`);

      // Store results in database
      const { error: insertError } = await supabaseClient
        .from('search_results')
        .insert(
          properties.map(property => ({
            search_id: search.id,
            property_data: property,
            exported_to_ghl: false
          }))
        );

      if (insertError) throw insertError;

      // Export results to GHL with individual error handling
      let exportedCount = 0;
      let exportErrors = 0;
      const exportDetails = [];

      for (const property of properties) {
        try {
          await exportToGHL(property, search.search_params, search.ghl_location_id);
          
          // Mark as exported
          await supabaseClient
            .from('search_results')
            .update({ exported_to_ghl: true })
            .eq('search_id', search.id)
            .eq('property_data->>id', property.id);

          exportedCount++;
        } catch (exportError) {
          console.error(`Error exporting property ${property.id}:`, exportError);
          exportErrors++;
          exportDetails.push({
            property_id: property.id,
            error: exportError.message
          });
        }

        // Add delay between exports
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update search run times
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + search.frequency_days);

      await supabaseClient
        .from('scheduled_searches')
        .update({
          last_run: new Date().toISOString(),
          next_run: nextRun.toISOString()
        })
        .eq('id', search.id);

      return new Response(JSON.stringify({
        message: 'Search processed successfully',
        total_searches: 1,
        processed: 1,
        errors: exportErrors,
        details: {
          search_id: search.id,
          properties_found: properties.length,
          properties_exported: exportedCount,
          export_errors: exportErrors,
          export_error_details: exportDetails
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (error) {
      console.error(`Error processing search ${search.id}:`, error);
      return new Response(JSON.stringify({
        message: 'Error processing search',
        total_searches: 1,
        processed: 0,
        errors: 1,
        details: {
          search_id: search.id,
          error: error.message
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  } catch (error) {
    console.error('Error in handleScheduledSearches:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      total_searches: 0,
      processed: 0,
      errors: 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  return handleScheduledSearches();
});