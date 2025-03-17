import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Representative Dashboard",
  description: "Dashboard for account representatives to manage client accounts",
};

export default function AccountRepDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Account Representative Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for account rep features */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Client Management</h2>
          <p className="text-gray-600">View and manage client accounts</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Support Tickets</h2>
          <p className="text-gray-600">Handle client support requests</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Client Analytics</h2>
          <p className="text-gray-600">Track client engagement and metrics</p>
        </div>
      </div>
    </div>
  );
} 