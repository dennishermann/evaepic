"use client";

import { useState } from "react";
import SearchAndFilter from "../components/SearchAndFilter";

export default function VendorsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    rating: "all",
  });

  const filterFields = [
    {
      label: "Status",
      name: "status",
      type: "select" as const,
      options: [
        { label: "All Status", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
      ],
    },
    {
      label: "Category",
      name: "category",
      type: "select" as const,
      options: [
        { label: "All Categories", value: "all" },
        { label: "Supplies", value: "supplies" },
        { label: "Equipment", value: "equipment" },
        { label: "Services", value: "services" },
        { label: "Software", value: "software" },
      ],
    },
    {
      label: "Rating",
      name: "rating",
      type: "select" as const,
      options: [
        { label: "All Ratings", value: "all" },
        { label: "5 Stars", value: "5" },
        { label: "4+ Stars", value: "4" },
        { label: "3+ Stars", value: "3" },
        { label: "2+ Stars", value: "2" },
      ],
    },
  ];

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      category: "all",
      rating: "all",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Add Vendor
        </button>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchPlaceholder="Search vendors..."
        searchLabel="Search vendors"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        filterFields={filterFields}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters as typeof filters)}
        onClearFilters={handleClearFilters}
      />

      {/* Vendor Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vendor {item}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  vendor{item}@example.com
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Orders:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item * 3}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Avg. Rating:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(4 + Math.random()).toFixed(1)} ⭐
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Category:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Supplies
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                View Details
              </button>
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

