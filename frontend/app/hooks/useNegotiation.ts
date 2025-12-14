import { useState, useRef, useCallback } from 'react';
import { OrderProgressStep, VendorProgress } from '../types/order';

interface NegotiationState {
    isNegotiating: boolean;
    progress: OrderProgressStep[];
    error: string | null;
    finalResult: any | null;
}

// Track vendors for parallel processing
interface VendorTracker {
    [vendorId: string]: {
        name: string;
        relevant: boolean;
    };
}

interface UseNegotiationReturn extends NegotiationState {
    startNegotiation: (userInput: string, orderData?: any) => void;
    resetNegotiation: () => void;
}

export const useNegotiation = (): UseNegotiationReturn => {
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [progress, setProgress] = useState<OrderProgressStep[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [finalResult, setFinalResult] = useState<any | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const vendorTrackerRef = useRef<VendorTracker>({});

    const resetNegotiation = useCallback(() => {
        setIsNegotiating(false);
        setProgress([]);
        setError(null);
        setFinalResult(null);
        vendorTrackerRef.current = {};
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const startNegotiation = useCallback((userInput: string, orderData?: any) => {
        resetNegotiation();
        setIsNegotiating(true);

        // Default initial steps structure (will be updated/activated by events)
        // We can initialize with pending steps if we want a static skeleton, 
        // or build it dynamically. 
        // For smoother UI, let's initialize the known steps as "pending".
        const initialSteps: OrderProgressStep[] = [
            { step: 1, status: "pending", title: "Extracting order details", message: "Analyzing requirements..." },
            { step: 2, status: "pending", title: "Fetching vendors", message: "Searching database..." },
            { step: 3, status: "pending", title: "Evaluating vendors", message: "Checking suitability..." },
            { step: 4, status: "pending", title: "Generating strategies", message: "Planning negotiation..." },
            { step: 5, status: "pending", title: "Negotiating", message: "Talking to vendors..." },
            { step: 6, status: "pending", title: "Finalizing", message: "Aggregating results..." },
        ];
        setProgress(initialSteps);

        try {
            // Connect to WebSocket
            // Assuming backend is on localhost:8000 for development
            const wsUrl = "ws://localhost:8000/api/negotiate/ws";
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Connected to negotiation WebSocket");
                // Send start command
                ws.send(JSON.stringify({
                    type: "start_negotiation",
                    user_input: userInput,
                    order_object: orderData
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "progress") {
                        handleProgressUpdate(data.payload.node, data.message, data.payload.state_update);
                    } else if (data.type === "complete") {
                        setIsNegotiating(false); // Finished processing
                        // Mark all potentially remaining steps as complete
                        setProgress(prev => prev.map(s => ({ ...s, status: "completed" })));
                        // Close connection on success
                        ws.close();
                        wsRef.current = null;
                    } else if (data.type === "error") {
                        setError(data.payload.message);
                        setIsNegotiating(false);
                        // Close connection on error
                        ws.close();
                        wsRef.current = null;
                    }
                } catch (e) {
                    console.error("Error parsing WS message:", e);
                }
            };

            ws.onerror = (e) => {
                console.error("WebSocket error:", e);
                setError("Connection error occurred");
                setIsNegotiating(false);
            };

            ws.onclose = () => {
                console.log("WebSocket connection closed");
            };

        } catch (e) {
            console.error("Failed to start negotiation:", e);
            setError("Failed to start negotiation");
            setIsNegotiating(false);
        }
    }, [resetNegotiation]);

    const handleProgressUpdate = (node: string, message: string, stateUpdate: any) => {
        // Map nodes to steps (1-based index for OrderProgressStep)
        let stepIndex = -1;
        let stepTitle = "";

        switch (node) {
            case "extract_order":
                stepIndex = 1;
                stepTitle = "Order Extracted";
                break;
            case "fetch_vendors":
                stepIndex = 2;
                stepTitle = "Vendors Found";
                // Store all vendors for parallel tracking
                if (stateUpdate.all_vendors) {
                    const vendors = stateUpdate.all_vendors as any[];
                    vendors.forEach((v: any) => {
                        vendorTrackerRef.current[String(v.id)] = {
                            name: v.name || 'Unknown',
                            relevant: false
                        };
                    });
                }
                break;
            case "evaluate_vendor":
                stepIndex = 3;
                stepTitle = "Evaluating Vendors";
                // Track which vendors are relevant (this event may contain 0 or 1 vendor)
                if (stateUpdate.relevant_vendors) {
                    const relevant = stateUpdate.relevant_vendors as any[];
                    relevant.forEach((v: any) => {
                        const vendorId = String(v.id);
                        if (vendorTrackerRef.current[vendorId]) {
                            vendorTrackerRef.current[vendorId].relevant = true;
                        } else {
                            // Vendor not in tracker yet, add it
                            vendorTrackerRef.current[vendorId] = {
                                name: v.name || 'Unknown',
                                relevant: true
                            };
                        }
                    });
                }
                break;
            case "start_strategy_phase": // Or generate_strategy
            case "generate_strategy":
                stepIndex = 4;
                stepTitle = "Generating Strategies";
                break;
            case "start_negotiation_phase":
            case "negotiate":
                stepIndex = 5;
                stepTitle = "Negotiating";
                break;
            case "aggregator":
                stepIndex = 6;
                stepTitle = "Finalizing";
                break;
            default:
                // Unknown node, maybe ignore or log
                return;
        }

        if (stepIndex !== -1) {
            setProgress(prev => {
                const newProgress = [...prev];

                // Find the step in our list
                const existingStepIdx = newProgress.findIndex(s => s.step === stepIndex);

                if (existingStepIdx !== -1) {
                    const step = newProgress[existingStepIdx];
                    const isParallelStep = stepIndex >= 3 && stepIndex <= 5;

                    // Initialize vendor progress if this is a parallel step
                    if (isParallelStep && !step.vendorProgress) {
                        let vendorsToTrack: Array<[string, { name: string; relevant: boolean }]>;

                        if (stepIndex === 3) {
                            // For evaluation step, track ALL vendors
                            vendorsToTrack = Object.entries(vendorTrackerRef.current);
                        } else {
                            // For steps 4-5, only track relevant vendors
                            vendorsToTrack = Object.entries(vendorTrackerRef.current)
                                .filter(([_, info]) => info.relevant);
                        }

                        const vendorProgress = vendorsToTrack.map(([vendorId, info]) => ({
                            vendorId,
                            vendorName: info.name,
                            status: "pending" as const,
                            output: undefined
                        }));

                        if (vendorProgress.length > 0) {
                            step.vendorProgress = vendorProgress;
                            step.isParallel = true;
                        }
                    }

                    // Update vendor-specific progress for parallel steps
                    if (isParallelStep && step.vendorProgress) {
                        const updatedVendorProgress = [...step.vendorProgress];

                        if (node === "evaluate_vendor") {
                            // This event may contain a vendor that was evaluated
                            // If relevant_vendors has items, this vendor passed; if empty, it didn't
                            const relevant = (stateUpdate.relevant_vendors || []) as any[];

                            // We need to identify which vendor was evaluated
                            // Since we get events per vendor, we can check if any vendor in our tracker matches
                            // For now, mark the first pending vendor as completed (since events come one per vendor)
                            const pendingIdx = updatedVendorProgress.findIndex(vp => vp.status === "pending");
                            if (pendingIdx !== -1) {
                                const vendorId = updatedVendorProgress[pendingIdx].vendorId;
                                const vendorInfo = vendorTrackerRef.current[vendorId];

                                if (vendorInfo) {
                                    updatedVendorProgress[pendingIdx] = {
                                        ...updatedVendorProgress[pendingIdx],
                                        status: "completed",
                                        output: relevant.length > 0
                                            ? formatOutput(node, stateUpdate)
                                            : "Not suitable for this order"
                                    };
                                }
                            }

                            // Mark others as active if any completed
                            updatedVendorProgress.forEach((vp, idx) => {
                                if (vp.status === "pending") {
                                    updatedVendorProgress[idx] = { ...vp, status: "active" };
                                }
                            });
                        } else if (node === "generate_strategy" && stateUpdate.vendor_strategies) {
                            const strategies = stateUpdate.vendor_strategies as Record<string, any>;
                            Object.entries(strategies).forEach(([vendorId, strat]: [string, any]) => {
                                const idx = updatedVendorProgress.findIndex(vp => vp.vendorId === vendorId);
                                if (idx !== -1) {
                                    updatedVendorProgress[idx] = {
                                        ...updatedVendorProgress[idx],
                                        status: "completed",
                                        output: formatOutput(node, { vendor_strategies: { [vendorId]: strat } })
                                    };
                                }
                            });
                            // Mark others as active
                            updatedVendorProgress.forEach((vp, idx) => {
                                if (vp.status === "pending") {
                                    updatedVendorProgress[idx] = { ...vp, status: "active" };
                                }
                            });
                        } else if (node === "negotiate" && stateUpdate.leaderboard) {
                            const leaderboard = stateUpdate.leaderboard as Record<string, any>;
                            Object.entries(leaderboard).forEach(([vendorId, offer]: [string, any]) => {
                                const idx = updatedVendorProgress.findIndex(vp => vp.vendorId === vendorId);
                                if (idx !== -1) {
                                    updatedVendorProgress[idx] = {
                                        ...updatedVendorProgress[idx],
                                        status: "completed",
                                        output: formatOutput(node, { leaderboard: { [vendorId]: offer } })
                                    };
                                }
                            });
                            // Mark others as active
                            updatedVendorProgress.forEach((vp, idx) => {
                                if (vp.status === "pending") {
                                    updatedVendorProgress[idx] = { ...vp, status: "active" };
                                }
                            });
                        }

                        // Update step with vendor progress
                        const allVendorsCompleted = updatedVendorProgress.every(vp => vp.status === "completed");
                        newProgress[existingStepIdx] = {
                            ...step,
                            status: allVendorsCompleted ? "completed" : "active",
                            message: message,
                            vendorProgress: updatedVendorProgress,
                            output: formatOutput(node, stateUpdate) // Keep overall output for summary
                        };
                    } else {
                        // Non-parallel step or no vendor progress yet - use existing logic
                        newProgress[existingStepIdx] = {
                            ...step,
                            status: "active",
                            message: message,
                            output: formatOutput(node, stateUpdate)
                        };
                    }

                    // Mark previous steps as completed
                    for (let i = 0; i < existingStepIdx; i++) {
                        newProgress[i] = { ...newProgress[i], status: "completed" };
                    }
                }

                if (node === "aggregator") {
                    // If it's the last one, mark it completed too
                    if (existingStepIdx !== -1) {
                        newProgress[existingStepIdx].status = "completed";
                    }
                    setFinalResult(stateUpdate.final_comparison_report || stateUpdate);
                }

                return newProgress;
            });
        }
    };

    const formatOutput = (node: string, state: any): string => {
        // Helper to make the JSON state look nice in the UI "output" field
        if (node === "extract_order" && state.order_object) {
            const o = state.order_object;
            // Format: • 1x Coffee Machine
            //         Budget: ...
            let text = `• ${o.quantity.preferred}x ${o.item}`;
            if (o.budget) text += `\nBudget: $${o.budget}`;
            if (o.urgency) text += `\nUrgency: ${o.urgency}`;
            return text;
        }
        if (node === "fetch_vendors" && state.all_vendors) {
            const vendors = state.all_vendors as any[];
            if (!vendors || vendors.length === 0) return "No vendors found.";
            return `Found ${vendors.length} potential vendors:\n${vendors.map(v => `• ${v.name} (${v.rating}★)`).join('\n')}`;
        }

        if (node === "evaluate_vendor" && state.relevant_vendors) {
            const relevant = state.relevant_vendors as any[];
            if (!relevant || relevant.length === 0) return "Not suitable for this order.";
            // For vendor-specific output, just show the vendor name
            return relevant.map(v => `• ${v.name}`).join('\n');
        }

        if ((node === "generate_strategy" || node === "start_strategy_phase") && state.vendor_strategies) {
            const strategies = state.vendor_strategies as Record<string, any>;
            return Object.values(strategies).map((strat: any) =>
                `• ${strat.vendor_name || 'Vendor'}: ${strat.strategy_name || 'Standard Strategy'}`
            ).join('\n');
        }

        if ((node === "negotiate" || node === "start_negotiation_phase") && state.leaderboard) {
            const leaderboard = state.leaderboard as Record<string, any>;
            const offers = Object.values(leaderboard).filter(o => o.price_total);
            if (offers.length === 0) return "Waiting for quote...";

            // For vendor-specific output, show price only
            const offer = offers[0] as any;
            return `• Offer: $${offer.price_total}`;
        }

        if (node === "aggregator" && state.market_analysis) {
            const analysis = state.market_analysis;
            if (analysis.benchmarks) {
                return `• Best Price: $${analysis.benchmarks.best_price}\n• Median Price: $${analysis.benchmarks.median_price}\n• Vendor Rankings: ${analysis.rankings.length} ranked`;
            }
        }

        return JSON.stringify(state, null, 2); // Fallback
    };

    return {
        isNegotiating,
        progress,
        error,
        finalResult,
        startNegotiation,
        resetNegotiation
    };
};
