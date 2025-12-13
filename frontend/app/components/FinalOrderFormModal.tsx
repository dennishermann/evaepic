"use client";

import { useState, useEffect, useRef } from "react";
import { useButton } from "@react-aria/button";
import { OrderItem } from "../types/order";
import { mockVendors } from "../constants/mockData";

interface Vendor {
  id: number;
  name: string;
  rating?: number;
  orders?: number;
  category?: string;
}

interface FinalOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  totalAmount: number;
  onRemoveItem: (itemKey: string) => void;
  onUpdateQuantity: (itemKey: string, quantity: number) => void;
  onUpdateUnitPrice: (itemKey: string, unitPrice: number) => void;
  onAddItem: () => void;
  onCreateOrder: (orderData?: {
    items: OrderItem[];
    deliveryAddress: string;
    notes: string;
  }) => void;
  formatCurrency: (amount: number) => string;
}

export default function FinalOrderFormModal({
  isOpen,
  onClose,
  orderItems,
  totalAmount,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onAddItem,
  onCreateOrder,
  formatCurrency,
}: FinalOrderFormModalProps) {
  const [editableItems, setEditableItems] = useState<OrderItem[]>(orderItems);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  // Update editable items when orderItems prop changes
  useEffect(() => {
    setEditableItems(orderItems);
  }, [orderItems]);

  const { buttonProps: closeButtonProps } = useButton(
    {
      onPress: onClose,
      "aria-label": "Close modal",
    },
    closeButtonRef
  );

  const handleItemQuantityChange = (itemKey: string, quantity: number) => {
    if (quantity <= 0) {
      onRemoveItem(itemKey);
      return;
    }
    const updatedItems = editableItems.map((item: OrderItem) =>
      item.itemKey === itemKey
        ? { ...item, quantity, total: quantity * item.unitPrice }
        : item
    );
    setEditableItems(updatedItems);
    onUpdateQuantity(itemKey, quantity);
  };

  const handleItemPriceChange = (itemKey: string, unitPrice: number) => {
    if (unitPrice < 0) return;
    const updatedItems = editableItems.map((item: OrderItem) =>
      item.itemKey === itemKey
        ? { ...item, unitPrice, total: item.quantity * unitPrice }
        : item
    );
    setEditableItems(updatedItems);
    onUpdateUnitPrice(itemKey, unitPrice);
  };

  const handleSendOrder = () => {
    onCreateOrder({
      items: editableItems,
      deliveryAddress,
      notes,
    });
  };

  const { buttonProps: sendButtonProps } = useButton(
    {
      onPress: handleSendOrder,
      "aria-label": "Send order",
    },
    sendButtonRef
  );

  const calculatedTotal = editableItems.reduce((sum: number, item: OrderItem) => sum + item.total, 0);

  const toggleVendors = (itemKey: string) => {
    setExpandedVendors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  // Get vendors for an item - show all available vendors, with the selected one marked
  const getVendorsForItem = (item: OrderItem): Vendor[] => {
    // Return all vendors, but mark the selected one
    return mockVendors.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      rating: vendor.rating,
      orders: vendor.orders,
      category: vendor.category,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white/95 via-[#FAF8F3]/90 to-white/95 backdrop-blur-xl rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#DEB887]/40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Order
          </h2>
          <button
            {...closeButtonProps}
            ref={closeButtonRef}
            className="rounded-lg p-2 text-[#8B7355] hover:text-[#5C4A3A] hover:bg-white/40 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50"
          >
            <svg
              className="h-6 w-6"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#5C4A3A] drop-shadow-sm">
                Order Items
              </h3>
              <button
                onClick={onAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add
              </button>
            </div>
            {editableItems.length === 0 ? (
              <div className="text-center py-8 text-[#8B7355]">
                No items in order
              </div>
            ) : (
              <div className="space-y-4">
                {editableItems.map((item: OrderItem) => (
                  <div
                    key={item.itemKey}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#5C4A3A] mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.itemKey)}
                        className="ml-4 rounded-lg p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50/50 backdrop-blur-sm transition-all shadow-sm"
                        aria-label="Remove item"
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
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemQuantityChange(
                              item.itemKey,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full px-3 py-2 border border-[#DEB887]/40 rounded-lg bg-white/50 backdrop-blur-sm text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemPriceChange(
                              item.itemKey,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-[#DEB887]/40 rounded-lg bg-white/50 backdrop-blur-sm text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Total
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                    {/* Vendors/Suppliers Toggle - Next to Total */}
                    <div className="mt-4">
                      <button
                        onClick={() => toggleVendors(item.itemKey)}
                        className="flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#6B5B4F] transition-colors"
                      >
                        <span className="font-medium">
                          {expandedVendors.has(item.itemKey) ? "Hide" : "Show"} Suppliers
                        </span>
                        <svg
                          className={`h-4 w-4 transition-transform ${
                            expandedVendors.has(item.itemKey) ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {expandedVendors.has(item.itemKey) && (
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-200 dark:border-blue-700">
                          {getVendorsForItem(item).map((vendor: any) => (
                            <div
                              key={vendor.id}
                              className="flex items-center justify-between p-2 bg-white/40 backdrop-blur-sm rounded-lg shadow-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {vendor.name}
                                </span>
                                {vendor.rating && (
                                  <span className="text-xs text-[#8B7355]">
                                    ⭐ {vendor.rating}
                                  </span>
                                )}
                              </div>
                              {item.vendorId === vendor.id && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                  Selected
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Address Section */}
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-2">
              Delivery Address
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter delivery address..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-2">
              Order Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#DEB887]/30 p-6 bg-white/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Amount:
            </span>
            <span className="text-2xl font-bold text-[#8B7355] drop-shadow-sm">
              {formatCurrency(calculatedTotal)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              {...sendButtonProps}
              ref={sendButtonRef}
              disabled={editableItems.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] text-white rounded-lg font-medium hover:from-[#6B5B4F] hover:to-[#5C4A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 shadow-lg hover:shadow-xl backdrop-blur-sm"
            >
              Send Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
