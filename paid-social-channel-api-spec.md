# Paid Social Channel API Specification

## Overview
This document outlines the data structure requirements for the Paid Social Channel API endpoint used by the frontend dashboard to display Facebook & Instagram Ads analytics.

## Endpoint
**GET** `/api/channels/paid-social`

## Response Format

### Success Response (200 OK)

```json
{
  "dateRange": {
    "start": "2025-04-01",
    "end": "2025-04-30"
  },
  "metrics": {
    "reach": 229221,
    "impressions": 781297,
    "engagement": 3548,
    "linkClicks": 3445,
    "linkCtr": 0.44,
    "costPerLinkClick": 0.56,
    "lpvs": 2968,
    "costPerLpv": 0.65,
    "amountSpent": 1917.91
  },
  "engagementData": [
    {
      "id": "1",
      "campaignName": "Q2/2025+Summer Camp Vetta 70+Traffic | 3PM",
      "startDate": "Mar 21, 2025",
      "endDate": "",
      "reach": 20696,
      "impressions": 73079,
      "engagement": 500,
      "linkClicks": 467,
      "linkCtr": 0.64,
      "costPerLinkClick": 0.69,
      "lpvs": 318,
      "costPerLpv": 1.02,
      "amountSpent": 324.16
    },
    {
      "id": "2",
      "campaignName": "Q2/2025+Summer Camp St. Charles+Traffic | 3PM",
      "startDate": "Mar 21, 2025",
      "endDate": "",
      "reach": 23971,
      "impressions": 61007,
      "engagement": 503,
      "linkClicks": 465,
      "linkCtr": 0.76,
      "costPerLinkClick": 0.70,
      "lpvs": 317,
      "costPerLpv": 1.02,
      "amountSpent": 324.45
    },
    {
      "id": "3",
      "campaignName": "Q2/2025+Summer Camp Soccerdome+Traffic | 3PM",
      "startDate": "Mar 21, 2025",
      "endDate": "",
      "reach": 30271,
      "impressions": 64602,
      "engagement": 524,
      "linkClicks": 484,
      "linkCtr": 0.75,
      "costPerLinkClick": 0.67,
      "lpvs": 324,
      "costPerLpv": 1.00,
      "amountSpent": 323.64
    },
    {
      "id": "4",
      "campaignName": "Q2/2025+Summer Camp Manchester+Traffic | 3PM",
      "startDate": "Mar 21, 2025",
      "endDate": "",
      "reach": 26272,
      "impressions": 62695,
      "engagement": 496,
      "linkClicks": 462,
      "linkCtr": 0.74,
      "costPerLinkClick": 0.70,
      "lpvs": 320,
      "costPerLpv": 1.01,
      "amountSpent": 324.25
    },
    {
      "id": "5",
      "campaignName": "Q2/2025+Summer Camp Concord+Traffic | 3PM",
      "startDate": "Mar 21, 2025",
      "endDate": "",
      "reach": 28932,
      "impressions": 73642,
      "engagement": 506,
      "linkClicks": 467,
      "linkCtr": 0.63,
      "costPerLinkClick": 0.69,
      "lpvs": 310,
      "costPerLpv": 1.05,
      "amountSpent": 324.03
    },
    {
      "id": "6",
      "campaignName": "Q2/2025+Spring Camp St. Charles+Traffic | 4PM",
      "startDate": "Mar 8, 2025",
      "endDate": "",
      "reach": 7639,
      "impressions": 15519,
      "engagement": 121,
      "linkClicks": 116,
      "linkCtr": 0.75,
      "costPerLinkClick": 0.67,
      "lpvs": 70,
      "costPerLpv": 1.10,
      "amountSpent": 77.33
    }
  ],
  "campaignOverview": [
    {
      "id": "1",
      "campaign": "kickaroos",
      "source": "Facebook_Mobile_Feed",
      "adContent": "noimagetext|callingoliparents",
      "users": 2467,
      "newUsers": 2387,
      "sessions": 2598,
      "avgSessionDuration": "00:01:12"
    },
    {
      "id": "2",
      "campaign": "kickaroos",
      "source": "Others",
      "adContent": "noimagetext|callingoliparents",
      "users": 1651,
      "newUsers": 1637,
      "sessions": 1657,
      "avgSessionDuration": "00:00:02"
    },
    {
      "id": "3",
      "campaign": "kickaroos",
      "source": "Others",
      "adContent": "imagetestmonialtextfunsaleptwo",
      "users": 1260,
      "newUsers": 1254,
      "sessions": 1263,
      "avgSessionDuration": "00:00:01"
    },
    {
      "id": "4",
      "campaign": "kickaroos",
      "source": "Others",
      "adContent": "imagetestmonialtext1ddyouknow two",
      "users": 775,
      "newUsers": 774,
      "sessions": 775,
      "avgSessionDuration": "00:00:00"
    },
    {
      "id": "5",
      "campaign": "kickaroos",
      "source": "Others",
      "adContent": "imagekangarootext|callingoliparents",
      "users": 691,
      "newUsers": 680,
      "sessions": 700,
      "avgSessionDuration": "00:00:17"
    },
    {
      "id": "6",
      "campaign": "kickaroos",
      "source": "Others",
      "adContent": "imagemulitext|callingaliparent",
      "users": 498,
      "newUsers": 496,
      "sessions": 500,
      "avgSessionDuration": "00:00:00"
    },
    {
      "id": "7",
      "campaign": "kickaroos",
      "source": "Instagram_Stories",
      "adContent": "noimagetext|callingoliparents",
      "users": 321,
      "newUsers": 315,
      "sessions": 339,
      "avgSessionDuration": "00:01:15"
    },
    {
      "id": "8",
      "campaign": "summercamp",
      "source": "Facebook_Mobile_Feed",
      "adContent": "Soccerdomegroup",
      "users": 186,
      "newUsers": 178,
      "sessions": 202,
      "avgSessionDuration": "00:00:22"
    },
    {
      "id": "9",
      "campaign": "summercamp",
      "source": "Facebook_Mobile_Feed",
      "adContent": "charlesjes",
      "users": 182,
      "newUsers": 172,
      "sessions": 190,
      "avgSessionDuration": "00:00:35"
    },
    {
      "id": "10",
      "campaign": "kickaroos",
      "source": "Others",
      "adContent": "imagekangarootext|buildconfidence",
      "users": 142,
      "newUsers": 139,
      "sessions": 142,
      "avgSessionDuration": "00:00:00"
    }
  ]
}
```

### Error Response (400/500)

```json
{
  "error": "Error message describing what went wrong"
}
```

## Data Structure Details

### Campaign Stats Overview Metrics
- **reach**: Total unique users reached (number)
- **impressions**: Total ad impressions (number)
- **engagement**: Total engagement actions (number)
- **linkClicks**: Total link clicks (number)
- **linkCtr**: Link click-through rate as percentage (number, e.g., 0.44 = 0.44%)
- **costPerLinkClick**: Cost per link click in dollars (number)
- **lpvs**: Landing page views (number)
- **costPerLpv**: Cost per landing page view in dollars (number)
- **amountSpent**: Total amount spent in dollars (number)

### Facebook & Instagram Ads Engagement Data
- **id**: Unique engagement record identifier (string)
- **campaignName**: Full campaign name (string)
- **startDate**: Campaign start date in "MMM DD, YYYY" format (string)
- **endDate**: Campaign end date in "MMM DD, YYYY" format (string, can be empty)
- **reach**: Unique users reached (number)
- **impressions**: Total impressions (number)
- **engagement**: Total engagement actions (number)
- **linkClicks**: Total link clicks (number)
- **linkCtr**: Link click-through rate as percentage (number)
- **costPerLinkClick**: Cost per link click in dollars (number)
- **lpvs**: Landing page views (number)
- **costPerLpv**: Cost per landing page view in dollars (number)
- **amountSpent**: Amount spent in dollars (number)

### Campaign Overview Data
- **id**: Unique campaign overview record identifier (string)
- **campaign**: Campaign name (string)
- **source**: Traffic source (string, e.g., "Facebook_Mobile_Feed", "Others", "Instagram_Stories")
- **adContent**: Ad content description or identifier (string)
- **users**: Total users (number)
- **newUsers**: New users (number)
- **sessions**: Total sessions (number)
- **avgSessionDuration**: Average session duration in "HH:MM:SS" format (string)

## Implementation Notes

1. **Date Range**: The `dateRange` should reflect the actual data period being returned
2. **Formatting**: All monetary values should be provided as numbers (the frontend handles formatting)
3. **Percentages**: CTR values should be provided as percentages (e.g., 0.44 for 0.44%, not 0.0044)
4. **Date Formats**: Use consistent date formatting ("MMM DD, YYYY" for display dates)
5. **Duration Format**: Session duration should be in "HH:MM:SS" format
6. **Source Categories**: Common sources include Facebook_Mobile_Feed, Instagram_Stories, Others
7. **Error Handling**: Provide meaningful error messages for debugging

## Cache Considerations

- Data should be cached appropriately as Facebook & Instagram Ads data typically updates every few hours
- Consider implementing a refresh interval of 15-30 minutes for optimal user experience
- The frontend implements a 60-second refresh interval for real-time feel

## Security

- Ensure proper authentication/authorization before returning sensitive campaign data
- Consider rate limiting to prevent API abuse
- Sanitize any campaign names or ad content fields to prevent XSS

## Filtering Support

The API should support optional query parameters for filtering:
- `campaignName`: Filter by specific campaign name
- `adSet`: Filter by ad set (if applicable)
- `adName`: Filter by ad name (if applicable)
- `source`: Filter by traffic source
- `startDate`: Filter by date range start
- `endDate`: Filter by date range end

Example: `/api/channels/paid-social?campaignName=kickaroos&source=Facebook_Mobile_Feed`

## Example Usage

```javascript
// Frontend usage example
const { data, error, isLoading } = useSWR('/api/channels/paid-social', fetcher);

if (data) {
  console.log('Campaign Stats:', data.metrics);
  console.log('Engagement Data:', data.engagementData);
  console.log('Campaign Overview:', data.campaignOverview);
}
``` 