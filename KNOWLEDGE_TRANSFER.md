# AIRES Property Finder - Knowledge Transfer Document

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Backend - Supabase Edge Functions](#backend---supabase-edge-functions)
6. [Frontend Architecture](#frontend-architecture)
7. [GHL OAuth Integration](#ghl-oauth-integration)
8. [Key Features & Workflows](#key-features--workflows)
9. [Environment Setup](#environment-setup)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance Tasks](#maintenance-tasks)

---

## Application Overview

**AIRES Property Finder** is a React-based web application that helps users find For Sale By Owner (FSBO) properties and export them to the GoHighLevel (GHL) CRM platform. The application features:

- Property search via RapidAPI (Zillow data)
- OAuth integration with GoHighLevel CRM
- Automated scheduled searches with AI agents
- Real-time property data synchronization
- Contact management and duplicate prevention

### Key Use Cases
1. Manual property searches with advanced filtering
2. Automated scheduled searches that run on a frequency
3. Export property listings as contacts to GHL CRM
4. Manage multiple automated search agents

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling with custom AIRES theme
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Toastify** - Toast notifications
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Real-time capabilities

### External APIs
- **RapidAPI (Zillow56)** - Property data
- **GoHighLevel API** - CRM integration

### Development Tools
- **ESLint** - Linting
- **PostCSS/Autoprefixer** - CSS processing
- **Git** - Version control

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│  (Vite Dev Server / Static Build)                      │
│                                                         │
│  Components:                                            │
│  - PropertySearch                                       │
│  - AutomatedSearch                                      │
│  - PropertyList                                         │
│  - OAuthCallback                                        │
└────────────┬────────────────────────────────────────────┘
             │
             │ API Calls (HTTPS)
             │
┌────────────▼────────────────────────────────────────────┐
│                    Supabase Backend                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database                     │   │
│  │  - scheduled_searches                           │   │
│  │  - search_results                               │   │
│  │  - RLS Policies                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Edge Functions (Deno)                   │   │
│  │  - run-scheduled-searches                       │   │
│  │  - refresh-tokens                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
             │
             │ External API Calls
             │
┌────────────┴────────────────────────────────────────────┐
│                   External Services                     │
│                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐   │
│  │   RapidAPI (Zillow)  │   │  GoHighLevel OAuth   │   │
│  │   Property Search    │   │  CRM Integration     │   │
│  └──────────────────────┘   └──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
aifsbofinder/
├── src/
│   ├── components/          # React components
│   │   ├── PropertySearch.tsx       # Main search interface
│   │   ├── PropertyList.tsx         # Property results display
│   │   ├── PropertyDetails.tsx      # Individual property details
│   │   ├── AutomatedSearch.tsx      # Scheduled search management
│   │   ├── SearchFilters.tsx        # Advanced search filters
│   │   ├── ConnectToGHLButton.tsx   # GHL OAuth button
│   │   └── OAuthCallback.tsx        # OAuth callback handler
│   │
│   ├── services/            # Business logic & API integrations
│   │   ├── api.ts                   # RapidAPI property search
│   │   ├── ghlAuth.ts               # GHL OAuth authentication
│   │   ├── ghlLocations.ts          # GHL location management
│   │   ├── ghlBusinesses.ts         # GHL business data
│   │   ├── database.ts              # Supabase database operations
│   │   ├── scheduledSearches.ts     # Scheduled search CRUD
│   │   └── tokenService.ts          # Token management
│   │
│   ├── utils/               # Utility functions
│   │   ├── ghlIntegration.ts        # Export properties to GHL
│   │   └── gitUtils.ts              # Git operations
│   │
│   ├── lib/                 # Configuration & types
│   │   ├── supabase.ts              # Supabase client setup
│   │   └── database.types.ts        # TypeScript database types
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts                 # Core types
│   │   └── ghl.ts                   # GHL-specific types
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useGHLAuth.ts            # GHL authentication hook
│   │
│   ├── App.tsx              # Main app component
│   └── main.tsx             # App entry point
│
├── supabase/
│   ├── functions/           # Edge functions
│   │   ├── run-scheduled-searches/
│   │   │   ├── index.ts             # Main edge function handler
│   │   │   ├── propertySearch.ts    # Property search logic
│   │   │   ├── ghlIntegration.ts    # GHL export logic
│   │   │   ├── tokenManager.ts      # Token refresh logic
│   │   │   └── types.ts             # Type definitions
│   │   └── refresh-tokens/
│   │       └── index.ts             # Token refresh edge function
│   │
│   └── migrations/          # Database migrations
│       ├── 20250915170220_scheduled_searches_schema.sql
│       └── 20250915170242_search_results_schema.sql
│
├── public/                  # Static assets
├── .env                     # Environment variables (not committed)
├── package.json             # Dependencies & scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
└── CLAUDE.md               # Development documentation
```

---

## Database Schema

The application uses PostgreSQL via Supabase with two main tables:

### Table: `scheduled_searches`

Stores automated search configurations assigned by users.

```sql
CREATE TABLE scheduled_searches (
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
```

**Column Descriptions:**
- `id` - Unique identifier for the scheduled search
- `ghl_location_id` - GHL location ID (used for RLS filtering)
- `search_params` - JSONB object containing search filters (city, state, price range, etc.)
- `frequency_days` - How often to run the search (e.g., every 7 days)
- `last_run` - Timestamp of last execution
- `next_run` - Timestamp when the search should run next
- `active` - Whether the search is currently active
- `user_id` - GHL user ID (for multi-user support)
- `company_id` - GHL company ID (for multi-tenant support)

**Row Level Security (RLS):**
```sql
CREATE POLICY "Users can manage their own searches with user context"
  ON scheduled_searches
  FOR ALL
  USING (
    ghl_location_id = current_setting('app.ghl_location_id', true)
    AND (user_id IS NULL OR user_id = current_setting('app.current_user_id', true)::text)
    AND (company_id IS NULL OR company_id = current_setting('app.current_company_id', true)::text)
  );
```

This ensures users can only access scheduled searches for their own GHL location and account.

### Table: `search_results`

Stores individual property results from searches.

```sql
CREATE TABLE search_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid REFERENCES scheduled_searches(id) ON DELETE CASCADE,
  property_data jsonb NOT NULL,
  exported_to_ghl boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id text,
  company_id text
);
```

**Column Descriptions:**
- `id` - Unique identifier
- `search_id` - Foreign key to `scheduled_searches` (NULL for manual searches)
- `property_data` - JSONB object containing full property information
- `exported_to_ghl` - Whether property has been exported to GHL CRM
- `user_id` / `company_id` - User context for RLS

**Row Level Security (RLS):**
```sql
CREATE POLICY "Users can access their own search results with user context"
  ON search_results
  FOR ALL
  USING (
    (search_id IS NULL) OR  -- Allow manual searches
    EXISTS (
      SELECT 1 FROM scheduled_searches s
      WHERE s.id = search_results.search_id
      AND s.ghl_location_id = current_setting('app.ghl_location_id', true)
      AND (s.user_id IS NULL OR s.user_id = current_setting('app.current_user_id', true)::text)
      AND (s.company_id IS NULL OR s.company_id = current_setting('app.current_user_id', true)::text)
    )
  );
```

### Database Context Functions

The application uses Supabase's session context to filter data:

**Location: [src/lib/supabase.ts](src/lib/supabase.ts:30)**

```typescript
export const setGHLLocationId = async (locationId: string) => {
  const { data, error } = await supabase.rpc('set_ghl_location_context', {
    location_id: locationId
  });
  // This sets the context for RLS policies
};
```

---

## Backend - Supabase Edge Functions

Edge functions run on Supabase's infrastructure using Deno runtime. They handle scheduled search execution and token refresh.

### Edge Function: `run-scheduled-searches`

**Location: [supabase/functions/run-scheduled-searches/index.ts](supabase/functions/run-scheduled-searches/index.ts)**

**Purpose:** Executes scheduled property searches and exports results to GHL.

**Workflow:**
1. Query the database for scheduled searches where `next_run <= NOW()`
2. Process **one search at a time** (FIFO based on `next_run` timestamp)
3. Execute property search via RapidAPI
4. Store results in `search_results` table
5. Export each property to GHL CRM as a contact
6. Update `last_run` and `next_run` timestamps
7. Mark properties as `exported_to_ghl = true`

**Key Files:**
- `index.ts` - Main handler and orchestration
- `propertySearch.ts` - RapidAPI integration for property searches
- `ghlIntegration.ts` - GHL contact creation/update logic
- `tokenManager.ts` - Token refresh for expired GHL tokens

**Invocation:**
This function is designed to be triggered by:
- Supabase cron jobs (recommended every 5-15 minutes)
- Manual HTTP POST request
- Webhook trigger

**Response Format:**
```json
{
  "message": "Search processed successfully",
  "total_searches": 1,
  "processed": 1,
  "errors": 0,
  "details": {
    "search_id": "uuid",
    "properties_found": 10,
    "properties_exported": 10,
    "export_errors": 0,
    "export_error_details": []
  }
}
```

**Deployment Command:**
```bash
npm run deploy:functions
```

### Edge Function: `refresh-tokens`

**Location: [supabase/functions/refresh-tokens/index.ts](supabase/functions/refresh-tokens/index.ts)**

**Purpose:** Refreshes expired GHL OAuth tokens to maintain API access.

**Note:** Token refresh is also handled client-side in [src/services/ghlAuth.ts](src/services/ghlAuth.ts:9) for immediate user interactions.

---

## Frontend Architecture

### State Management

**React Query** is used for server state management:
- Caching API responses
- Background refetching
- Optimistic updates
- Error handling

**Location: [src/App.tsx](src/App.tsx:13)**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Key Components

#### 1. PropertySearch Component
**Location: [src/components/PropertySearch.tsx](src/components/PropertySearch.tsx)**

**Purpose:** Main search interface for finding FSBO properties.

**Features:**
- Search input fields (city, state)
- Advanced filters (price, beds, baths, sqft, year built, property type)
- Dynamic search messaging with loading states
- Real-time property streaming (displays results as they arrive)
- Agent detail loading
- Export functionality

**State Management:**
```typescript
const [searchParams, setSearchParams] = useState({
  location: '',
  state: '',
  propertyType: 'all',
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
  beds: '',
  baths: '',
  minSqft: '',
  maxSqft: '',
  minYear: '',
  maxYear: '',
  homeType: [] as string[],
  listingType: 'by_owner' // Forced to FSBO only
});
```

**Key Functions:**
- `handleSearch()` - Executes manual property search
- `handleAutomatedSearch()` - Executes search for automated agents
- `exportProperties()` - Exports properties to GHL with progress tracking

#### 2. AutomatedSearch Component
**Location: [src/components/AutomatedSearch.tsx](src/components/AutomatedSearch.tsx)**

**Purpose:** Manage automated search agents (CRUD operations).

**Features:**
- Assign AI agents to perform searches on a schedule
- View all assigned agents
- Edit search parameters and frequency
- Delete agents
- Display usage limits (max 100 searches per location)
- Authentication state monitoring

**Key Functions:**
- `saveScheduledSearch()` - Creates new automated search
- `updateSearch()` - Updates existing search parameters
- `deleteSearch()` - Removes automated search
- `loadSearches()` - Fetches all scheduled searches for the current location

**Usage Limit Logic:**
```typescript
const isAtLimit = savedSearches.length >= maxSearchesLimit; // 100
const isApproachingLimit = savedSearches.length >= maxSearchesLimit * 0.9; // 90
```

#### 3. PropertyList Component
**Location: [src/components/PropertyList.tsx](src/components/PropertyList.tsx)**

**Purpose:** Display property search results in a grid/list.

**Features:**
- Property cards with images
- Key property details (price, beds, baths, sqft, year)
- Individual property export button
- Bulk export functionality
- Responsive grid layout

#### 4. OAuthCallback Component
**Location: [src/components/OAuthCallback.tsx](src/components/OAuthCallback.tsx)**

**Purpose:** Handle GHL OAuth callback after user authorization.

**Workflow:**
1. Extract `code` from URL query parameters
2. Exchange code for access/refresh tokens via [ghlAuth.ts](src/services/ghlAuth.ts:78)
3. Store tokens in localStorage
4. Set GHL location context in Supabase
5. Redirect user to main app

#### 5. ConnectToGHLButton Component
**Location: [src/components/ConnectToGHLButton.tsx](src/components/ConnectToGHLButton.tsx)**

**Purpose:** GHL authentication button with status indicator.

**Features:**
- Displays connection status (connected/disconnected)
- Initiates OAuth flow when clicked
- Location selector for multi-location accounts
- Disconnect functionality

---

## GHL OAuth Integration

### OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OAuth Flow Diagram                          │
└─────────────────────────────────────────────────────────────────────┘

1. User clicks "Connect to AIRES AI"
       │
       ▼
2. Redirect to GHL OAuth authorization URL
   https://marketplace.leadconnectorhq.com/oauth/chooselocation?
     response_type=code
     &redirect_uri=YOUR_REDIRECT_URI
     &client_id=YOUR_CLIENT_ID
     &scope=contacts.write contacts.readonly locations.readonly
       │
       ▼
3. User authorizes the application
       │
       ▼
4. GHL redirects to: YOUR_APP/oauth/callback?code=AUTH_CODE
       │
       ▼
5. Frontend exchanges code for tokens
   POST https://services.leadconnectorhq.com/oauth/token
   Body: {
     client_id, client_secret, grant_type: 'authorization_code',
     code, user_type: 'Location', redirect_uri
   }
       │
       ▼
6. Store tokens in localStorage:
   - ghl_access_token
   - ghl_refresh_token
   - ghl_token_expiry
   - ghl_location_id
   - ghl_company_id
       │
       ▼
7. Set GHL location context in Supabase
       │
       ▼
8. Application ready to export contacts
```

### Key Files

#### ghlAuth.ts
**Location: [src/services/ghlAuth.ts](src/services/ghlAuth.ts)**

**Key Functions:**

1. **`getAuthUrl()`** - Generates OAuth authorization URL
   ```typescript
   return `https://marketplace.leadconnectorhq.com/oauth/chooselocation?...`;
   ```

2. **`exchangeCodeForToken(code: string)`** - Exchanges authorization code for tokens
   - Called from OAuthCallback component
   - Stores tokens in localStorage

3. **`refreshAccessToken()`** - Refreshes expired access token
   - Automatically called when token is expired
   - Uses refresh token to get new access token

4. **`checkGHLSession()`** - Validates current authentication state
   - Checks if token exists and is not expired
   - Attempts token refresh if expired

5. **`hasValidGHLCredentials()`** - Comprehensive credential check
   - Verifies presence of: access token, location ID, company ID
   - Checks token expiration

#### ghlIntegration.ts
**Location: [src/utils/ghlIntegration.ts](src/utils/ghlIntegration.ts)**

**Purpose:** Handles exporting property data to GHL as contacts.

**Key Function: `exportToGHL()`**

**Workflow:**
1. Validate GHL credentials
2. Create GHL API client with Bearer token
3. Search for existing contact by phone number
4. Prepare contact data:
   ```typescript
   {
     firstName: 'FSBO',
     lastName: propertyData.address.split(',')[0],
     name: `FSBO - ${propertyData.address}`,
     phone: formatPhoneNumber(propertyData.listingAgent.phone),
     address1: propertyData.address,
     city: propertyData.city,
     state: propertyData.state,
     postalCode: propertyData.zipCode,
     website: propertyData.zillowLink,
     companyName: 'For Sale By Owner',
     source: 'AIRES FSBO Finder',
     tags: ['ai-fsbo-finder', 'FSBO', propertyData.city, ...]
   }
   ```
5. Create new contact or update existing contact
6. Store result in `search_results` table
7. Mark as `exported_to_ghl = true`

**Duplicate Prevention:**
- Searches by phone number before creating
- Merges tags when updating existing contacts

---

## Key Features & Workflows

### 1. Manual Property Search

**User Flow:**
1. User enters city and state
2. (Optional) User applies advanced filters
3. User clicks "Search"
4. App displays loading modal with dynamic messages
5. Properties stream in as they're found (real-time updates)
6. Agent details load asynchronously
7. Results displayed in PropertyList component
8. User can export individual properties or bulk export

**Code Flow:**
```
PropertySearch.handleSearch()
  → api.searchProperties() [RapidAPI call]
    → Pages of properties fetched
    → Each page triggers callback to update UI state
  → Agent details loaded
  → Properties displayed
```

### 2. Automated Search (AI Agent)

**User Flow:**
1. User configures search parameters
2. User sets frequency (e.g., every 7 days)
3. User clicks "Assign Agent"
4. Initial search executes immediately
5. Search saved to `scheduled_searches` table with `next_run` timestamp
6. Properties exported to GHL automatically
7. Success toast shows results (X properties found, Y exported)

**Scheduled Execution:**
```
Supabase Cron Job (every 5 minutes)
  → Trigger run-scheduled-searches edge function
    → Query for searches where next_run <= NOW()
    → Process ONE search
      → Execute property search
      → Store results in search_results
      → Export each property to GHL
      → Update last_run and next_run
```

**Code Flow:**
```
AutomatedSearch.saveScheduledSearch()
  → PropertySearch.handleAutomatedSearch()
    → api.searchProperties()
    → PropertySearch.exportProperties() [immediate export]
  → scheduledSearches.createScheduledSearch()
    → Store in database with next_run timestamp
```

### 3. Export to GHL

**Single Property Export:**
```
PropertyDetails → Export button
  → ghlIntegration.exportToGHL(property)
    → searchContact() [check for duplicate]
    → createOrUpdateContact()
      → POST /contacts/ or PUT /contacts/:id
    → Store in search_results table
```

**Bulk Export:**
```
PropertyList → Export All button
  → Loop through properties
    → exportToGHL() for each property
    → Update progress bar
  → Toast notification with summary
```

### 4. Token Refresh

**Client-Side Token Refresh:**
```
App loads
  → checkGHLSession()
    → isTokenExpired()?
      → YES: refreshAccessToken()
        → POST /oauth/token with refresh_token
        → Update localStorage
      → NO: Continue
```

**Edge Function Token Refresh:**
```
run-scheduled-searches executes
  → GHL API call returns 401
    → tokenManager.refreshToken()
      → Update stored tokens
    → Retry API call
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# RapidAPI Configuration
VITE_RAPID_API_KEY=your-rapidapi-key
VITE_RAPID_API_HOST=zillow56.p.rapidapi.com

# GoHighLevel OAuth Configuration
VITE_GHL_CLIENT_ID=your-ghl-client-id
VITE_GHL_CLIENT_SECRET=your-ghl-client-secret
VITE_REDIRECT_URI=https://your-app.com/oauth/callback
```

### Supabase Project Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run database migrations:**
   ```bash
   supabase db push
   ```
   Or manually execute SQL files in `supabase/migrations/`

3. **Deploy edge functions:**
   ```bash
   npm run deploy:functions
   ```

4. **Set up cron job** (via Supabase dashboard):
   - Function: `run-scheduled-searches`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - HTTP method: POST

5. **Configure secrets** for edge functions:
   ```bash
   supabase secrets set RAPID_API_KEY=your-key
   supabase secrets set GHL_CLIENT_ID=your-id
   supabase secrets set GHL_CLIENT_SECRET=your-secret
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`

3. **Run linter:**
   ```bash
   npm run lint
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## Deployment

### Frontend Deployment

The frontend is a static React application that can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **AWS S3 + CloudFront**
- **Any static hosting service**

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist/
```

**Environment Variables:**
Ensure all `VITE_*` environment variables are set in your hosting platform.

### Backend Deployment

Supabase handles backend hosting automatically.

**Deploy Edge Functions:**
```bash
npm run deploy:functions
```

**Supabase Project Reference:**
- Project ID: `hetvcsfpcfvcpvruwben`

---

## Troubleshooting

### Common Issues

#### 1. GHL Authentication Fails

**Symptoms:**
- "AIRES AI authentication required" error
- Redirect loop on OAuth callback

**Solutions:**
- Verify `VITE_GHL_CLIENT_ID` and `VITE_GHL_CLIENT_SECRET` are correct
- Check that `VITE_REDIRECT_URI` matches the one registered in GHL
- Ensure OAuth scopes include: `contacts.write contacts.readonly locations.readonly`
- Clear localStorage and re-authenticate

**Debug:**
```javascript
// Check stored tokens
console.log(localStorage.getItem('ghl_access_token'));
console.log(localStorage.getItem('ghl_location_id'));
console.log(localStorage.getItem('ghl_token_expiry'));
```

#### 2. Properties Not Exporting to GHL

**Symptoms:**
- Search completes but no contacts appear in GHL
- "Failed to export properties" toast

**Solutions:**
- Check GHL token validity: [src/services/ghlAuth.ts:47](src/services/ghlAuth.ts:47)
- Verify `ghl_location_id` is set correctly
- Check GHL API rate limits (may need to add delays)
- Inspect browser console for API errors

**Debug:**
```javascript
// Check GHL credentials
import { hasValidGHLCredentials } from './services/ghlAuth';
console.log('Valid credentials:', hasValidGHLCredentials());
```

#### 3. Scheduled Searches Not Running

**Symptoms:**
- Searches created but `last_run` never updates
- No properties exported automatically

**Solutions:**
- Verify Supabase cron job is configured and enabled
- Check edge function logs in Supabase dashboard
- Ensure `next_run` timestamp is in the past
- Verify `active = true` on scheduled searches

**Debug:**
```sql
-- Check scheduled searches
SELECT id, ghl_location_id, last_run, next_run, active
FROM scheduled_searches
WHERE next_run <= NOW()
ORDER BY next_run;
```

#### 4. RapidAPI Rate Limits

**Symptoms:**
- Search fails with 429 error
- "Too many requests" message

**Solutions:**
- Upgrade RapidAPI plan for higher limits
- Implement request queuing/throttling
- Add delays between API calls

#### 5. Database RLS Policy Blocking Access

**Symptoms:**
- Queries return empty results
- "Row level security policy violation" errors

**Solutions:**
- Ensure `ghl_location_id` context is set: [src/lib/supabase.ts:30](src/lib/supabase.ts:30)
- Verify RLS policies allow current user context
- Check that `user_id` and `company_id` match stored searches

**Debug:**
```sql
-- Check current session context
SELECT current_setting('app.ghl_location_id', true);
SELECT current_setting('app.current_user_id', true);
```

---

## Maintenance Tasks

### Regular Maintenance

#### 1. Monitor Database Growth

**Task:** Periodically clean up old search results to prevent database bloat.

**Query to check size:**
```sql
SELECT
  COUNT(*) as total_results,
  pg_size_pretty(pg_total_relation_size('search_results')) as table_size
FROM search_results;
```

**Cleanup strategy:**
```sql
-- Delete search results older than 90 days
DELETE FROM search_results
WHERE created_at < NOW() - INTERVAL '90 days';
```

#### 2. Monitor Edge Function Execution

**Task:** Check edge function logs for errors and performance issues.

**Steps:**
1. Navigate to Supabase Dashboard → Edge Functions
2. Select `run-scheduled-searches`
3. Review logs for errors
4. Check average execution time

**Expected execution time:** 30-120 seconds per search (depending on results)

#### 3. Token Refresh Monitoring

**Task:** Ensure GHL tokens are refreshing properly.

**Indicators:**
- Users not getting logged out unexpectedly
- Automated searches continue to export successfully
- No 401 errors in edge function logs

#### 4. Update Dependencies

**Task:** Keep dependencies up to date for security and performance.

```bash
npm outdated  # Check for outdated packages
npm update    # Update to latest compatible versions
```

**Critical dependencies to monitor:**
- `@supabase/supabase-js` - Backend client
- `react` / `react-dom` - UI framework
- `axios` - HTTP client
- `vite` - Build tool

#### 5. Backup Database

**Task:** Regular database backups via Supabase.

**Steps:**
1. Supabase Dashboard → Database → Backups
2. Enable automatic daily backups
3. Download manual backup before major changes

### Scheduled Tasks

| Task | Frequency | Priority |
|------|-----------|----------|
| Database cleanup | Monthly | Medium |
| Edge function logs review | Weekly | High |
| Dependency updates | Quarterly | Medium |
| GHL OAuth credentials renewal | Annually | Critical |
| Database backup verification | Monthly | High |

---

## Key Code References

### Important Functions by File

| File | Function | Purpose |
|------|----------|---------|
| [src/services/api.ts](src/services/api.ts) | `searchProperties()` | Fetch properties from RapidAPI |
| [src/utils/ghlIntegration.ts](src/utils/ghlIntegration.ts:146) | `exportToGHL()` | Export property to GHL CRM |
| [src/services/ghlAuth.ts](src/services/ghlAuth.ts:78) | `exchangeCodeForToken()` | OAuth token exchange |
| [src/services/ghlAuth.ts](src/services/ghlAuth.ts:9) | `refreshAccessToken()` | Refresh expired token |
| [src/services/scheduledSearches.ts](src/services/scheduledSearches.ts) | `createScheduledSearch()` | Create automated search |
| [src/lib/supabase.ts](src/lib/supabase.ts:30) | `setGHLLocationId()` | Set RLS context |
| [supabase/functions/run-scheduled-searches/index.ts](supabase/functions/run-scheduled-searches/index.ts:17) | `handleScheduledSearches()` | Execute scheduled searches |

### Configuration Files

- **Vite Config:** [vite.config.ts](vite.config.ts)
- **TypeScript Config:** [tsconfig.json](tsconfig.json)
- **Tailwind Config:** [tailwind.config.js](tailwind.config.js)
- **Package.json:** [package.json](package.json)

---

## Support & Documentation

### External Documentation
- **Supabase Docs:** https://supabase.com/docs
- **GoHighLevel API:** https://highlevel.stoplight.io/
- **RapidAPI (Zillow):** https://rapidapi.com/apimaker/api/zillow56
- **React Query:** https://tanstack.com/query/latest
- **Vite:** https://vitejs.dev/

### Internal Documentation
- **CLAUDE.md:** [CLAUDE.md](CLAUDE.md) - Development guide for AI assistance
- **README.md:** (if exists) - Project overview

---

## Handoff Checklist

- [ ] Reviewed entire codebase structure
- [ ] Understood database schema and RLS policies
- [ ] Tested OAuth flow locally
- [ ] Executed manual property search
- [ ] Created and tested automated search
- [ ] Reviewed edge function logs
- [ ] Verified environment variables are documented
- [ ] Set up local development environment
- [ ] Deployed edge functions to Supabase
- [ ] Tested scheduled search execution
- [ ] Understood token refresh mechanism
- [ ] Reviewed troubleshooting section
- [ ] Identified key code references
- [ ] Access granted to:
  - [ ] Supabase project
  - [ ] GHL OAuth app
  - [ ] RapidAPI account
  - [ ] Git repository
  - [ ] Deployment platform (Vercel/Netlify)

---

## Questions & Next Steps

If you have questions about this application, refer to:
1. This Knowledge Transfer document
2. [CLAUDE.md](CLAUDE.md) for development guidelines
3. Code comments throughout the codebase
4. External documentation links above

**Recommended next steps:**
1. Set up local development environment
2. Run the application locally and test all features
3. Review database schema in Supabase dashboard
4. Test OAuth flow with a test GHL account
5. Create a test scheduled search and monitor execution
6. Familiarize yourself with edge function deployment
7. Review logs and monitoring tools in Supabase dashboard

---

**Document Version:** 1.0
**Last Updated:** 2025-10-01
**Prepared By:** Previous Developer
**Next Review Date:** 2026-01-01
