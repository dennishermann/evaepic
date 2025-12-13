"use client";

import { useState } from "react";
import SearchAndFilter from "../components/SearchAndFilter";

export default function QuotesPage() {
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
      label: "Status",
      name: "status",
      type: "select" as const,
      options: [
        { label: "All Status", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Rejected", value: "rejected" },
        { label: "Expired", value: "expired" },
      ],
    },
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
          Request Quote
        </button>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchPlaceholder="Search quotes..."
        searchLabel="Search quotes"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        filterFields={filterFields}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters as typeof filters)}
        onClearFilters={handleClearFilters}
      />

      {/* Quotes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quote #{2000 + item}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Vendor {item}
                </p>
              </div>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Pending
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(item * 1000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Items:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item * 5}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Review
              </button>
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

