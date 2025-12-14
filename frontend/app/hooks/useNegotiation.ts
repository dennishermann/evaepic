import { useState, useRef, useCallback } from 'react';
import { OrderProgressStep } from '../types/order';

interface NegotiationState {
    isNegotiating: boolean;
    progress: OrderProgressStep[];
    error: string | null;
    finalResult: any | null;
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

    const resetNegotiation = useCallback(() => {
        setIsNegotiating(false);
        setProgress([]);
        setError(null);
        setFinalResult(null);
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
                break;
            case "evaluate_vendor":
                stepIndex = 3;
                stepTitle = "Vendors Evaluated";
                break;
            case "start_strategy_phase": // Or generate_strategy
            case "generate_strategy":
                stepIndex = 4;
                stepTitle = "Strategy Generated";
                break;
            case "start_negotiation_phase":
            case "negotiate":
                stepIndex = 5;
                stepTitle = "Negotiation Round";
                break;
            case "aggregator":
                stepIndex = 6;
                stepTitle = "Analysis Complete";
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
                    // Update existing step
                    newProgress[existingStepIdx] = {
                        ...newProgress[existingStepIdx],
                        status: "active", // Or "completed" if it's done-done?
                        // Actually, if we get an update for step X, it means step X just finished/updated.
                        // So we mark previous steps as completed.
                        message: message,
                        output: formatOutput(node, stateUpdate)
                    };

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
            if (!relevant || relevant.length === 0) return "No suitable vendors found.";
            return `Evaluated vendors. ${relevant.length} are suitable for this order:\n${relevant.map(v => `• ${v.name}`).join('\n')}`;
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
            if (offers.length === 0) return "Waiting for initial quotes...";

            // Sort by price
            offers.sort((a: any, b: any) => a.price_total - b.price_total);

            return `Latest Offers:\n${offers.map((o: any) => `• ${o.vendor_name}: $${o.price_total}`).join('\n')}`;
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
