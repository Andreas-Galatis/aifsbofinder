import { supabase } from '../lib/supabase';
import { SearchParams } from '../types';
import { toast } from 'react-toastify';

export const databaseService = {
  // Save a new search
  async saveSearch(searchParams: SearchParams, frequencyDays: number) {
    try {
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + frequencyDays);

      const { data, error } = await supabase
        .from('searches')
        .insert({
          search_params: searchParams,
          frequency_days: frequencyDays,
          last_run: new Date().toISOString(),
          next_run: nextRun.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
      throw error;
    }
  },

  // Get all saved searches
  async getSavedSearches() {
    try {
      const { data, error } = await supabase
        .from('searches')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching searches:', error);
      return [];
    }
  },

  // Update a search
  async updateSearch(searchId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('searches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', searchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating search:', error);
      toast.error('Failed to update search');
      throw error;
    }
  },

  // Delete a search
  async deleteSearch(searchId: string) {
    try {
      const { error } = await supabase
        .from('searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      toast.success('Search deleted successfully');
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
      throw error;
    }
  },

  // Save search results
  async saveSearchResults(searchId: string, properties: any[]) {
    try {
      const results = properties.map(property => ({
        search_id: searchId,
        property_data: property,
        exported_to_ghl: false
      }));

      const { error } = await supabase
        .from('search_results')
        .insert(results);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving search results:', error);
    }
  },

  // Mark results as exported to GHL
  async markAsExportedToGHL(resultIds: string[], ghlContactIds: string[]) {
    try {
      const updates = resultIds.map((id, index) => ({
        id,
        exported_to_ghl: true,
        ghl_contact_id: ghlContactIds[index]
      }));

      for (const update of updates) {
        await supabase
          .from('search_results')
          .update({
            exported_to_ghl: update.exported_to_ghl,
            ghl_contact_id: update.ghl_contact_id
          })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating export status:', error);
    }
  }
};