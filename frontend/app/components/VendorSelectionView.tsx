"use client";

import SearchAndFilter from "./SearchAndFilter";

interface Vendor {
  id: number;
  name: string;
  rating: number;
  orders: number;
  category: string;
}

interface VendorSelectionViewProps {
  selectedProduct: { id: number; name: string };
  filteredVendors: Vendor[];
  selectedVendors: number[];
  vendorSearchQuery: string;
  vendorFilters: { category: string; rating: string };
  isVendorFilterOpen: boolean;
  onBackToProducts: () => void;
  onVendorSearchChange: (query: string) => void;
  onVendorFilterToggle: () => void;
  onVendorFilterChange: (filters: { category: string; rating: string }) => void;
  onClearVendorFilters: () => void;
  onToggleVendorSelection: (vendorId: number) => void;
  onAddSelectedVendors: () => void;
}

export default function VendorSelectionView({
  selectedProduct,
  filteredVendors,
  selectedVendors,
  vendorSearchQuery,
  vendorFilters,
  isVendorFilterOpen,
  onBackToProducts,
  onVendorSearchChange,
  onVendorFilterToggle,
  onVendorFilterChange,
  onClearVendorFilters,
  onToggleVendorSelection,
  onAddSelectedVendors,
}: VendorSelectionViewProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <button
          onClick={onBackToProducts}
          className="flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#5C4A3A] transition-colors"
          aria-label="Back to products"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back to products</span>
        </button>
      </div>

      {/* Vendor List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredVendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="h-12 w-12 text-[#8B7355]/60 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-sm font-medium text-[#5C4A3A]">
              No vendors found
            </p>
            <p className="text-xs text-[#8B7355] mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-gradient-to-br from-white/60 via-[#FAF8F3]/50 to-white/60 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/40">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/30 bg-white/50 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355] w-12">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEB887]/20">
                  {filteredVendors.map((vendor) => {
                    const isSelected = selectedVendors.includes(vendor.id);
                    return (
                      <tr
                        key={vendor.id}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#FAF0E6]/50 backdrop-blur-sm"
                            : "hover:bg-white/40 backdrop-blur-sm"
                        }`}
                        onClick={() => onToggleVendorSelection(vendor.id)}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleVendorSelection(vendor.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 text-[#8B7355] border-[#DEB887]/40 rounded focus:ring-[#8B7355]/50 bg-white/50 backdrop-blur-sm"
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#5C4A3A]">
                          {vendor.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#8B7355]">
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-4 w-4 text-[#DEB887]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{vendor.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#8B7355]">
                          {vendor.orders}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#8B7355]">
                          {vendor.category}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Selected Vendors Button - Fixed at bottom, outside scrollable area */}
      <div className="pt-4 border-t border-white/30 flex-shrink-0 mt-4">
        <button
          onClick={onAddSelectedVendors}
          disabled={selectedVendors.length === 0}
          className="w-full px-4 py-2.5 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] hover:from-[#6B5B4F] hover:to-[#5C4A3A] text-white transition-all font-medium shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
        >
          {selectedVendors.length > 0
            ? `Add ${selectedVendors.length} Vendor${selectedVendors.length > 1 ? "s" : ""} to Order`
            : "Select vendors to add"}
        </button>
      </div>
    </div>
  );
}
