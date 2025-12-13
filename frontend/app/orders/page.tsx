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
        <button className="rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] px-4 py-2 text-sm font-medium text-white hover:from-[#6B5B4F] hover:to-[#5C4A3A] transition-all shadow-xl hover:shadow-2xl backdrop-blur-md">
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
      <div className="rounded-lg bg-gradient-to-br from-white/80 via-[#FAF8F3]/70 to-white/80 backdrop-blur-xl shadow-xl border border-[#DEB887]/30">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/30 bg-white/50 backdrop-blur-xl">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEB887]/20">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-white/40 backdrop-blur-sm transition-all">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#5C4A3A]">
                    #{1000 + item}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8B7355]">
                    Office Supplies
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8B7355]">
                    Vendor {item}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-[#FAF0E6] px-3 py-1 text-xs font-medium text-[#6B5B4F] shadow-sm">
                      Active
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#8B7355]">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-[#8B7355] hover:text-[#6B5B4F] transition-colors">
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

