"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useButton } from "@react-aria/button";
import { useTextField } from "@react-aria/textfield";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  label: string;
  name: string;
  type: "select" | "input";
  options?: FilterOption[];
  placeholder?: string;
}

interface SearchAndFilterProps {
  searchPlaceholder?: string;
  searchLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  filterFields?: FilterField[];
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onClearFilters?: () => void;
  showFilterText?: boolean;
}

export default function SearchAndFilter({
  searchPlaceholder = "Search...",
  searchLabel = "Search",
  searchValue,
  onSearchChange,
  isFilterOpen,
  onFilterToggle,
  filterFields = [],
  filters,
  onFilterChange,
  onClearFilters,
  showFilterText = true,
}: SearchAndFilterProps) {
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { buttonProps: filterButtonProps } = useButton(
    {
      onPress: onFilterToggle,
      "aria-label": "Toggle filters",
      "aria-expanded": isFilterOpen,
    },
    filterButtonRef
  );

  const { inputProps: searchInputProps } = useTextField(
    {
      label: searchLabel,
      placeholder: searchPlaceholder,
      "aria-label": searchLabel,
    },
    searchInputRef
  );

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        onFilterToggle();
      }
    };

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen, onFilterToggle]);

  return (
    <div className="flex gap-4 relative">
      <div className="flex-1">
        <input
          {...searchInputProps}
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        {...filterButtonProps}
        ref={filterButtonRef}
        className={`${showFilterText ? "px-4 py-2 flex items-center gap-2" : "p-2"} rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {showFilterText && <span className="text-sm font-medium">Filters</span>}
      </button>

      {/* Filter Panel */}
      {isFilterOpen && filterFields.length > 0 && (
        <div
          ref={filterPanelRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-4"
          style={{ right: 0 }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Filters
              </h3>
              <button
                onClick={onFilterToggle}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {filterFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={filters[field.name] || ""}
                      onChange={(e) =>
                        onFilterChange({ ...filters, [field.name]: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={filters[field.name] || ""}
                      onChange={(e) =>
                        onFilterChange({ ...filters, [field.name]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClearFilters}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                Clear All
              </button>
              <button
                onClick={onFilterToggle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
