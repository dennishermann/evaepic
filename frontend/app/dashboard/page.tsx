"use client";

import { useMemo } from "react";
import Card from "../components/Card";
import StatusChart from "../components/StatusChart";
import TrendChart from "../components/TrendChart";
import FloatingActionButton from "../components/FloatingActionButton";
import { MOCK_DASHBOARD_STATS, MOCK_ORDERS, MOCK_QUOTES, MOCK_VENDORS } from "../data/mockData";

// Derived statistics from mock data
const mockOrderStatus = {
  active: MOCK_ORDERS.filter(o => o.status === "in_negotiation").length,
  pending: MOCK_ORDERS.filter(o => o.status === "pending_approval").length,
  completed: MOCK_ORDERS.filter(o => o.status === "completed").length,
  cancelled: 0,
};

const mockQuoteStatus = {
  pending: MOCK_QUOTES.filter(q => q.status === "pending").length,
  accepted: MOCK_QUOTES.filter(q => q.status === "accepted").length,
  rejected: 0,
  expired: 0,
};

// Recent orders from mock data (last 5)
const mockRecentOrders = MOCK_ORDERS.slice(0, 5).map(order => ({
  id: order.id,
  title: order.item,
  vendor: order.vendor,
  status: order.status === "in_negotiation" ? "active" :
    order.status === "pending_approval" ? "pending" : "completed",
  amount: order.final_price || order.current_offer || order.budget,
  date: order.created_date,
}));

// Recent quotes from mock data
const mockRecentQuotes = MOCK_QUOTES.slice(0, 3).map(quote => ({
  id: quote.id,
  title: quote.item,
  vendor: quote.vendor,
  status: quote.status,
  amount: quote.price,
  date: quote.created_date,
}));

// Vendor performance (orders by vendor)
const mockVendorPerformance = MOCK_VENDORS.slice(0, 5).map(vendor => ({
  label: vendor.name,
  value: MOCK_ORDERS.filter(o => o.vendor_id === vendor.id).length * 8 + Math.floor(Math.random() * 10)
}));

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
              {MOCK_DASHBOARD_STATS.activeOrders}
            </div>
            <div className="text-sm font-medium text-[#8B7355] mt-1">
              Active Orders
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#DEB887] drop-shadow-sm">
              {MOCK_DASHBOARD_STATS.pendingQuotes}
            </div>
            <div className="text-sm font-medium text-[#8B7355] mt-1">
              Pending Quotes
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#8B7355] drop-shadow-sm">
              {MOCK_DASHBOARD_STATS.activeVendors}
            </div>
            <div className="text-sm font-medium text-[#8B7355] mt-1">
              Active Vendors
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#6B5B4F] drop-shadow-sm">
              {formatCurrency(MOCK_DASHBOARD_STATS.totalSavings)}
            </div>
            <div className="text-sm font-medium text-[#8B7355] mt-1">
              Total Savings
            </div>
            <div className="text-xs text-[#8B7355] mt-1">
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
            <p className="mt-2 text-3xl font-bold text-[#8B7355] drop-shadow-sm">
              2.4 days
            </p>
            <p className="mt-1 text-xs text-[#8B7355]">
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
            <p className="mt-1 text-xs text-[#8B7355]">
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
              {MOCK_DASHBOARD_STATS.completedOrders}
            </p>
            <p className="mt-1 text-xs text-[#8B7355]">
              {MOCK_DASHBOARD_STATS.activeNegotiations} active negotiations
            </p>
          </div>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <Card title="Order Status Distribution">
        {MOCK_DASHBOARD_STATS.totalOrders > 0 ? (
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
        {MOCK_DASHBOARD_STATS.pendingQuotes > 0 ? (
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
      {MOCK_DASHBOARD_STATS.completedOrders > 0 && (
        <Card title="Order Completion Status">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {MOCK_DASHBOARD_STATS.completedOrders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {MOCK_DASHBOARD_STATS.activeOrders}
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
                className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-xl rounded-2xl cursor-pointer hover:bg-white/70 transition-all border border-white/40 shadow-md"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {order.title}
                  </div>
                  <div className="text-xs text-[#8B7355] mt-1">
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
                className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-xl rounded-2xl cursor-pointer hover:bg-white/70 transition-all border border-white/40 shadow-md"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {quote.title}
                  </div>
                  <div className="text-xs text-[#8B7355] mt-1">
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

      {MOCK_DASHBOARD_STATS.totalOrders === 0 && (
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

