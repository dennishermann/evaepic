"use client";

import { useState } from "react";
import SearchAndFilter from "../components/SearchAndFilter";

export default function OrdersPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    vendor: "",
    dateRange: "all",
    amountRange: "all",
  });

  const filterFields = [
    {
      label: "Vendor",
      name: "vendor",
      type: "input" as const,
      placeholder: "Filter by vendor...",
    },
    {
      label: "Date Range",
      name: "dateRange",
      type: "select" as const,
      options: [
        { label: "All Time", value: "all" },
        { label: "Today", value: "today" },
        { label: "This Week", value: "week" },
        { label: "This Month", value: "month" },
        { label: "This Quarter", value: "quarter" },
        { label: "This Year", value: "year" },
      ],
    },
    {
      label: "Amount Range",
      name: "amountRange",
      type: "select" as const,
      options: [
        { label: "All Amounts", value: "all" },
        { label: "$0 - $1,000", value: "0-1000" },
        { label: "$1,000 - $5,000", value: "1000-5000" },
        { label: "$5,000 - $10,000", value: "5000-10000" },
        { label: "$10,000+", value: "10000+" },
      ],
    },
  ];

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      vendor: "",
      dateRange: "all",
      amountRange: "all",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + New Order
        </button>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchPlaceholder="Search orders..."
        searchLabel="Search orders"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        filterFields={filterFields}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters as typeof filters)}
        onClearFilters={handleClearFilters}
      />

      {/* Orders Table */}
      <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    #{1000 + item}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Office Supplies
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Vendor {item}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

