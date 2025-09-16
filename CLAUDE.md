# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint on TypeScript/React files
- `npm run preview` - Preview production build locally
- `npm run deploy:functions` - Deploy Supabase functions to production (project: hetvcsfpcfvcpvruwben)

## Architecture Overview

This is a React + TypeScript property search application with GHL (GoHighLevel) CRM integration and Supabase backend.

### Key Components
- **React 18** with TypeScript for the frontend
- **Supabase** for database, auth, and edge functions
- **Vite** for build tooling and development server
- **TailwindCSS** with custom AIRES color scheme
- **React Query** for API state management
- **React Router** for routing including OAuth callback handling

### Core Features
1. **Property Search**: Main interface for searching properties via external APIs
2. **GHL Integration**: OAuth authentication and CRM data synchronization
3. **Automated Searches**: Scheduled property searches via Supabase edge functions
4. **Real-time Updates**: Property data integration with toast notifications

### Directory Structure
- `src/components/` - React components (PropertySearch, PropertyList, etc.)
- `src/services/` - API integrations (GHL auth, database operations, property search)
- `src/lib/` - Supabase client and database type definitions
- `src/utils/` - Utility functions for GHL integration and Git operations
- `supabase/functions/` - Edge functions for scheduled searches and token refresh
- `supabase/migrations/` - Database schema migrations

### Environment Variables Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_RAPID_API_KEY` - RapidAPI key for property data
- `VITE_RAPID_API_HOST` - RapidAPI host (zillow56.p.rapidapi.com)

### Database Integration
- Uses Supabase with PostgreSQL
- Row Level Security (RLS) implemented
- Custom RPC functions for GHL location and user context management
- Scheduled searches and search results tables

### GHL OAuth Flow
1. User clicks "Connect to GHL" button
2. Redirected to GHL OAuth authorization
3. OAuth callback handled at `/oauth/callback` route
4. Tokens stored and user context set in Supabase
5. Location selection for CRM integration

### Supabase Edge Functions
- `run-scheduled-searches` - Executes automated property searches
- `refresh-tokens` - Handles GHL token refresh for expired sessions