/**
 * @file src/components/channels/direct-mail/PrintOptimizedDirectMailDashboard.tsx
 * Print-friendly rendering of Direct Mail metrics including summary statistics and campaign table.
 */

import type { DirectMailMetricsResponse } from '@/lib/services/direct-mail-metrics';

interface PrintOptimizedDirectMailDashboardProps {
  data: DirectMailMetricsResponse;
}

const numberFormatter = new Intl.NumberFormat();

const formatNumber = (value: number) => numberFormatter.format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function PrintOptimizedDirectMailDashboard({ data }: PrintOptimizedDirectMailDashboardProps) {
  const { account, summary, tableData, dateRange } = data;

  return (
    <div className="space-y-6" data-testid="direct-mail-content">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          {account?.clientName ?? 'Direct Mail Account'}
        </h2>
        <p className="text-sm text-gray-600">
          Reporting window: {dateRange.from} – {dateRange.to}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="direct-mail-summary">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Campaigns</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.totalCampaigns)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Pieces Sent</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.totalSent)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Pieces Scanned</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.totalScanned)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Pieces Delivered</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.totalDelivered)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Average On-Time</p>
          <p className="text-2xl font-semibold text-gray-900">{formatPercent(summary.avgPercentOnTime)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Average Delivered</p>
          <p className="text-2xl font-semibold text-gray-900">{formatPercent(summary.avgPercentDelivered)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Scan Rate</p>
          <p className="text-2xl font-semibold text-gray-900">{formatPercent(summary.scanRate)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Delivery Rate</p>
          <p className="text-2xl font-semibold text-gray-900">{formatPercent(summary.deliveryRate)}</p>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Campaign Performance</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3 whitespace-nowrap">Send Date</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Total Sent</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Delivered</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Scanned</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Final Scans</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">On-Time %</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Delivered %</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Scanned %</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Final Scan %</th>
                <th className="px-4 py-3 whitespace-nowrap">Last Scan</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                    No campaign data available for the selected range.
                  </td>
                </tr>
              ) : (
                tableData.map((campaign) => (
                  <tr key={campaign.reportId} className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{campaign.campaignName}</span>
                      {campaign.sector && (
                        <span className="block text-xs text-gray-500 mt-1">{campaign.sector}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{campaign.sendDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatNumber(campaign.totalSent)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatNumber(campaign.delivered)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatNumber(campaign.scanned)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatNumber(campaign.finalScanCount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatPercent(campaign.percentOnTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatPercent(campaign.percentDelivered)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatPercent(campaign.percentScanned)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatPercent(campaign.percentFinalScan)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{campaign.lastScanDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
