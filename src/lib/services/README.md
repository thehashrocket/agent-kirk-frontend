# Email Analytics Service

This service provides database-driven email campaign analytics for the KIRK frontend application.

## Architecture

The email analytics integration follows SOLID principles:

### Single Responsibility Principle
- `EmailAnalyticsService.getGlobalMetrics()` - Aggregates global email metrics
- `EmailAnalyticsService.getCampaignActivity()` - Fetches campaign-specific data
- `EmailAnalyticsService.parseDateRange()` - Handles date range validation

### Open/Closed Principle
- Service is extensible for new metric types
- Easy to add filtering capabilities
- API supports optional date range parameters

### Interface Segregation Principle
- Focused interfaces for each data type (`EmailMetricsAggregated`, `EmailCampaignWithStats`)
- Clean separation between service layer and component interfaces

### Dependency Inversion Principle
- Components depend on service abstractions, not database details
- Service handles all database complexity

## Database Schema Integration

### Primary Tables Used

1. **EmailCampaignDailyStats** - Core metrics source
   - `delivered` - Number of emails delivered
   - `unique_opens` - Unique opens count
   - `unique_clicks` - Unique clicks count
   - `unsubscribes` - Unsubscribe count
   - `bounces` - Bounce count

2. **EmailCampaign** - Campaign information
   - `campaign_id` - External campaign identifier
   - `campaign_name` - Campaign display name

3. **EmailCampaignContent** - Email content details
   - `subject` - Email subject line
   - `send_time` - When the campaign was sent

### Data Flow

```
Database Tables
       ↓
EmailAnalyticsService
       ↓
API Route (/api/channels/email)
       ↓
Email Dashboard Component
       ↓
UI Components (Metrics, Tables, Charts)
```

## API Endpoints

### GET /api/channels/email

**Query Parameters:**
- `start` (optional) - Start date in YYYY-MM-DD format
- `end` (optional) - End date in YYYY-MM-DD format

**Response:**
```typescript
interface EmailChannelData {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalDeliveries: number;
    uniqueOpens: number;
    avgOpenRate: number;
    uniqueClicks: number;
    avgCTR: number;
    totalUnsubscribes: number;
    totalBounces: number;
  };
  campaignActivity: EmailCampaignActivity[];
  websiteActivity: EmailWebsiteActivity[]; // Currently empty, future GA integration
}
```

## Usage Examples

### Basic Usage
```typescript
// Service layer
const metrics = await EmailAnalyticsService.getGlobalMetrics();
const campaigns = await EmailAnalyticsService.getCampaignActivity();

// API layer
GET /api/channels/email
GET /api/channels/email?start=2025-01-01&end=2025-01-31
```

### Frontend Integration
```typescript
// Components automatically fetch data via SWR
const { data, error, isLoading } = useSWR<EmailChannelData>(
  '/api/channels/email',
  fetcher
);
```

## Metrics Calculations

### Open Rate
```
Open Rate = (Unique Opens / Total Deliveries) × 100
```

### Click-Through Rate (CTR)
```
CTR = (Unique Clicks / Unique Opens) × 100
```

### Global Metrics
All metrics are aggregated across the specified date range using Prisma's built-in aggregation functions.

## Error Handling

- Database connection failures return structured error responses
- Invalid date ranges fallback to default (last 30 days)
- Missing data shows appropriate empty states in UI
- Comprehensive error logging for debugging

## Future Enhancements

1. **Website Activity Integration**
   - Google Analytics data correlation
   - Traffic attribution from email campaigns

2. **Advanced Filtering**
   - Campaign type filtering
   - Email client segmentation
   - Geographic breakdowns

3. **Real-time Updates**
   - WebSocket integration for live metrics
   - Automated data refresh intervals

4. **Performance Optimization**
   - Data caching strategies
   - Pagination for large datasets
   - Database query optimization

## Dependencies

- `@prisma/client` - Database ORM
- `Next.js` - API routes and SSR
- `SWR` - Client-side data fetching
- `TypeScript` - Type safety 