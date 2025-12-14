import { OrderProgressStep } from "../types/order";

export const MOCK_PROGRESS_DATA: OrderProgressStep[] = [
    {
        step: 1,
        status: "completed",
        title: "Order Extraction",
        message: "Analyzing your request...",
        output: "• 50x Office Chairs\nBudget: $15,000\nUrgency: High"
    },
    {
        step: 2,
        status: "completed",
        title: "Vendor Identification",
        message: "Finding suitable vendors...",
        output: "Found 3 vendors:\n• Herman Miller (4.8★)\n• Steelcase (4.7★)\n• Haworth (4.5★)"
    },
    {
        step: 3,
        status: "completed",
        title: "Vendor Evaluation",
        message: "Checking availability and specs...",
        output: "Evaluated vendors. 3 are suitable:\n• Herman Miller\n• Steelcase\n• Haworth",
        isParallel: true,
        vendorProgress: [
            {
                vendorId: "v1",
                vendorName: "Herman Miller",
                status: "completed",
                output: "Stock confirmed available. Premium warranty included."
            },
            {
                vendorId: "v2",
                vendorName: "Steelcase",
                status: "completed",
                output: "Stock available. Standard delivery timeline."
            },
            {
                vendorId: "v3",
                vendorName: "Haworth",
                status: "completed",
                output: "Limited stock. 2 weeks lead time."
            }
        ]
    },
    {
        step: 4,
        status: "completed",
        title: "Negotiation Strategy",
        message: "Formulating negotiation approach...",
        isParallel: true,
        vendorProgress: [
            {
                vendorId: "v1",
                vendorName: "Herman Miller",
                status: "completed",
                output: "Strategy: Volume discount emphasis"
            },
            {
                vendorId: "v2",
                vendorName: "Steelcase",
                status: "completed",
                output: "Strategy: Competitor price matching"
            },
            {
                vendorId: "v3",
                vendorName: "Haworth",
                status: "completed",
                output: "Strategy: Availability leverage"
            }
        ]
    },
    {
        step: 5,
        status: "completed",
        title: "Negotiation Rounds",
        message: "Engaging with vendors...",
        isParallel: true,
        vendorProgress: [
            {
                vendorId: "v1",
                vendorName: "Herman Miller",
                status: "completed",
                output: "Final Offer: $14,200 (Total). Included: 5-year warranty."
            },
            {
                vendorId: "v2",
                vendorName: "Steelcase",
                status: "completed",
                output: "Final Offer: $14,800. Standard terms."
            },
            {
                vendorId: "v3",
                vendorName: "Haworth",
                status: "completed",
                output: "Final Offer: $15,000. Unable to expedite."
            }
        ]
    },
    {
        step: 6,
        status: "completed",
        title: "Final Decision",
        message: "Decision made.",
        output: "Selected Herman Miller based on best overall value and warranty coverage."
    },
    {
        step: 7,
        status: "completed",
        title: "Contract Generation",
        message: "Drafting keys...",
        output: "Contract #PO-2024-889 generated and signed."
    },
    {
        step: 8,
        status: "completed",
        title: "Order Finalized",
        message: "Process complete.",
        output: "Order successfully placed. Estimated delivery: Oct 24."
    }
];
