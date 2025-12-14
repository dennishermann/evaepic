"use client";

import React from "react";

interface OrderResultCardProps {
    result: any;
}

export default function OrderResultCard({ result }: OrderResultCardProps) {
    if (!result) return null;

    // Use recommendation if available
    const vendorName = result.recommended_vendor_name || "Unknown Vendor";
    const reason = result.recommendation_reason || "Negotiation completed.";

    // Try to find the price details
    const recommendedId = result.recommended_vendor_id;
    const vendorData = result.vendors ? result.vendors.find((v: any) => v.vendor_id === recommendedId) : null;

    const price = vendorData?.final_offer?.price_total
        ? `$${vendorData.final_offer.price_total}`
        : "Custom Quote";

    return (
        <div className="w-full max-w-4xl mt-6">
            <div className="bg-gradient-to-br from-white/80 via-[#FAF0E6]/70 to-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#DEB887]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-3xl font-bold text-[#5C4A3A] mb-2">Deal Finalized</h2>
                            <p className="text-[#8B7355] text-lg max-w-xl leading-relaxed">
                                {reason}
                            </p>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg min-w-[200px] text-center transform rotate-1 transition-transform hover:rotate-0">
                            <div className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Final Price</div>
                            <div className="text-4xl font-extrabold text-[#5C4A3A]">{price}</div>
                            <div className="text-sm font-medium text-[#6B5B4F] mt-2 border-t border-[#8B7355]/20 pt-2">
                                {vendorName}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
