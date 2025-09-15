import { supabase } from './supabase';
import { searchProperties } from './api';
import { exportToGHL } from '../utils/ghlIntegration';
import { databaseService } from './database';

export const searchRunner = {
  async runScheduledSearches() {
    try {
      // Get all searches that need to run
      const { data: searches, error } = await supabase
        .from('searches')
        .select('*')
        .eq('is_active', true)
        .lte('next_run', new Date().toISOString());

      if (error) throw error;

      for (const search of searches || []) {
        await this.runSingleSearch(search);
      }
    } catch (error) {
      console.error('Error running scheduled searches:', error);
    }
  },

  async runSingleSearch(search: any) {
    try {
      console.log(`Running FSBO search for ${search.search_params.location}, ${search.search_params.state}`);

      // Perform the search
      const results = await searchProperties(search.search_params, () => {});

      if (results && results.properties) {
        // Save results to database
        await databaseService.saveSearchResults(search.id, results.properties);

        // Export to GHL
        for (const property of results.properties) {
          try {
            await exportToGHL(property);
          } catch (error) {
            console.error('Error exporting to GHL:', error);
          }
        }

        // Update search record
        const nextRun = new Date();
        nextRun.setDate(nextRun.getDate() + search.frequency_days);

        await databaseService.updateSearch(search.id, {
          last_run: new Date().toISOString(),
          next_run: nextRun.toISOString()
        });

        console.log(`Completed FSBO search for ${search.search_params.location}, found ${results.properties.length} properties`);
      }
    } catch (error) {
      console.error(`Error running search ${search.id}:`, error);
    }
  }
};