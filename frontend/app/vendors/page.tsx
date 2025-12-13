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
        <button className="rounded-lg bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] px-4 py-2 text-sm font-medium text-white hover:from-[#6B5B4F] hover:to-[#5C4A3A] transition-all shadow-lg hover:shadow-xl backdrop-blur-sm">
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
            className="rounded-3xl bg-gradient-to-br from-white/60 via-[#FAF8F3]/50 to-white/60 backdrop-blur-2xl p-6 shadow-2xl border border-white/40"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#5C4A3A] drop-shadow-sm">
                  Vendor {item}
                </h3>
                <p className="mt-1 text-sm text-[#8B7355]">
                  vendor{item}@example.com
                </p>
              </div>
              <span className="rounded-full bg-[#FAF0E6] px-3 py-1 text-xs font-medium text-[#6B5B4F] shadow-sm">
                Active
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#8B7355]">
                  Total Orders:
                </span>
                <span className="font-medium text-[#5C4A3A]">
                  {item * 3}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8B7355]">
                  Avg. Rating:
                </span>
                <span className="font-medium text-[#5C4A3A]">
                  {(4 + Math.random()).toFixed(1)} ⭐
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8B7355]">
                  Category:
                </span>
                <span className="font-medium text-[#5C4A3A]">
                  Supplies
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] px-4 py-2 text-sm font-medium text-white hover:from-[#6B5B4F] hover:to-[#5C4A3A] transition-all shadow-xl hover:shadow-2xl backdrop-blur-md">
                View Details
              </button>
              <button className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-medium text-[#5C4A3A] hover:bg-white/60 backdrop-blur-md transition-all shadow-md">
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

