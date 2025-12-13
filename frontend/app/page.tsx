"use client";

import { useState, useEffect } from "react";
import PlatformLayout from "./components/PlatformLayout";
import FloatingActionButton from "./components/FloatingActionButton";
import ChatInterface from "./components/ChatInterface";
import OrderProgressUI from "./components/OrderProgressUI";
import OrderInputBubble from "./components/OrderInputBubble";
import MainInputContainer from "./components/MainInputContainer";
import OrderFormModal from "./components/OrderFormModal";
import { productCatalog, mockVendors } from "./constants/mockData";
import { OrderItem, OrderProgressStep } from "./types/order";
import { useAudioRecording } from "./hooks/useAudioRecording";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    priceRange: "all",
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchResults, setSearchResults] = useState(productCatalog);
  const [selectedProduct, setSelectedProduct] = useState<typeof productCatalog[0] | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [vendorFilters, setVendorFilters] = useState({
    category: "all",
    rating: "all",
  });
  const [filteredVendors, setFilteredVendors] = useState(mockVendors);
  const [isVendorFilterOpen, setIsVendorFilterOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderProgress, setOrderProgress] = useState<OrderProgressStep[]>([]);
  const [orderInputText, setOrderInputText] = useState("");

  const { isRecording, startRecording, stopRecording } = useAudioRecording((text) => {
    setInputValue((prev) => prev + text);
  });

  // Search functionality
  useEffect(() => {
    let filtered = productCatalog;
    
    // Apply search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((product) => product.category === filters.category);
    }
    
    // Apply price range filter
    if (filters.priceRange !== "all") {
      filtered = filtered.filter((product) => {
        const price = product.unitPrice;
        switch (filters.priceRange) {
          case "0-50":
            return price >= 0 && price <= 50;
          case "50-100":
            return price > 50 && price <= 100;
          case "100-200":
            return price > 100 && price <= 200;
          case "200+":
            return price > 200;
          default:
            return true;
        }
      });
    }
    
    setSearchResults(filtered);
  }, [searchQuery, filters]);

  // Filter vendors
  useEffect(() => {
    let filtered = mockVendors;
    
    if (vendorSearchQuery.trim() !== "") {
      filtered = filtered.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
          vendor.category.toLowerCase().includes(vendorSearchQuery.toLowerCase())
      );
    }
    
    if (vendorFilters.category !== "all") {
      filtered = filtered.filter((vendor) => vendor.category === vendorFilters.category);
    }
    
    if (vendorFilters.rating !== "all") {
      filtered = filtered.filter((vendor) => {
        const minRating = parseFloat(vendorFilters.rating);
        return vendor.rating >= minRating;
      });
    }
    
    setFilteredVendors(filtered);
  }, [vendorSearchQuery, vendorFilters]);

  // Parse text input to extract items (simple parsing logic)
  const parseTextToItems = (text: string): OrderItem[] => {
    const items: OrderItem[] = [];
    const lines = text.split("\n").filter((line) => line.trim());
    
    lines.forEach((line) => {
      // Try to match patterns like "10 Office Chairs" or "Office Chairs x10" or "Office Chairs 10"
      const quantityMatch = line.match(/(\d+)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      // Find matching product
      const productMatch = productCatalog.find((product) =>
        line.toLowerCase().includes(product.name.toLowerCase())
      );
      
      if (productMatch) {
        // For parsed items, use a default vendor or create a unique key
        const defaultVendorId = 1; // Default vendor for parsed items
        items.push({
          id: productMatch.id,
          itemKey: `${productMatch.id}-${defaultVendorId}`,
          name: productMatch.name,
          quantity: quantity,
          unitPrice: productMatch.unitPrice,
          total: quantity * productMatch.unitPrice,
          description: productMatch.description,
          vendorId: defaultVendorId,
          vendorName: "Default Vendor",
        });
      }
    });
    
    return items;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

  const handleAddProduct = (product: typeof productCatalog[0]) => {
    setSelectedProduct(product);
    setSelectedVendors([]);
    setVendorSearchQuery("");
    setVendorFilters({ category: "all", rating: "all" });
  };

  const toggleVendorSelection = (vendorId: number) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleAddSelectedVendors = () => {
    if (selectedProduct && selectedVendors.length > 0) {
      selectedVendors.forEach((vendorId) => {
        const vendor = mockVendors.find((v) => v.id === vendorId);
        if (vendor) {
          addItemToOrder(selectedProduct, vendor, 1);
        }
      });
      setSelectedProduct(null);
      setSelectedVendors([]);
      setVendorSearchQuery("");
      setVendorFilters({ category: "all", rating: "all" });
    }
  };

  const addItemToOrder = (product: typeof productCatalog[0], vendor: typeof mockVendors[0], quantity: number = 1) => {
    const itemKey = `${product.id}-${vendor.id}`;
    const existingItem = orderItems.find((item) => item.itemKey === itemKey);
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.itemKey === itemKey
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: product.id,
          itemKey: itemKey,
          name: product.name,
          quantity: quantity,
          unitPrice: product.unitPrice,
          total: quantity * product.unitPrice,
          description: product.description,
          vendorId: vendor.id,
          vendorName: vendor.name,
        },
      ]);
    }
  };

  const removeItemFromOrder = (itemKey: string) => {
    setOrderItems(orderItems.filter((item) => item.itemKey !== itemKey));
  };

  const updateItemQuantity = (itemKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemKey);
      return;
    }
    setOrderItems(
      orderItems.map((item) =>
        item.itemKey === itemKey
          ? { ...item, quantity, total: quantity * item.unitPrice }
          : item
      )
    );
  };

  const updateItemUnitPrice = (itemKey: string, unitPrice: number) => {
    setOrderItems(
      orderItems.map((item) =>
        item.itemKey === itemKey
          ? { ...item, unitPrice, total: item.quantity * unitPrice }
          : item
      )
    );
  };

  const handleSearchButtonClick = () => {
    setShowOrderForm(true);
    setSearchQuery("");
  };

  const handleSendButtonClick = () => {
    if (inputValue.trim().length > 0) {
      const parsedItems = parseTextToItems(inputValue);
      if (parsedItems.length > 0) {
        setOrderItems(parsedItems);
      } else {
        // If no items parsed, create a single item from the text input
        const textItem: OrderItem = {
          id: Date.now(),
          itemKey: `text-${Date.now()}`,
          name: inputValue.trim(),
          quantity: 1,
          unitPrice: 0,
          total: 0,
          description: "Order from text input",
        };
        setOrderItems([textItem]);
      }
      // Directly show create order modal (product/vendor selection)
      setShowOrderForm(true);
      setSearchQuery("");
    }
  };

  const handleCreateOrder = async (orderData?: {
    items: OrderItem[];
    deliveryAddress: string;
    notes: string;
  }) => {
    // Use provided order data or fall back to current state
    const finalItems = orderData?.items || orderItems;
    
    // Capture the order input text
    const orderText = finalItems.length > 0 
      ? `Create order with ${finalItems.length} item${finalItems.length > 1 ? "s" : ""}: ${finalItems.map(item => `${item.quantity}x ${item.name}`).join(", ")}`
      : inputValue || "Create order";
    
    setOrderInputText(orderText);
    setIsProcessingOrder(true);
    setShowOrderForm(false);

    const steps: OrderProgressStep[] = [
      { 
        step: 1, 
        status: "pending", 
        title: "Processing order items and quantities",
        message: "Analyzing the order items you've selected and calculating total quantities. Verifying product availability and specifications for each item in your order."
      },
      { 
        step: 2, 
        status: "pending", 
        title: "Searching for available vendors",
        message: "Querying our vendor database to find suppliers who can fulfill your order requirements. Matching products with vendors based on availability, location, and capabilities."
      },
      { 
        step: 3, 
        status: "pending", 
        title: "Requesting quotes from vendors",
        message: "Sending quote requests to selected vendors. Gathering pricing information, delivery timelines, and terms for each vendor to compare options."
      },
      { 
        step: 4, 
        status: "pending", 
        title: "Analyzing pricing and terms",
        message: "Evaluating all received quotes, comparing prices, delivery schedules, and contract terms. Identifying the best value options for your procurement needs."
      },
      { 
        step: 5, 
        status: "pending", 
        title: "Finalizing order details",
        message: "Preparing final order documentation, confirming vendor selections, and setting up the order for processing. Your order will be ready for review shortly."
      },
    ];

    setOrderProgress(steps);

    // Simulate order processing steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setOrderProgress((prev) =>
        prev.map((s, index) => {
          if (index < i) {
            return { ...s, status: "completed" };
          } else if (index === i) {
            return { ...s, status: "active" };
          }
          return s;
        })
      );
    }

    // Mark all as completed
    setOrderProgress((prev) =>
      prev.map((s) => ({ ...s, status: "completed" }))
    );

    // Keep the progress UI visible - don't reset
    // The user can manually reset by navigating away or refreshing
  };

  const handleFileAttach = (files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
    setSelectedVendors([]);
    setVendorSearchQuery("");
    setVendorFilters({ category: "all", rating: "all" });
  };

  const handleCancelOrder = () => {
    setShowOrderForm(false);
    setOrderItems([]);
    setAttachedFiles([]);
    setSelectedProduct(null);
    setSelectedVendors([]);
  };

  return (
    <PlatformLayout isChatOpen={isChatOpen}>
      <div className="flex flex-col items-center justify-center min-h-full w-full px-4 py-6">
        {/* Order Input Chat Bubble - shown when processing */}
        {isProcessingOrder && orderInputText && (
          <OrderInputBubble text={orderInputText} />
        )}

        {/* Progress UI - integrated into main content */}
        {isProcessingOrder && orderProgress.length > 0 && (
          <OrderProgressUI progress={orderProgress} />
        )}

        {/* Main Input Container - Centered */}
        {!isProcessingOrder && (
          <div className="w-full flex items-center justify-center">
            <MainInputContainer
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSearchClick={handleSearchButtonClick}
              onSendClick={handleSendButtonClick}
              isRecording={isRecording}
              onFileAttach={handleFileAttach}
              attachedFiles={attachedFiles}
              onRemoveFile={handleRemoveFile}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
          </div>
        )}
      </div>

      {/* Floating Action Button - Assistant */}
      <FloatingActionButton
        onPress={() => setIsChatOpen(!isChatOpen)}
        aria-label="Open assistant chat"
        icon={
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        }
      />

      {/* Chat Interface */}
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Order Form Modal - Product/Vendor Selection */}
      <OrderFormModal
        isOpen={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        selectedProduct={selectedProduct}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(newFilters as typeof filters)}
        onClearFilters={() => setFilters({ category: "all", priceRange: "all" })}
        searchResults={searchResults}
        vendorSearchQuery={vendorSearchQuery}
        onVendorSearchQueryChange={setVendorSearchQuery}
        isVendorFilterOpen={isVendorFilterOpen}
        onVendorFilterToggle={() => setIsVendorFilterOpen(!isVendorFilterOpen)}
        vendorFilters={vendorFilters}
        onVendorFiltersChange={(newFilters) => setVendorFilters(newFilters as typeof vendorFilters)}
        onClearVendorFilters={() => setVendorFilters({ category: "all", rating: "all" })}
        filteredVendors={filteredVendors}
        selectedVendors={selectedVendors}
        orderItems={orderItems}
        totalAmount={totalAmount}
        onAddProduct={handleAddProduct}
        onBackToProducts={handleBackToProducts}
        onToggleVendorSelection={toggleVendorSelection}
        onAddSelectedVendors={handleAddSelectedVendors}
        onRemoveItem={removeItemFromOrder}
        onUpdateQuantity={updateItemQuantity}
        onCancel={handleCancelOrder}
        onCreateOrder={handleCreateOrder}
        formatCurrency={formatCurrency}
        onBackToReview={undefined}
        showBackToReview={false}
      />

    </PlatformLayout>
  );
}
