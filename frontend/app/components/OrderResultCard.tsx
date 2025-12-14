"use client";

import React, { useState } from "react";
import { OrderResult } from "../types/order";

interface OrderResultCardProps {
    result: OrderResult;
}

export default function OrderResultCard({ result }: OrderResultCardProps) {
    const [showToast, setShowToast] = useState(false);

    if (!result) return null;

    // Robust data extraction with fallbacks
    const vendorName = result.recommended_vendor_name || "Unknown Vendor";
    const reason = result.recommendation_reason || "Negotiation completed.";

    // Try to find the price details
    const recommendedId = result.recommended_vendor_id;
    let price = "Custom Quote";

    if (result.vendors && recommendedId) {
        const vendorData = result.vendors.find((v: any) =>
            String(v.vendor_id) === String(recommendedId) || String(v.vendorId) === String(recommendedId)
        );
        if (vendorData?.final_offer?.price_total) {
            price = `$${vendorData.final_offer.price_total}`;
        }
    } else if (result.savings && result.savings.amount) {
        // Fallback: maybe price isn't here but savings are?
        // This is just a placeholder logic, usually price is key.
    }

    return (
        <div className="w-full max-w-4xl mt-6">
            <div className="bg-gradient-to-br from-white/80 via-[#FAF0E6]/70 to-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#DEB887]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    {/* Main Header & Recommendation */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-[#5C4A3A] mb-2">Final Offer</h2>
                            <p className="text-[#8B7355] text-lg leading-relaxed mb-4">
                                {reason}
                            </p>
                            {result.human_action && (
                                <div className="text-sm font-medium text-[#6B5B4F] bg-white/40 p-3 rounded-xl border border-white/40 inline-block">
                                    <span className="font-bold text-[#5C4A3A]">Next Step:</span> {result.human_action}
                                </div>
                            )}
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg min-w-[200px] text-center transform transition-transform hover:scale-105">
                            <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Final Price</div>
                            <div className="text-4xl font-extrabold text-[#5C4A3A]">{price}</div>
                            <div className="text-sm font-medium text-[#6B5B4F] mt-2 border-t border-[#8B7355]/20 pt-2">
                                {vendorName}
                            </div>
                        </div>
                    </div>

                    {/* Market Context & Vendor Leaderboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Market Summary Panel */}
                        <div className="lg:col-span-1 bg-white/30 rounded-2xl p-5 border border-white/40 flex flex-col justify-center">
                            <h3 className="text-sm font-bold text-[#5C4A3A] uppercase tracking-wider mb-2 border-b border-[#8B7355]/20 pb-2">Market Context</h3>
                            <p className="text-sm text-[#6B5B4F] leading-relaxed italic">
                                "{result.market_summary || "Negotiation completed successfully."}"
                            </p>
                        </div>

                        {/* Top Vendors List */}
                        <div className="lg:col-span-2 space-y-3">
                            <h3 className="text-sm font-bold text-[#5C4A3A] uppercase tracking-wider pl-1">Top Vendors</h3>
                            {result.vendors?.slice(0, 3).map((vendor: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between bg-white/50 hover:bg-white/70 transition-colors p-4 rounded-xl border border-white/40 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${idx === 0 ? "bg-[#8B7355]" : "bg-[#B0A090]"}`}>
                                            {vendor.rank || idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[#5C4A3A] text-sm">{vendor.vendor_name || vendor.name}</div>
                                            {vendor.score && <div className="text-xs text-[#8B7355]">Score: {vendor.score}</div>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-[#5C4A3A]">
                                            {vendor.final_offer?.price_total ? `$${vendor.final_offer.price_total.toLocaleString()}` : "N/A"}
                                        </div>
                                        {(vendor.rank === 1 || idx === 0) && <div className="text-[10px] uppercase font-bold text-green-600 tracking-wide">Best Value</div>}
                                    </div>
                                </div>
                            ))}
                            {(!result.vendors || result.vendors.length === 0) && <div className="text-sm text-gray-400 italic pl-1">No vendor ranking available.</div>}
                        </div>
                    </div>

                    {/* Approval Button */}
                    <div className="flex justify-center pt-4 border-t border-[#8B7355]/20">
                        <button
                            onClick={() => {
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 4000);
                            }}
                            className="group relative px-8 py-4 bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] hover:from-[#6B5B4F] hover:to-[#5C4A3A] text-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 font-semibold text-lg flex items-center gap-3">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Approve & Finalize Deal</span>
                            <svg className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Toast Notification */}
            {showToast && (
                <div className="fixed top-8 right-8 z-50 animate-slide-in">
                    <div className="bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] text-white px-6 py-4 rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm flex items-center gap-4 min-w-[320px]">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">Deal Approved!</h4>
                            <p className="text-sm text-white/90">
                                Order with {vendorName} for {price} has been finalized.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowToast(false)}
                            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
