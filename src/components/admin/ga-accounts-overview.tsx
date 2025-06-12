/**
 * @file src/components/admin/ga-accounts-overview.tsx
 * Google Analytics accounts and properties overview component for admin dashboard.
 * Displays GA data for all clients or a selected client.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
}

interface ClientWithGaData {
  id: string;
  name: string | null;
  email: string | null;
  isActive: boolean;
  gaAccounts: GaAccount[];
  accountRep?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface GaAccountsOverviewProps {
  clientId?: string;
  clientsWithGaData: ClientWithGaData[];
}

export function GaAccountsOverview({ clientId, clientsWithGaData }: GaAccountsOverviewProps) {
  const displayClients = clientId 
    ? clientsWithGaData.filter(client => client.id === clientId)
    : clientsWithGaData.filter(client => client.gaAccounts.length > 0);

  const totalAccounts = displayClients.reduce((total, client) => total + client.gaAccounts.length, 0);
  const totalProperties = displayClients.reduce((total, client) => 
    total + client.gaAccounts.reduce((accountTotal, account) => 
      accountTotal + account.gaProperties.length, 0
    ), 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Google Analytics Overview</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {totalAccounts} Accounts
            </Badge>
            <Badge variant="outline" className="text-xs">
              {totalProperties} Properties
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No Google Analytics data found</p>
            <p className="text-sm">
              {clientId 
                ? "This client hasn't connected any GA accounts yet." 
                : "No clients have connected GA accounts yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayClients.map((client) => (
              <div key={client.id} className="space-y-3">
                {/* Client Header (only show if viewing all clients) */}
                {!clientId && (
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">
                      {client.name || client.email || 'Unknown Client'}
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs">
                        {client.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {client.accountRep && (
                        <Badge variant="outline" className="text-xs">
                          Rep: {client.accountRep.name || client.accountRep.email}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* GA Accounts */}
                <div className="grid gap-3">
                  {client.gaAccounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-sm">{account.gaAccountName}</h4>
                          <p className="text-xs text-gray-500">ID: {account.gaAccountId}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {account.gaProperties.length} Properties
                        </Badge>
                      </div>

                      {/* GA Properties */}
                      {account.gaProperties.length > 0 ? (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                            Properties
                          </h5>
                          <div className="grid gap-2">
                            {account.gaProperties.map((property) => (
                              <div 
                                key={property.id} 
                                className="flex items-center justify-between bg-white p-2 rounded border"
                              >
                                <div>
                                  <p className="font-medium text-sm">{property.gaPropertyName}</p>
                                  <p className="text-xs text-gray-500">ID: {property.gaPropertyId}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Property
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400">
                          <p className="text-xs">No properties configured</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Separator between clients (only if showing multiple clients) */}
                {!clientId && displayClients.indexOf(client) < displayClients.length - 1 && (
                  <div className="border-t my-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 