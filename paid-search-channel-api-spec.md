# Paid Search Channel API Specification

## Overview
This document outlines the data structure requirements for the Paid Search Channel API endpoint used by the frontend dashboard to display Google Ads and Facebook campaign analytics.

## Endpoint
**GET** `/api/channels/paid-search`

## Response Format

### Success Response (200 OK)

```json
{
  "dateRange": {
    "start": "2025-04-01",
    "end": "2025-04-30"
  },
  "campaignOverview": [
    {
      "year": 2025,
      "period": "to Date",
      "impressions": 2551670,
      "clicks": 20894,
      "ctr": 0.82,
      "avgCpc": 0.30,
      "conversions": 31696,
      "phoneCalls": 325,
      "totalSpend": 6353.06
    },
    {
      "year": 2024,
      "period": "",
      "impressions": 3469550,
      "clicks": 49542,
      "ctr": 1.43,
      "avgCpc": 0.25,
      "conversions": 38461,
      "phoneCalls": 1098,
      "totalSpend": 12208.51
    },
    {
      "year": 2023,
      "period": "",
      "impressions": 1044458,
      "clicks": 15633,
      "ctr": 1.50,
      "avgCpc": 0.38,
      "conversions": 6174,
      "phoneCalls": 218,
      "totalSpend": 5963.91
    }
  ],
  "allCampaigns": [
    {
      "id": "1",
      "name": "Kickaroos Search Dynamic",
      "clicks": 5771,
      "ctr": 6.96,
      "avgCpc": 0.37,
      "conversions": 6093,
      "phoneCalls": 14,
      "costPerConversion": 0.35
    },
    {
      "id": "2",
      "name": "Kickaroos Search",
      "clicks": 7763,
      "ctr": 8.80,
      "avgCpc": 0.36,
      "conversions": 6519,
      "phoneCalls": 35,
      "costPerConversion": 0.43
    },
    {
      "id": "3",
      "name": "Display | Kickaroos | Retargeting | TVS Apps",
      "clicks": 7292,
      "ctr": 0.31,
      "avgCpc": 0.47,
      "conversions": 10056,
      "phoneCalls": 0,
      "costPerConversion": 0.34
    },
    {
      "id": "4",
      "name": "Kickaroos | Tree Trim Pads | SB | Managed Placements",
      "clicks": 5135,
      "ctr": 0.11,
      "avgCpc": 0.42,
      "conversions": 15854,
      "phoneCalls": 83,
      "costPerConversion": 0.14
    },
    {
      "id": "5",
      "name": "Kickaroos PMG",
      "clicks": 2536,
      "ctr": 0.05,
      "avgCpc": 0.18,
      "conversions": 25914,
      "phoneCalls": 209,
      "costPerConversion": 0.02
    },
    {
      "id": "6",
      "name": "gShoe | Kickaroos | All Locations | TVS Keyword",
      "clicks": 53173,
      "ctr": 0.09,
      "avgCpc": 0.28,
      "conversions": 48238,
      "phoneCalls": 775,
      "costPerConversion": 0.31
    }
  ],
  "performanceData": [
    {
      "date": "2023-04-01",
      "campaign": "Kickaroos Search Dynamic",
      "impressions": 45000,
      "clicks": 1250,
      "conversions": 850,
      "spend": 462.50
    },
    {
      "date": "2023-04-01",
      "campaign": "Kickaroos Search",
      "impressions": 52000,
      "clicks": 1840,
      "conversions": 925,
      "spend": 662.40
    },
    {
      "date": "2023-05-01",
      "campaign": "Kickaroos Search Dynamic",
      "impressions": 48000,
      "clicks": 1320,
      "conversions": 890,
      "spend": 488.40
    },
    {
      "date": "2023-05-01",
      "campaign": "Kickaroos Search",
      "impressions": 55000,
      "clicks": 1950,
      "conversions": 975,
      "spend": 702.00
    }
  ],
  "facebookCampaigns": [
    {
      "year": 2025,
      "campaigns": [
        {
          "id": "fb_2025_1",
          "name": "Roasted \"all\" Kickaroos Open House Ad Set",
          "amountSpent": 300.00,
          "linkClicks": 326,
          "ctr": 1.00,
          "cpc": 0.31
        },
        {
          "id": "fb_2025_2",
          "name": "10/20 Ai Traffic-KickaroosBottomPaddle",
          "amountSpent": 374.00,
          "linkClicks": 332,
          "ctr": 0.47,
          "cpc": 0.48
        },
        {
          "id": "fb_2025_3",
          "name": "10/20 Ai Traffic-KickaroosBottomGartering",
          "amountSpent": 82.00,
          "linkClicks": 31,
          "ctr": 1.13,
          "cpc": 0.25
        },
        {
          "id": "fb_2025_4",
          "name": "10/20 Ai Traffic-KickaroosBottomFootwear",
          "amountSpent": 2369.00,
          "linkClicks": 176,
          "ctr": 0.59,
          "cpc": 0.36
        }
      ],
      "totalSpent": 4729.00,
      "totalLinkClicks": 3549,
      "avgCtr": 0.72,
      "avgCpc": 0.33
    },
    {
      "year": 2024,
      "campaigns": [
        {
          "id": "fb_2024_1",
          "name": "gam> Kickaroos Open House Ad Set",
          "amountSpent": 310.00,
          "linkClicks": 312,
          "ctr": 1.41,
          "cpc": 0.99
        },
        {
          "id": "fb_2024_2",
          "name": "Kickaroos Traffic - Acquisition (targeted demo:) 2023",
          "amountSpent": 236.00,
          "linkClicks": 479,
          "ctr": 1.27,
          "cpc": 0.49
        },
        {
          "id": "fb_2024_3",
          "name": "Kickaroos Traffic - Acquisition (targeted demo:) 2023",
          "amountSpent": 249.00,
          "linkClicks": 514,
          "ctr": 1.26,
          "cpc": 0.48
        },
        {
          "id": "fb_2024_4",
          "name": "Kickaroos and Forms",
          "amountSpent": 188.00,
          "linkClicks": 197,
          "ctr": 1.86,
          "cpc": 0.95
        },
        {
          "id": "fb_2024_5",
          "name": "Kickaroos and Forms Campaign - Reuel Spd - K 2024 Ad Set",
          "amountSpent": 531.00,
          "linkClicks": 524,
          "ctr": 2.43,
          "cpc": 1.01
        },
        {
          "id": "fb_2024_6",
          "name": "10 2024 Traffic-KickaroosEcommerce",
          "amountSpent": 57.00,
          "linkClicks": 28,
          "ctr": 0.60,
          "cpc": 2.04
        },
        {
          "id": "fb_2024_7",
          "name": "10 2024 Traffic-KickaroosGardening",
          "amountSpent": 577.00,
          "linkClicks": 614,
          "ctr": 1.88,
          "cpc": 0.94
        },
        {
          "id": "fb_2024_8",
          "name": "10 2024 Traffic-KickaroosBottomFootwear",
          "amountSpent": 5185.00,
          "linkClicks": 4713,
          "ctr": 1.16,
          "cpc": 1.10
        },
        {
          "id": "fb_2024_9",
          "name": "10 2024 Traffic-KickaroosBottomAttornage",
          "amountSpent": 849.00,
          "linkClicks": 751,
          "ctr": 0.51,
          "cpc": 1.13
        },
        {
          "id": "fb_2024_10",
          "name": "10 2024 Traffic-KickaroosVeggareens",
          "amountSpent": 437.00,
          "linkClicks": 940,
          "ctr": 0.71,
          "cpc": 0.47
        }
      ],
      "totalSpent": 8619.00,
      "totalLinkClicks": 10072,
      "avgCtr": 1.26,
      "avgCpc": 0.85
    },
    {
      "year": 2023,
      "campaigns": [
        {
          "id": "fb_2023_1",
          "name": "Kickaroos Traffic - Acquisition (targeted demo:) 2023",
          "amountSpent": 118.00,
          "linkClicks": 1558,
          "ctr": 1.41,
          "cpc": 0.08
        },
        {
          "id": "fb_2023_2",
          "name": "Kickaroos Traffic - Acquisition (targeted demo:)",
          "amountSpent": 1485.00,
          "linkClicks": 6096,
          "ctr": 1.53,
          "cpc": 0.24
        },
        {
          "id": "fb_2023_3",
          "name": "Kickaroos Traffic - Acquisition (targeted)",
          "amountSpent": 1185.00,
          "linkClicks": 1798,
          "ctr": 1.19,
          "cpc": 0.66
        },
        {
          "id": "fb_2023_4",
          "name": "Kickaroos Traffic - Acquisition (baseline)",
          "amountSpent": 1485.00,
          "linkClicks": 8288,
          "ctr": 1.16,
          "cpc": 0.18
        }
      ],
      "totalSpent": 9266.00,
      "totalLinkClicks": 38350,
      "avgCtr": 1.39,
      "avgCpc": 0.24
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

### Campaign Overview
- **year**: Campaign year (number)
- **period**: Additional period descriptor (string, can be empty)
- **impressions**: Total ad impressions (number)
- **clicks**: Total clicks (number) 
- **ctr**: Click-through rate as percentage (number, e.g., 0.82 = 0.82%)
- **avgCpc**: Average cost per click in dollars (number)
- **conversions**: Total conversions (number)
- **phoneCalls**: Total phone calls generated (number)
- **totalSpend**: Total amount spent in dollars (number)

### All Campaigns
- **id**: Unique campaign identifier (string)
- **name**: Campaign name (string)
- **clicks**: Total clicks (number)
- **ctr**: Click-through rate as percentage (number)
- **avgCpc**: Average cost per click in dollars (number)
- **conversions**: Total conversions (number)
- **phoneCalls**: Total phone calls generated (number)
- **costPerConversion**: Cost per conversion in dollars (number)

### Performance Data
- **date**: Date in YYYY-MM-DD format (string)
- **campaign**: Campaign name (string)
- **impressions**: Impressions for that date/campaign (number)
- **clicks**: Clicks for that date/campaign (number)
- **conversions**: Conversions for that date/campaign (number)
- **spend**: Spend for that date/campaign in dollars (number)

### Facebook Campaigns
- **year**: Campaign year (number)
- **campaigns**: Array of Facebook campaign objects
  - **id**: Unique campaign identifier (string)
  - **name**: Campaign/ad set name (string)
  - **amountSpent**: Amount spent in dollars (number)
  - **linkClicks**: Total link clicks (number)
  - **ctr**: Click-through rate as percentage (number)
  - **cpc**: Cost per click in dollars (number)
- **totalSpent**: Total amount spent for the year (number)
- **totalLinkClicks**: Total link clicks for the year (number)
- **avgCtr**: Average CTR for the year as percentage (number)
- **avgCpc**: Average CPC for the year in dollars (number)

## Implementation Notes

1. **Date Range**: The `dateRange` should reflect the actual data period being returned
2. **Formatting**: All monetary values should be provided as numbers (the frontend handles formatting)
3. **Percentages**: CTR values should be provided as percentages (e.g., 1.5 for 1.5%, not 0.015)
4. **Performance Data**: Should be aggregated by date and campaign for charting purposes
5. **Facebook Campaigns**: Should be grouped by year with totals calculated for each year
6. **Error Handling**: Provide meaningful error messages for debugging

## Cache Considerations

- Data should be cached appropriately as Google Ads and Facebook Ads data typically updates every few hours
- Consider implementing a refresh interval of 15-30 minutes for optimal user experience
- The frontend implements a 60-second refresh interval for real-time feel

## Security

- Ensure proper authentication/authorization before returning sensitive campaign data
- Consider rate limiting to prevent API abuse
- Sanitize any campaign names or other text fields to prevent XSS

## Example Usage

```javascript
// Frontend usage example
const { data, error, isLoading } = useSWR('/api/channels/paid-search', fetcher);

if (data) {
  console.log('Campaign Overview:', data.campaignOverview);
  console.log('All Campaigns:', data.allCampaigns);
  console.log('Facebook Campaigns:', data.facebookCampaigns);
}
``` 