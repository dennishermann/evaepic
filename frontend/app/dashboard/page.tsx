"use client";

import { useMemo, useRef } from "react";
import Card from "../components/Card";
import StatusChart from "../components/StatusChart";
import TrendChart from "../components/TrendChart";
import FloatingActionButton from "../components/FloatingActionButton";
import { useButton } from "@react-aria/button";

// Mock data - in a real app, this would come from API/store
const mockStats = {
  totalOrders: 45,
  activeOrders: 12,
  pendingQuotes: 8,
  activeVendors: 24,
  activeNegotiations: 5,
  completedOrders: 28,
  totalSavings: 125000,
};

const mockOrderStatus = {
  active: 12,
  pending: 8,
  completed: 28,
  cancelled: 2,
};

const mockQuoteStatus = {
  pending: 8,
  accepted: 15,
  rejected: 5,
  expired: 3,
};

const mockRecentOrders = [
  {
    id: "ORD-1001",
    title: "Office Supplies",
    vendor: "ABC Corp",
    status: "active",
    amount: 5000,
    date: "2024-01-15",
  },
  {
    id: "ORD-1002",
    title: "IT Equipment",
    vendor: "Tech Solutions",
    status: "pending",
    amount: 15000,
    date: "2024-01-14",
  },
  {
    id: "ORD-1003",
    title: "Office Furniture",
    vendor: "Furniture Plus",
    status: "active",
    amount: 8000,
    date: "2024-01-13",
  },
  {
    id: "ORD-1004",
    title: "Software Licenses",
    vendor: "Software Inc",
    status: "completed",
    amount: 12000,
    date: "2024-01-12",
  },
  {
    id: "ORD-1005",
    title: "Marketing Materials",
    vendor: "Print Shop",
    status: "active",
    amount: 3500,
    date: "2024-01-11",
  },
];

const mockRecentQuotes = [
  {
    id: "QUO-2001",
    title: "Office Supplies",
    vendor: "ABC Corp",
    status: "pending",
    amount: 5000,
    date: "2024-01-15",
  },
  {
    id: "QUO-2002",
    title: "IT Equipment",
    vendor: "Tech Solutions",
    status: "accepted",
    amount: 15000,
    date: "2024-01-14",
  },
  {
    id: "QUO-2003",
    title: "Office Furniture",
    vendor: "Furniture Plus",
    status: "pending",
    amount: 8000,
    date: "2024-01-13",
  },
];

const mockVendorPerformance = [
  { label: "ABC Corp", value: 45 },
  { label: "Tech Solutions", value: 32 },
  { label: "Furniture Plus", value: 28 },
  { label: "Software Inc", value: 22 },
  { label: "Print Shop", value: 15 },
];

const mockMonthlyTrend = [
  { label: "Aug", value: 8 },
  { label: "Sep", value: 12 },
  { label: "Oct", value: 15 },
  { label: "Nov", value: 18 },
  { label: "Dec", value: 22 },
  { label: "Jan", value: 28 },
];

export default function DashboardPage() {
  const orderTrendData = useMemo(() => mockMonthlyTrend, []);
  const vendorPerformanceData = useMemo(() => mockVendorPerformance, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800",
      pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
      completed: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
      cancelled: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800",
      accepted: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800",
      rejected: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800",
      expired: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {mockStats.activeOrders}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
              Active Orders
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
              {mockStats.pendingQuotes}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
              Pending Quotes
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {mockStats.activeVendors}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
              Active Vendors
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(mockStats.totalSavings)}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
              Total Savings
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              +12.5% from last month
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg. Negotiation Time
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              2.4 days
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              -15% improvement
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Success Rate
            </p>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              87%
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              +5% from last month
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Completed Orders
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {mockStats.completedOrders}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {mockStats.activeNegotiations} active negotiations
            </p>
          </div>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <Card title="Order Status Distribution">
        {mockStats.totalOrders > 0 ? (
          <StatusChart
            data={mockOrderStatus}
            colors={{
              active: "#10B981",
              pending: "#F59E0B",
              completed: "#3B82F6",
              cancelled: "#EF4444",
            }}
          />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available for chart
          </div>
        )}
      </Card>

      {/* Quote Status Distribution */}
      <Card title="Quote Status Distribution">
        {mockStats.pendingQuotes > 0 ? (
          <StatusChart
            data={mockQuoteStatus}
            colors={{
              pending: "#F59E0B",
              accepted: "#10B981",
              rejected: "#EF4444",
              expired: "#6B7280",
            }}
          />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available for chart
          </div>
        )}
      </Card>

      {/* Trends and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Orders Trend">
          {orderTrendData.length > 0 ? (
            <TrendChart
              data={orderTrendData}
              title="Monthly Orders (Last 6 Months)"
              color="#3B82F6"
            />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No historical data available. Create orders to see trends over time.
            </div>
          )}
        </Card>
        <Card title="Vendor Performance">
          {vendorPerformanceData.length > 0 ? (
            <TrendChart
              data={vendorPerformanceData}
              title="Orders by Vendor"
              color="#10B981"
            />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No vendor performance data available
            </div>
          )}
        </Card>
      </div>

      {/* Order Completion Status */}
      {mockStats.completedOrders > 0 && (
        <Card title="Order Completion Status">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {mockStats.completedOrders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {mockStats.activeOrders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {mockOrderStatus.pending}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Orders Summary */}
      {mockRecentOrders.length > 0 && (
        <Card title="Recent Orders Summary">
          <div className="space-y-2">
            {mockRecentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors border border-gray-200 dark:border-gray-800"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {order.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {order.vendor} • {formatCurrency(order.amount)} • {order.date}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Quotes Summary */}
      {mockRecentQuotes.length > 0 && (
        <Card title="Recent Quotes Summary">
          <div className="space-y-2">
            {mockRecentQuotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors border border-gray-200 dark:border-gray-800"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {quote.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {quote.vendor} • {formatCurrency(quote.amount)} • {quote.date}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getStatusColor(
                    quote.status
                  )}`}
                >
                  {quote.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {mockStats.totalOrders === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No procurement data available. Create orders and quotes to see dashboard statistics.
            </p>
          </div>
        </Card>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => {
          // Handle new order creation
          console.log("Create new order");
          // In a real app, this would navigate to order creation page or open a modal
        }}
        aria-label="Create new order"
        icon={
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        }
      />
    </div>
  );
}

