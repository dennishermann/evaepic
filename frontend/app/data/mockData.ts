/**
 * Centralized Mock Data - Aligned with Backend Schema
 * 
 * Backend Models Reference:
 * - OrderObject: item, quantity, budget, currency, requirements, urgency
 * - Vendor: id, name, category, rating, behavioral_prompt
 * - Quote: vendor_id, price, currency, quantity, delivery_time, terms
 * - OfferSnapshot: price_total, delivery_days, payment_terms, status
 */

// Procurement Categories (matching backend vendor categories)
export const PROCUREMENT_CATEGORIES = [
    "Office Equipment",
    "IT Hardware",
    "Furniture",
    "Office Supplies",
    "Software & Licenses",
    "Facility Services",
    "Marketing Materials",
    "Industrial Equipment"
];

// Mock Vendors (aligned with backend Vendor model)
export const MOCK_VENDORS = [
    {
        id: 1,
        name: "Herman Miller",
        category: ["Furniture", "Office Equipment"],
        rating: 4.8,
        description: "Premium office furniture and ergonomic solutions",
        is_predefined: true
    },
    {
        id: 2,
        name: "Steelcase",
        category: ["Furniture"],
        rating: 4.7,
        description: "Workplace furniture and architectural solutions",
        is_predefined: true
    },
    {
        id: 3,
        name: "Dell Technologies",
        category: ["IT Hardware"],
        rating: 4.6,
        description: "Enterprise computing and technology solutions",
        is_predefined: true
    },
    {
        id: 4,
        name: "Staples Business Advantage",
        category: ["Office Supplies"],
        rating: 4.5,
        description: "Office supplies and workplace essentials",
        is_predefined: true
    },
    {
        id: 5,
        name: "CDW Corporation",
        category: ["IT Hardware", "Software & Licenses"],
        rating: 4.7,
        description: "Technology products and IT solutions",
        is_predefined: true
    }
];

// Mock Orders (aligned with OrderObject + negotiation results)
export const MOCK_ORDERS = [
    {
        id: "ORD-2024-001",
        item: "Ergonomic Office Chairs",
        quantity: { min: 45, max: 50, preferred: 48 },
        budget: 15000,
        currency: "USD",
        vendor: "Herman Miller",
        vendor_id: 1,
        status: "completed",
        final_price: 14200,
        urgency: "medium",
        created_date: "2024-01-15",
        completed_date: "2024-01-18"
    },
    {
        id: "ORD-2024-002",
        item: "Dell Latitude Laptops",
        quantity: { min: 20, max: 25, preferred: 22 },
        budget: 35000,
        currency: "USD",
        vendor: "Dell Technologies",
        vendor_id: 3,
        status: "in_negotiation",
        current_offer: 32500,
        urgency: "high",
        created_date: "2024-01-20"
    },
    {
        id: "ORD-2024-003",
        item: "Standing Desks",
        quantity: { min: 30, max: 35, preferred: 32 },
        budget: 18000,
        currency: "USD",
        vendor: "Steelcase",
        vendor_id: 2,
        status: "pending_approval",
        final_price: 17400,
        urgency: "low",
        created_date: "2024-01-22"
    },
    {
        id: "ORD-2024-004",
        item: "Office Supply Package (Q1)",
        quantity: { min: 1, max: 1, preferred: 1 },
        budget: 5000,
        currency: "USD",
        vendor: "Staples Business Advantage",
        vendor_id: 4,
        status: "completed",
        final_price: 4650,
        urgency: "medium",
        created_date: "2024-01-10",
        completed_date: "2024-01-12"
    },
    {
        id: "ORD-2024-005",
        item: "Microsoft 365 Enterprise Licenses",
        quantity: { min: 100, max: 120, preferred: 110 },
        budget: 12000,
        currency: "USD",
        vendor: "CDW Corporation",
        vendor_id: 5,
        status: "in_negotiation",
        current_offer: 11200,
        urgency: "urgent",
        created_date: "2024-01-25"
    }
];

// Mock Negotiations (aligned with negotiation flow)
export const MOCK_NEGOTIATIONS = [
    {
        id: "NEG-2024-001",
        order_id: "ORD-2024-002",
        vendor: "Dell Technologies",
        vendor_id: 3,
        item: "Dell Latitude Laptops",
        status: "in_progress",
        initial_price: 38000,
        current_offer: 32500,
        target_price: 31000,
        savings: 5500,
        progress: 75,
        rounds_completed: 2,
        max_rounds: 3,
        created_date: "2024-01-20",
        last_activity: "2024-01-25"
    },
    {
        id: "NEG-2024-002",
        order_id: "ORD-2024-005",
        vendor: "CDW Corporation",
        vendor_id: 5,
        item: "Microsoft 365 Licenses",
        status: "in_progress",
        initial_price: 13200,
        current_offer: 11200,
        target_price: 10500,
        savings: 2000,
        progress: 65,
        rounds_completed: 1,
        max_rounds: 3,
        created_date: "2024-01-25",
        last_activity: "2024-01-26"
    },
    {
        id: "NEG-2024-003",
        order_id: "ORD-2024-001",
        vendor: "Herman Miller",
        vendor_id: 1,
        item: "Ergonomic Office Chairs",
        status: "completed",
        initial_price: 16500,
        final_price: 14200,
        target_price: 14000,
        savings: 2300,
        progress: 100,
        rounds_completed: 3,
        max_rounds: 3,
        created_date: "2024-01-15",
        completed_date: "2024-01-18"
    }
];

// Mock Quotes (aligned with Quote model)
export const MOCK_QUOTES = [
    {
        id: "QUO-2024-001",
        vendor_id: 1,
        vendor: "Herman Miller",
        item: "Ergonomic Office Chairs",
        price: 14200,
        currency: "USD",
        quantity: 48,
        delivery_time: "14 days",
        payment_terms: "Net 30",
        status: "accepted",
        created_date: "2024-01-16",
        valid_until: "2024-02-16"
    },
    {
        id: "QUO-2024-002",
        vendor_id: 3,
        vendor: "Dell Technologies",
        item: "Dell Latitude Laptops",
        price: 32500,
        currency: "USD",
        quantity: 22,
        delivery_time: "7 days",
        payment_terms: "Net 45",
        status: "pending",
        created_date: "2024-01-24",
        valid_until: "2024-02-24"
    },
    {
        id: "QUO-2024-003",
        vendor_id: 2,
        vendor: "Steelcase",
        item: "Standing Desks",
        price: 17400,
        currency: "USD",
        quantity: 32,
        delivery_time: "21 days",
        payment_terms: "Net 30",
        status: "pending",
        created_date: "2024-01-23",
        valid_until: "2024-02-23"
    }
];

// Dashboard Statistics
export const MOCK_DASHBOARD_STATS = {
    totalOrders: 45,
    activeOrders: 12,
    pendingQuotes: 8,
    activeVendors: 24,
    activeNegotiations: 5,
    completedOrders: 28,
    totalSavings: 125000,
    avgNegotiationTime: "2.4 days",
    successRate: 87,
    avgSavingsPercent: 14.5
};
