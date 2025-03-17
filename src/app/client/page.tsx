import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Dashboard",
  description: "Dashboard for clients to manage their account and services",
};

export default function ClientDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Client Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for client features */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">My Account</h2>
          <p className="text-gray-600">View and manage your account settings</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Support</h2>
          <p className="text-gray-600">Get help and submit support tickets</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
          <p className="text-gray-600">View your service usage and analytics</p>
        </div>
      </div>
    </div>
  );
} 