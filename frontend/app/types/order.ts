import React from "react";

export interface OrderItem {
  id: number;
  itemKey: string; // Unique key combining product id and vendor id
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description: string;
  vendorId?: number;
  vendorName?: string;
  budget?: number;
  currency?: string;
  requirements?: string;
  urgency?: "low" | "medium" | "high" | "critical";
}

export interface VendorProgress {
  vendorId: string;
  vendorName: string;
  status: "pending" | "active" | "completed";
  output?: string;
}

export interface OrderProgressStep {
  step: number;
  status: "pending" | "active" | "completed";
  title: string;
  message: string;
  output?: string | React.ReactNode;
  // For parallel vendor processing (steps 3-5)
  vendorProgress?: VendorProgress[];
  isParallel?: boolean; // Indicates if this step has parallel vendor processing
}

export interface OrderResult {
  recommended_vendor_name?: string;
  recommended_vendor_id?: string | number;
  recommendation_reason?: string;
  human_action?: string;
  market_summary?: string;
  vendors?: Array<{
    vendor_id: string | number;
    vendor_name?: string;
    name?: string;
    rank?: number;
    score?: number;
    final_offer?: {
      price_total?: number | string;
      items?: any[];
    };
  }>;
  savings?: {
    amount?: number;
    percentage?: number;
  };
  market_analysis?: any;
}
