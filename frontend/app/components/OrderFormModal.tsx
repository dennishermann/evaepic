"use client";

import { useState, useEffect } from "react";
import SearchAndFilter from "./SearchAndFilter";
import VendorSelectionView from "./VendorSelectionView";
import ProductSearchView from "./ProductSearchView";
import OrderItemsList from "./OrderItemsList";
import { OrderItem } from "../types/order";

interface Product {
  id: number;
  name: string;
  unitPrice: number;
  description: string;
  category: string;
}

interface Vendor {
  id: number;
  name: string;
  rating: number;
  orders: number;
  category: string;
}

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  filters: { category: string; priceRange: string };
  onFiltersChange: (filters: { category: string; priceRange: string }) => void;
  onClearFilters: () => void;
  searchResults: Product[];
  vendorSearchQuery: string;
  onVendorSearchQueryChange: (query: string) => void;
  isVendorFilterOpen: boolean;
  onVendorFilterToggle: () => void;
  vendorFilters: { category: string; rating: string };
  onVendorFiltersChange: (filters: { category: string; rating: string }) => void;
  onClearVendorFilters: () => void;
  filteredVendors: Vendor[];
  selectedVendors: number[];
  orderItems: OrderItem[];
  totalAmount: number;
  onAddProduct: (product: Product) => void;
  onBackToProducts: () => void;
  onToggleVendorSelection: (vendorId: number) => void;
  onAddSelectedVendors: () => void;
  onRemoveItem: (itemKey: string) => void;
  onUpdateQuantity: (itemKey: string, quantity: number) => void;
  onCancel: () => void;
  onCreateOrder: () => void;
  formatCurrency: (amount: number) => string;
  onBackToReview?: () => void;
  showBackToReview?: boolean;
}

export default function OrderFormModal({
  isOpen,
  onClose,
  selectedProduct,
  searchQuery,
  onSearchQueryChange,
  isFilterOpen,
  onFilterToggle,
  filters,
  onFiltersChange,
  onClearFilters,
  searchResults,
  vendorSearchQuery,
  onVendorSearchQueryChange,
  isVendorFilterOpen,
  onVendorFilterToggle,
  vendorFilters,
  onVendorFiltersChange,
  onClearVendorFilters,
  filteredVendors,
  selectedVendors,
  orderItems,
  totalAmount,
  onAddProduct,
  onBackToProducts,
  onToggleVendorSelection,
  onAddSelectedVendors,
  onRemoveItem,
  onUpdateQuantity,
  onCancel,
  onCreateOrder,
  formatCurrency,
  onBackToReview,
  showBackToReview = false,
}: OrderFormModalProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const hasOrderItems = orderItems.length > 0;

  // Auto-collapse search when order items are first added
  useEffect(() => {
    if (hasOrderItems) {
      setIsSearchExpanded(false);
    } else {
      setIsSearchExpanded(true);
    }
  }, [hasOrderItems]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-[95vw] h-[92vh] overflow-hidden flex flex-col border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 bg-white/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {showBackToReview && onBackToReview && (
              <button
                onClick={onBackToReview}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#8B7355] hover:text-[#5C4A3A] hover:bg-white/60 backdrop-blur-md rounded-2xl transition-all"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Review
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-[#5C4A3A] drop-shadow-sm">
                Create Order
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedProduct
                  ? `Select vendors for ${selectedProduct.name}`
                  : "Search and add products to your order"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-[#8B7355] hover:text-[#5C4A3A] hover:bg-white/60 backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          {hasOrderItems ? (
            /* When order items exist, show collapsed search on side and order items prominently */
            <div className="flex gap-6 flex-1 min-h-0">
              {/* Collapsed Search Sidebar */}
              <div className={`flex flex-col transition-all duration-300 ${isSearchExpanded ? 'flex-1' : 'w-16'} border-r border-white/30 pr-6`}>
                {isSearchExpanded ? (
                  <>
                    <div className="mb-4">
                      <button
                        onClick={() => setIsSearchExpanded(false)}
                        className="mb-2 w-full flex items-center justify-end text-[#8B7355] hover:text-[#5C4A3A] text-sm"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {selectedProduct ? (
                        <SearchAndFilter
                          searchPlaceholder="Search vendors..."
                          searchLabel="Search vendors"
                          searchValue={vendorSearchQuery}
                          onSearchChange={onVendorSearchQueryChange}
                          isFilterOpen={isVendorFilterOpen}
                          onFilterToggle={onVendorFilterToggle}
                          filterFields={[
                            {
                              label: "Category",
                              name: "category",
                              type: "select",
                              options: [
                                { label: "All Categories", value: "all" },
                                { label: "General", value: "General" },
                                { label: "Electronics", value: "Electronics" },
                                { label: "Furniture", value: "Furniture" },
                                { label: "Lighting", value: "Lighting" },
                              ],
                            },
                            {
                              label: "Minimum Rating",
                              name: "rating",
                              type: "select",
                              options: [
                                { label: "All Ratings", value: "all" },
                                { label: "4.5+ Stars", value: "4.5" },
                                { label: "4.0+ Stars", value: "4.0" },
                                { label: "3.5+ Stars", value: "3.5" },
                                { label: "3.0+ Stars", value: "3.0" },
                              ],
                            },
                          ]}
                          filters={vendorFilters}
                          onFilterChange={(newFilters) => onVendorFiltersChange(newFilters as typeof vendorFilters)}
                          onClearFilters={onClearVendorFilters}
                          showFilterText={false}
                        />
                      ) : (
                        <SearchAndFilter
                          searchPlaceholder="Search products..."
                          searchLabel="Search products"
                          searchValue={searchQuery}
                          onSearchChange={onSearchQueryChange}
                          isFilterOpen={isFilterOpen}
                          onFilterToggle={onFilterToggle}
                          filterFields={[
                            {
                              label: "Category",
                              name: "category",
                              type: "select",
                              options: [
                                { label: "All Categories", value: "all" },
                                { label: "Furniture", value: "Furniture" },
                                { label: "Electronics", value: "Electronics" },
                                { label: "Lighting", value: "Lighting" },
                                { label: "Accessories", value: "Accessories" },
                                { label: "Office Supplies", value: "Office Supplies" },
                              ],
                            },
                            {
                              label: "Price Range",
                              name: "priceRange",
                              type: "select",
                              options: [
                                { label: "All Prices", value: "all" },
                                { label: "$0 - $50", value: "0-50" },
                                { label: "$50 - $100", value: "50-100" },
                                { label: "$100 - $200", value: "100-200" },
                                { label: "$200+", value: "200+" },
                              ],
                            },
                          ]}
                          filters={filters}
                          onFilterChange={(newFilters) => onFiltersChange(newFilters as typeof filters)}
                          onClearFilters={onClearFilters}
                          showFilterText={false}
                        />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {selectedProduct ? (
                        <VendorSelectionView
                          selectedProduct={selectedProduct}
                          filteredVendors={filteredVendors}
                          selectedVendors={selectedVendors}
                          vendorSearchQuery={vendorSearchQuery}
                          vendorFilters={vendorFilters}
                          isVendorFilterOpen={isVendorFilterOpen}
                          onBackToProducts={onBackToProducts}
                          onVendorSearchChange={onVendorSearchQueryChange}
                          onVendorFilterToggle={onVendorFilterToggle}
                          onVendorFilterChange={onVendorFiltersChange}
                          onClearVendorFilters={onClearVendorFilters}
                          onToggleVendorSelection={onToggleVendorSelection}
                          onAddSelectedVendors={onAddSelectedVendors}
                        />
                      ) : (
                        <ProductSearchView
                          searchResults={searchResults}
                          onAddProduct={onAddProduct}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="mt-2 p-2 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 text-[#8B7355] hover:text-[#5C4A3A] hover:bg-white/70 transition-all"
                    title="Expand search"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Order Items - Takes full remaining space */}
              <div className="flex-1 min-h-0">
                <OrderItemsList
                  orderItems={orderItems}
                  onRemoveItem={onRemoveItem}
                  onUpdateQuantity={onUpdateQuantity}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>
          ) : (
            /* When no order items, show normal layout */
            <>
              <div className="mb-6">
                {selectedProduct ? (
                  <SearchAndFilter
                    searchPlaceholder="Search vendors..."
                    searchLabel="Search vendors"
                    searchValue={vendorSearchQuery}
                    onSearchChange={onVendorSearchQueryChange}
                    isFilterOpen={isVendorFilterOpen}
                    onFilterToggle={onVendorFilterToggle}
                    filterFields={[
                      {
                        label: "Category",
                        name: "category",
                        type: "select",
                        options: [
                          { label: "All Categories", value: "all" },
                          { label: "General", value: "General" },
                          { label: "Electronics", value: "Electronics" },
                          { label: "Furniture", value: "Furniture" },
                          { label: "Lighting", value: "Lighting" },
                        ],
                      },
                      {
                        label: "Minimum Rating",
                        name: "rating",
                        type: "select",
                        options: [
                          { label: "All Ratings", value: "all" },
                          { label: "4.5+ Stars", value: "4.5" },
                          { label: "4.0+ Stars", value: "4.0" },
                          { label: "3.5+ Stars", value: "3.5" },
                          { label: "3.0+ Stars", value: "3.0" },
                        ],
                      },
                    ]}
                    filters={vendorFilters}
                    onFilterChange={(newFilters) => onVendorFiltersChange(newFilters as typeof vendorFilters)}
                    onClearFilters={onClearVendorFilters}
                    showFilterText={false}
                  />
                ) : (
                  <SearchAndFilter
                    searchPlaceholder="Search products..."
                    searchLabel="Search products"
                    searchValue={searchQuery}
                    onSearchChange={onSearchQueryChange}
                    isFilterOpen={isFilterOpen}
                    onFilterToggle={onFilterToggle}
                    filterFields={[
                      {
                        label: "Category",
                        name: "category",
                        type: "select",
                        options: [
                          { label: "All Categories", value: "all" },
                          { label: "Furniture", value: "Furniture" },
                          { label: "Electronics", value: "Electronics" },
                          { label: "Lighting", value: "Lighting" },
                          { label: "Accessories", value: "Accessories" },
                          { label: "Office Supplies", value: "Office Supplies" },
                        ],
                      },
                      {
                        label: "Price Range",
                        name: "priceRange",
                        type: "select",
                        options: [
                          { label: "All Prices", value: "all" },
                          { label: "$0 - $50", value: "0-50" },
                          { label: "$50 - $100", value: "50-100" },
                          { label: "$100 - $200", value: "100-200" },
                          { label: "$200+", value: "200+" },
                        ],
                      },
                    ]}
                    filters={filters}
                    onFilterChange={(newFilters) => onFiltersChange(newFilters as typeof filters)}
                    onClearFilters={onClearFilters}
                    showFilterText={false}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Side - Search Results or Vendor Selection */}
                <div className="flex flex-col min-h-0">
                  {selectedProduct ? (
                    <VendorSelectionView
                      selectedProduct={selectedProduct}
                      filteredVendors={filteredVendors}
                      selectedVendors={selectedVendors}
                      vendorSearchQuery={vendorSearchQuery}
                      vendorFilters={vendorFilters}
                      isVendorFilterOpen={isVendorFilterOpen}
                      onBackToProducts={onBackToProducts}
                      onVendorSearchChange={onVendorSearchQueryChange}
                      onVendorFilterToggle={onVendorFilterToggle}
                      onVendorFilterChange={onVendorFiltersChange}
                      onClearVendorFilters={onClearVendorFilters}
                      onToggleVendorSelection={onToggleVendorSelection}
                      onAddSelectedVendors={onAddSelectedVendors}
                    />
                  ) : (
                    <ProductSearchView
                      searchResults={searchResults}
                      onAddProduct={onAddProduct}
                    />
                  )}
                </div>

                {/* Right Side - Order List */}
                <OrderItemsList
                  orderItems={orderItems}
                  onRemoveItem={onRemoveItem}
                  onUpdateQuantity={onUpdateQuantity}
                  formatCurrency={formatCurrency}
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-white/30 bg-white/50 backdrop-blur-xl flex-shrink-0">
          <div className="text-sm text-[#8B7355]">
            {orderItems.length > 0 ? (
              <>
                <span className="font-medium text-[#5C4A3A]">
                  {orderItems.length}
                </span>{" "}
                {orderItems.length === 1 ? "item" : "items"} • Total Quantity:{" "}
                <span className="font-medium text-[#5C4A3A]">
                  {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>{" "}
                • Total:{" "}
                <span className="font-semibold text-[#5C4A3A]">
                  {formatCurrency(totalAmount)}
                </span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                No items in order yet
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-2xl border border-white/40 text-[#5C4A3A] hover:bg-white/60 backdrop-blur-md transition-all font-medium focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 shadow-md"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreateOrder()}
              disabled={orderItems.length === 0}
              className="px-6 py-2 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] hover:from-[#6B5B4F] hover:to-[#5C4A3A] text-white transition-all font-medium shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
            >
              Create Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
