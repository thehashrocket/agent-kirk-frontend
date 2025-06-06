# Email Channel API Specification

## Overview
This document outlines the data structure requirements for the Email Channel API endpoint used by the frontend dashboard to display email campaign analytics.

## Endpoint
**GET** `/api/channels/email`

## Response Format

### Success Response (200 OK)

```json
{
  "dateRange": {
    "start": "2025-04-03",
    "end": "2025-04-30"
  },
  "metrics": {
    "totalDeliveries": 7484,
    "uniqueOpens": 2955,
    "avgOpenRate": 39.48,
    "uniqueClicks": 230,
    "avgCTR": 3.07,
    "totalUnsubscribes": 5,
    "totalBounces": 46
  },
  "campaignActivity": [
    {
      "id": "1",
      "delivered": "Apr 17, 2025",
      "weekDay": "Friday",
      "subject": "Old Someone Say Brunch This Weekend? 🍳",
      "link": "https://sequin.com/12345",
      "successfulDeliveries": 7484,
      "opens": 2955,
      "openRate": 39.48,
      "clicks": 230,
      "ctr": 3.07,
      "unsubscribes": 5,
      "bounces": 46
    },
    {
      "id": "2",
      "delivered": "Apr 15, 2025",
      "weekDay": "Thursday",
      "subject": "A Spring Biggest Moments are Worth Watching for 🌸",
      "link": "https://sequin.com/67890",
      "successfulDeliveries": 7484,
      "opens": 2700,
      "openRate": 36.06,
      "clicks": 212,
      "ctr": 2.86,
      "unsubscribes": 18,
      "bounces": 35
    },
    {
      "id": "3",
      "delivered": "Feb 13, 2025",
      "weekDay": "Thursday",
      "subject": "February Fun & Valentine's Specials this Weekend",
      "link": "https://sequin.com/valentine",
      "successfulDeliveries": 7396,
      "opens": 2636,
      "openRate": 35.64,
      "clicks": 133,
      "ctr": 1.83,
      "unsubscribes": 6,
      "bounces": 42
    },
    {
      "id": "4",
      "delivered": "Jan 31, 2025",
      "weekDay": "Friday",
      "subject": "Kickstart your fitness goals at The Meadows",
      "link": "https://sequin.com/fitness",
      "successfulDeliveries": 7421,
      "opens": 3043,
      "openRate": 41.02,
      "clicks": 128,
      "ctr": 1.73,
      "unsubscribes": 22,
      "bounces": 48
    },
    {
      "id": "5",
      "delivered": "Dec 12, 2024",
      "weekDay": "Thursday",
      "subject": "Holiday Magic Starts Here 🎄",
      "link": "https://sequin.com/holiday",
      "successfulDeliveries": 7404,
      "opens": 3061,
      "openRate": 41.34,
      "clicks": 164,
      "ctr": 2.27,
      "unsubscribes": 7,
      "bounces": 44
    }
  ],
  "websiteActivity": [
    {
      "id": "1",
      "campaign": "march2025",
      "source": "mailchimp",
      "medium": "email",
      "adContent": "header+garagepage",
      "users": 4,
      "newUsers": 4,
      "sessions": 4,
      "avgSessionDuration": "00:00:49"
    },
    {
      "id": "2",
      "campaign": "feb2025-3",
      "source": "mailchimp",
      "medium": "email",
      "adContent": "scarn+recipe",
      "users": 1,
      "newUsers": 0,
      "sessions": 3,
      "avgSessionDuration": "00:01:57"
    },
    {
      "id": "3",
      "campaign": "feb2025-1",
      "source": "mailchimp",
      "medium": "email",
      "adContent": "starry+linkage",
      "users": 5,
      "newUsers": 5,
      "sessions": 6,
      "avgSessionDuration": "00:01:33"
    },
    {
      "id": "4",
      "campaign": "feb2025-1",
      "source": "mailchimp",
      "medium": "email",
      "adContent": "subscollection+image",
      "users": 1,
      "newUsers": 1,
      "sessions": 1,
      "avgSessionDuration": "00:00:00"
    }
  ]
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": "Failed to fetch email data",
  "message": "Detailed error description here"
}
```

## Data Structure Documentation

### Root Object Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dateRange` | Object | Yes | The date range for the data being returned |
| `metrics` | Object | Yes | Aggregated email campaign metrics for the period |
| `campaignActivity` | Array | Yes | List of individual email campaigns with detailed metrics |
| `websiteActivity` | Array | Yes | Website tracking data from email campaigns |

### dateRange Object

| Field | Type | Format | Required | Description |
|-------|------|--------|----------|-------------|
| `start` | String | YYYY-MM-DD | Yes | Start date of the reporting period |
| `end` | String | YYYY-MM-DD | Yes | End date of the reporting period |

### metrics Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `totalDeliveries` | Number | Yes | Total number of emails successfully delivered |
| `uniqueOpens` | Number | Yes | Number of unique recipients who opened emails |
| `avgOpenRate` | Number | Yes | Average open rate as a percentage (e.g., 39.48 = 39.48%) |
| `uniqueClicks` | Number | Yes | Number of unique recipients who clicked links |
| `avgCTR` | Number | Yes | Average click-through rate as a percentage |
| `totalUnsubscribes` | Number | Yes | Total number of unsubscribes in the period |
| `totalBounces` | Number | Yes | Total number of bounced emails |

### campaignActivity Array Items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier for the campaign |
| `delivered` | String | Yes | Date the campaign was delivered (human-readable format) |
| `weekDay` | String | Yes | Day of the week the campaign was sent |
| `subject` | String | Yes | Email subject line |
| `link` | String | Yes | Primary campaign URL/link |
| `successfulDeliveries` | Number | Yes | Number of emails successfully delivered for this campaign |
| `opens` | Number | Yes | Number of times this campaign was opened |
| `openRate` | Number | Yes | Open rate percentage for this campaign |
| `clicks` | Number | Yes | Number of clicks on this campaign |
| `ctr` | Number | Yes | Click-through rate percentage for this campaign |
| `unsubscribes` | Number | Yes | Number of unsubscribes from this campaign |
| `bounces` | Number | Yes | Number of bounces for this campaign |

### websiteActivity Array Items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier for the activity record |
| `campaign` | String | Yes | Campaign identifier/name |
| `source` | String | Yes | Traffic source (e.g., "mailchimp") |
| `medium` | String | Yes | Traffic medium (typically "email") |
| `adContent` | String | Yes | Specific content/creative identifier |
| `users` | Number | Yes | Number of users who visited from this campaign |
| `newUsers` | Number | Yes | Number of new users from this campaign |
| `sessions` | Number | Yes | Number of sessions generated |
| `avgSessionDuration` | String | Yes | Average session duration in HH:MM:SS format |

## Implementation Notes

### Data Type Requirements
- **Percentages**: Open rates and CTR should be returned as decimal numbers (e.g., 39.48, not 0.3948)
- **Numbers**: All numeric fields should be integers or floats, not strings
- **Strings**: Text fields should be properly escaped strings
- **Arrays**: Both `campaignActivity` and `websiteActivity` must be arrays, even if empty

### Date Format Requirements
- **dateRange fields**: Must use ISO date format (YYYY-MM-DD)
- **delivered field**: Can use human-readable format (e.g., "Apr 17, 2025")
- **avgSessionDuration**: Must use HH:MM:SS format (e.g., "00:01:23")

### Response Requirements
- All fields marked as "Required" must be present in the response
- Empty arrays should be returned as `[]`, not `null`
- Numeric fields should never be `null` - use `0` for missing values
- String fields should never be `null` - use empty string `""` for missing values

### Performance Considerations
- The endpoint should respond within 2 seconds
- Consider pagination for large datasets (campaignActivity array)
- Implement proper caching strategies for frequently requested data

### Authentication
- The endpoint should respect the existing authentication system
- Return appropriate HTTP status codes for unauthorized requests

## Frontend Usage
The frontend will:
- Call this endpoint on component mount
- Refresh data every 60 seconds
- Display loading states while fetching
- Handle error states gracefully
- Format the data for display in tables and metric cards

## Testing
Please ensure the endpoint:
- Returns data in the exact format specified
- Handles empty datasets gracefully
- Returns appropriate error responses
- Maintains consistent data types
- Validates all required fields are present 