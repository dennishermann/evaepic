"use client";

import { useState, useRef, useEffect } from "react";
import { useButton } from "@react-aria/button";
import PlatformLayout from "./components/PlatformLayout";
import FloatingActionButton from "./components/FloatingActionButton";
import ChatInterface from "./components/ChatInterface";
import SearchAndFilter from "./components/SearchAndFilter";

// Mock product catalog for search
const productCatalog = [
  { id: 1, name: "Office Chairs", unitPrice: 150, description: "Ergonomic office chairs with adjustable height", category: "Furniture" },
  { id: 2, name: "Desk Lamps", unitPrice: 45, description: "LED desk lamps with adjustable brightness", category: "Lighting" },
  { id: 3, name: "Wireless Keyboards", unitPrice: 75, description: "Mechanical wireless keyboards", category: "Electronics" },
  { id: 4, name: "Monitor Stands", unitPrice: 60, description: "Adjustable monitor stands", category: "Furniture" },
  { id: 5, name: "USB-C Cables", unitPrice: 12, description: "High-speed USB-C charging cables", category: "Electronics" },
  { id: 6, name: "Office Desks", unitPrice: 300, description: "Standing desks with adjustable height", category: "Furniture" },
  { id: 7, name: "Mouse Pads", unitPrice: 8, description: "Ergonomic mouse pads", category: "Accessories" },
  { id: 8, name: "Webcams", unitPrice: 120, description: "HD webcams for video conferencing", category: "Electronics" },
  { id: 9, name: "Headphones", unitPrice: 150, description: "Noise-cancelling headphones", category: "Electronics" },
  { id: 10, name: "Notebooks", unitPrice: 5, description: "Professional notebooks", category: "Office Supplies" },
];

interface OrderItem {
  id: number;
  itemKey: string; // Unique key combining product id and vendor id
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description: string;
  vendorId?: number;
  vendorName?: string;
}

// Mock vendors data
const mockVendors = [
  { id: 1, name: "ABC Corp", rating: 4.5, orders: 45, category: "General" },
  { id: 2, name: "Tech Solutions", rating: 4.8, orders: 120, category: "Electronics" },
  { id: 3, name: "Furniture Plus", rating: 4.2, orders: 78, category: "Furniture" },
  { id: 4, name: "Office Supply Co", rating: 4.6, orders: 95, category: "General" },
  { id: 5, name: "Lighting Experts", rating: 4.4, orders: 56, category: "Lighting" },
  { id: 6, name: "Digital Accessories", rating: 4.7, orders: 89, category: "Electronics" },
  { id: 7, name: "Premium Furniture", rating: 4.9, orders: 34, category: "Furniture" },
  { id: 8, name: "Supply Chain Pro", rating: 4.3, orders: 67, category: "General" },
];

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVendorFilterOpen, setIsVendorFilterOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderProgress, setOrderProgress] = useState<{
    step: number;
    status: "pending" | "active" | "completed";
    message: string;
  }[]>([]);

  const { buttonProps: voiceButtonProps } = useButton(
    {
      onPress: () => {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      },
      "aria-label": isRecording ? "Stop recording" : "Start voice input",
    },
    voiceButtonRef
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        // Here you would typically send the audio to a speech-to-text service
        console.log("Audio recorded:", audioBlob);
        // For now, we'll just simulate transcription
        setInputValue((prev) => prev + " [Voice input recorded]");
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied. Please enable microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Cleanup media recorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    };
  }, [mediaRecorder, isRecording]);

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

  const handleSearchButtonClick = () => {
    setShowOrderForm(true);
    setSearchQuery("");
  };

  const handleSendButtonClick = () => {
    if (inputValue.trim().length > 0) {
      const parsedItems = parseTextToItems(inputValue);
      if (parsedItems.length > 0) {
        setOrderItems(parsedItems);
      }
      setShowOrderForm(true);
      setSearchQuery("");
    }
  };

  const handleCreateOrder = async () => {
    setIsProcessingOrder(true);
    setIsChatOpen(false);
    setShowOrderForm(false);

    const steps = [
      { step: 1, status: "pending" as const, message: "Processing order items and quantities" },
      { step: 2, status: "pending" as const, message: "Searching for available vendors" },
      { step: 3, status: "pending" as const, message: "Requesting quotes from vendors" },
      { step: 4, status: "pending" as const, message: "Analyzing pricing and terms" },
      { step: 5, status: "pending" as const, message: "Finalizing order details" },
    ];

    setOrderProgress(steps);

    // Simulate order processing steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setOrderProgress((prev) =>
        prev.map((s, index) => {
          if (index < i) {
            return { ...s, status: "completed" as const };
          } else if (index === i) {
            return { ...s, status: "active" as const };
          }
          return s;
        })
      );
    }

    // Mark all as completed
    setOrderProgress((prev) =>
      prev.map((s) => ({ ...s, status: "completed" as const }))
    );

    // Reset after showing completion
    setTimeout(() => {
      setIsProcessingOrder(false);
      setOrderProgress([]);
      setOrderItems([]);
      setInputValue("");
      setAttachedFiles([]);
      setSelectedProduct(null);
      setSelectedVendors([]);
    }, 2000);
  };

  return (
    <PlatformLayout isChatOpen={isChatOpen && !isProcessingOrder}>
      <div className="flex items-center justify-center min-h-full w-full px-4">
        <div className="w-full max-w-4xl relative">
          {/* Main Input Container */}
          <div className={`bg-gray-800 dark:bg-gray-800 rounded-3xl p-6 shadow-xl border transition-all duration-300 relative overflow-hidden ${
            isRecording 
              ? "border-gray-700 dark:border-gray-700" 
              : "border-gray-700 dark:border-gray-700"
          }`}>
            {/* Animated pulsing border effect when recording - moves around the border */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-3xl pointer-events-none">
                  {/* Top edge */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-3xl"
                    style={{
                      animation: 'pulse-top 4s ease-in-out infinite',
                    }}
                  />
                  {/* Right edge */}
                  <div 
                    className="absolute top-0 right-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent rounded-r-3xl"
                    style={{
                      animation: 'pulse-right 4s ease-in-out infinite',
                      animationDelay: '1s',
                    }}
                  />
                  {/* Bottom edge */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-b-3xl"
                    style={{
                      animation: 'pulse-bottom 4s ease-in-out infinite',
                      animationDelay: '2s',
                    }}
                  />
                  {/* Left edge */}
                  <div 
                    className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent rounded-l-3xl"
                    style={{
                      animation: 'pulse-left 4s ease-in-out infinite',
                      animationDelay: '3s',
                    }}
                  />
                </div>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes pulse-top {
                    0%, 25%, 50%, 75%, 100% { opacity: 0.3; }
                    12.5% { opacity: 1; }
                  }
                  @keyframes pulse-right {
                    0%, 25%, 50%, 75%, 100% { opacity: 0.3; }
                    37.5% { opacity: 1; }
                  }
                  @keyframes pulse-bottom {
                    0%, 25%, 50%, 75%, 100% { opacity: 0.3; }
                    62.5% { opacity: 1; }
                  }
                  @keyframes pulse-left {
                    0%, 25%, 50%, 75%, 100% { opacity: 0.3; }
                    87.5% { opacity: 1; }
                  }
                `}} />
              </>
            )}
            {/* Text Input Area */}
            <div className="mb-4 relative">
              {isRecording && (
                <div className="absolute top-0 left-0 text-sm text-cyan-400 font-medium mb-2">
                  Listening...
                </div>
              )}
              <label htmlFor="ask-input" className="sr-only">
                Ask anything
        </label>
              <textarea
                id="ask-input"
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? "Listening..." : "Ask anything..."}
                rows={4}
                className={`w-full px-0 py-2 text-xl bg-transparent text-gray-100 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none resize-none ${
                  isRecording ? "pt-6" : ""
                }`}
                style={{ minHeight: "120px" }}
                aria-label="Ask anything"
                disabled={isRecording}
              />
              {/* Attached Files Display */}
              {attachedFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600"
                    >
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-300 truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => {
                          setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-200 transition-colors"
                        aria-label="Remove file"
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
                  ))}
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700 dark:border-gray-700">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearchButtonClick}
                  className="p-2 rounded-lg bg-teal-900/50 border border-teal-500/50 hover:bg-teal-900/70 transition-colors"
                  aria-label="Search mode"
                >
                  <svg
                    className="h-4 w-4 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                <div className="h-6 w-px bg-gray-600"></div>
                <button
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors"
                  aria-label="Additional option"
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
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors"
                  aria-label="Web search"
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
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors"
                  aria-label="Attach file"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        setAttachedFiles((prev) => [...prev, ...files]);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif"
                  />
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
                <button
                  {...voiceButtonProps}
                  ref={voiceButtonRef}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "bg-red-600 text-white animate-pulse"
                      : "text-gray-400 hover:bg-gray-700/50"
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? (
                    <div className="relative">
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
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                        />
                      </svg>
                      <span className="absolute top-0 right-0 h-2 w-2 bg-red-400 rounded-full animate-ping"></span>
                    </div>
                  ) : (
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleSendButtonClick}
                  className="h-8 w-8 rounded-full bg-gray-600 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500 transition-colors flex items-center justify-center"
                  aria-label="Send message"
                >
                  <svg
                    className="h-4 w-4 text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
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
      <ChatInterface isOpen={isChatOpen && !isProcessingOrder} onClose={() => setIsChatOpen(false)} />

      {/* Order Processing Progress */}
      {isProcessingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Processing Order
            </h2>
            <div className="space-y-4">
              {orderProgress.map((progress, index) => (
                <div key={progress.step} className="flex items-start gap-4">
                  {/* Vertical line connector */}
                  {index > 0 && (
                    <div className="absolute left-6 w-0.5 h-8 -mt-8 bg-gray-300 dark:bg-gray-600" />
                  )}
                  
                  {/* Step indicator */}
                  <div className="relative flex-shrink-0">
                    {progress.status === "completed" ? (
                      <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : progress.status === "active" ? (
                      <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-0.5">
                    <p
                      className={`text-sm ${
                        progress.status === "active"
                          ? "text-blue-600 dark:text-blue-400 font-medium"
                          : progress.status === "completed"
                          ? "text-gray-600 dark:text-gray-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {progress.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOrderForm(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[95vw] h-[92vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Order
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedProduct 
                    ? `Select vendors for ${selectedProduct.name}`
                    : "Search and add products to your order"}
                </p>
              </div>
              <button
                onClick={() => setShowOrderForm(false)}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {/* Search and Filter - Shows vendor search when product is selected, product search otherwise */}
              <div className="mb-6">
                {selectedProduct ? (
                  <SearchAndFilter
                    searchPlaceholder="Search vendors..."
                    searchLabel="Search vendors"
                    searchValue={vendorSearchQuery}
                    onSearchChange={setVendorSearchQuery}
                    isFilterOpen={isVendorFilterOpen}
                    onFilterToggle={() => setIsVendorFilterOpen(!isVendorFilterOpen)}
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
                    onFilterChange={(newFilters) => setVendorFilters(newFilters as typeof vendorFilters)}
                    onClearFilters={() => setVendorFilters({ category: "all", rating: "all" })}
                    showFilterText={false}
                  />
                ) : (
                  <SearchAndFilter
                    searchPlaceholder="Search products..."
                    searchLabel="Search products"
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    isFilterOpen={isFilterOpen}
                    onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
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
                    onFilterChange={(newFilters) => setFilters(newFilters as typeof filters)}
                    onClearFilters={() => setFilters({ category: "all", priceRange: "all" })}
                    showFilterText={false}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Side - Search Results or Vendor Selection */}
                <div className="flex flex-col min-h-0">
                  {selectedProduct ? (
                    // Vendor Selection View
                    <div className="flex flex-col h-full min-h-0">
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedProduct(null);
                            setSelectedVendors([]);
                            setVendorSearchQuery("");
                            setVendorFilters({ category: "all", rating: "all" });
                          }}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
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
                              className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
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
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              No vendors found
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Try adjusting your search or filters
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-12">
                                      <span className="sr-only">Select</span>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Vendor Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Rating
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Orders
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Category
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {filteredVendors.map((vendor) => {
                                    const isSelected = selectedVendors.includes(vendor.id);
                                    return (
                                      <tr
                                        key={vendor.id}
                                        className={`cursor-pointer transition-colors ${
                                          isSelected
                                            ? "bg-blue-50 dark:bg-blue-900/20"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                        onClick={() => toggleVendorSelection(vendor.id)}
                                      >
                                        <td className="px-6 py-4">
        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleVendorSelection(vendor.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                          />
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                          {vendor.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                          <div className="flex items-center gap-1">
                                            <svg
                                              className="h-4 w-4 text-yellow-400"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span>{vendor.rating}</span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                          {vendor.orders}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
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
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 mt-4">
                        <button
                          onClick={handleAddSelectedVendors}
                          disabled={selectedVendors.length === 0}
                          className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {selectedVendors.length > 0
                            ? `Add ${selectedVendors.length} Vendor${selectedVendors.length > 1 ? "s" : ""} to Order`
                            : "Select vendors to add"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Product Search Results View
                    <div className="flex flex-col h-full min-h-0">
                      <div className="flex-1 overflow-y-auto min-h-0">
                        {searchResults.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <svg
                              className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                              />
                            </svg>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              No products found
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Try adjusting your search or filters
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Product Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {searchResults.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {product.name}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {product.description}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {product.category}
                                      </td>
                                      <td className="px-6 py-4 text-sm">
                                        <button
                                          onClick={() => handleAddProduct(product)}
                                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                                        >
                                          Add
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side - Order List */}
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order Items
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {orderItems.length} {orderItems.length === 1 ? "item" : "items"} in order
                    </p>
                  </div>
                  {orderItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                      <svg
                        className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        No items in order yet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Search and add products to get started
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                      {orderItems.map((item) => (
                        <div
                          key={item.itemKey}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {item.name}
                              </h4>
                              {item.vendorName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Vendor: {item.vendorName}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItemFromOrder(item.itemKey)}
                              className="rounded-lg p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.itemKey, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={item.quantity <= 1}
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
                                    d="M20 12H4"
                                  />
                                </svg>
                              </button>
                              <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateItemQuantity(item.itemKey, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(item.total)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {orderItems.length > 0 ? (
                  <>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {orderItems.length}
                    </span>{" "}
                    {orderItems.length === 1 ? "item" : "items"} • Total Quantity:{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>{" "}
                    • Total:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
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
                  onClick={() => {
                    setShowOrderForm(false);
                    setOrderItems([]);
                    setAttachedFiles([]);
                    setSelectedProduct(null);
                    setSelectedVendors([]);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (orderItems.length > 0) {
                      handleCreateOrder();
                    }
                  }}
                  disabled={orderItems.length === 0}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
      </div>
      )}

    </PlatformLayout>
  );
}
