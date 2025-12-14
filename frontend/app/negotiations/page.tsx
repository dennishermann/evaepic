"use client";

import { useState } from "react";
import SearchAndFilter from "../components/SearchAndFilter";
import { MOCK_NEGOTIATIONS } from "../data/mockData";

export default function NegotiationsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    vendor: "",
    dateRange: "all",
    progress: "all",
  });

  const filterFields = [
    {
      label: "Status",
      name: "status",
      type: "select" as const,
      options: [
        { label: "All Status", value: "all" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "Paused", value: "paused" },
        { label: "Cancelled", value: "cancelled" },
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
      label: "Progress",
      name: "progress",
      type: "select" as const,
      options: [
        { label: "All Progress", value: "all" },
        { label: "0% - 25%", value: "0-25" },
        { label: "25% - 50%", value: "25-50" },
        { label: "50% - 75%", value: "50-75" },
        { label: "75% - 100%", value: "75-100" },
      ],
    },
  ];

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      vendor: "",
      dateRange: "all",
      progress: "all",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button className="rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] px-4 py-2 text-sm font-medium text-white hover:from-[#6B5B4F] hover:to-[#5C4A3A] transition-all shadow-xl hover:shadow-2xl backdrop-blur-md">
          Start Negotiation
        </button>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchPlaceholder="Search negotiations..."
        searchLabel="Search negotiations"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        filterFields={filterFields}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters as typeof filters)}
        onClearFilters={handleClearFilters}
      />

      {/* Negotiations List */}
      <div className="space-y-4">
        {MOCK_NEGOTIATIONS.map((negotiation) => (
          <div
            key={negotiation.id}
            className="rounded-lg bg-gradient-to-br from-white/80 via-[#FAF8F3]/70 to-white/80 backdrop-blur-xl p-6 shadow-xl border border-[#DEB887]/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-[#5C4A3A] drop-shadow-sm">
                    {negotiation.id}
                  </h3>
                  <span className="rounded-full bg-[#FAF0E6] px-3 py-1 text-xs font-medium text-[#8B7355] shadow-sm">
                    {negotiation.status === "in_progress" ? "In Progress" : "Completed"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#8B7355]">
                  {negotiation.item} | Vendor: {negotiation.vendor} | Order: {negotiation.order_id}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#8B7355]">
                      Initial Price
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#5C4A3A]">
                      ${negotiation.initial_price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8B7355]">
                      Current Offer
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#6B5B4F]">
                      ${(negotiation.current_offer || negotiation.final_price || negotiation.initial_price).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8B7355]">
                      Savings
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#8B7355]">
                      ${negotiation.savings.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-[#8B7355]">
                    <span>Progress</span>
                    <span>{negotiation.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/40 backdrop-blur-sm">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#8B7355] to-[#6B5B4F]"
                      style={{ width: `${negotiation.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="ml-6 flex flex-col gap-2">
                <button className="rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] px-4 py-2 text-sm font-medium text-white hover:from-[#6B5B4F] hover:to-[#5C4A3A] transition-all shadow-xl hover:shadow-2xl backdrop-blur-md">
                  View Details
                </button>
                {negotiation.status === "in_progress" && (
                  <button className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-medium text-[#5C4A3A] hover:bg-white/60 backdrop-blur-md transition-all shadow-md">
                    Pause
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

