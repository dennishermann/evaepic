"use client";

import { useState, useEffect } from "react";
import { OrderProgressStep } from "../types/order";

interface OrderProgressUIProps {
  progress: OrderProgressStep[];
}

// Helper component to render output as cards based on backend data structure
function OutputCards({ output, stepNumber, contextVendorName }: { output: string; stepNumber: number; contextVendorName?: string }) {
  const lines = output.split('\n').filter(line => line.trim());

  // Parse based on step number and output format from backend
  const cards: Array<{ title: string; details?: Array<{ label: string; value: string }>; subtitle?: string }> = [];
  let currentCard: { title: string; details?: Array<{ label: string; value: string }>; subtitle?: string } | null = null;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Step 1: Order Extraction - format: "• 1x Item\nBudget: $X\nUrgency: Y"
    if (stepNumber === 1 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      currentCard = { title: cleanLine, details: [] };
      cards.push(currentCard);
    } else if (stepNumber === 1 && currentCard && trimmed.includes(':')) {
      const [label, value] = trimmed.split(/:(.+)/);
      if (currentCard.details) {
        currentCard.details.push({ label: label.trim(), value: value.trim() });
      }
    }
    // Step 2: Vendors - format: "Found X vendors:\n• Vendor Name (rating★)"
    else if (stepNumber === 2 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      // Extract vendor name and rating if present
      const match = cleanLine.match(/^(.+?)\s*\((\d+(?:\.\d+)?)★\)$/);
      if (match) {
        cards.push({ title: match[1].trim(), subtitle: `${match[2]}★` });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Step 3: Evaluated Vendors - format: "Evaluated vendors. X are suitable:\n• Vendor Name"
    else if (stepNumber === 3 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      cards.push({ title: cleanLine, subtitle: "Suitable" });
    }
    // Step 4: Strategies - format: "• Vendor Name: Strategy Name"
    else if (stepNumber === 4 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      if (cleanLine.includes(':')) {
        const [vendor, strategy] = cleanLine.split(/:(.+)/);
        cards.push({ title: vendor.trim(), subtitle: strategy.trim() });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Step 5: Negotiation Offers - format: "Latest Offers:\n• Vendor Name: $price"
    else if (stepNumber === 5 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      if (cleanLine.includes(':')) {
        const [vendor, price] = cleanLine.split(/:(.+)/);
        cards.push({ title: vendor.trim(), subtitle: price.trim() });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Step 6: Market Analysis - format: "• Best Price: $X\n• Median Price: $Y\n• Vendor Rankings: X ranked"
    else if (stepNumber === 6 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      if (cleanLine.includes(':')) {
        const [label, value] = cleanLine.split(/:(.+)/);
        cards.push({ title: label.trim(), subtitle: value.trim() });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Generic fallback for bullet points or plain lines
    else {
      let cleanLine = trimmed;
      if (trimmed.startsWith('•')) {
        cleanLine = trimmed.substring(1).trim();
      }

      // Clean up redundant vendor names if provided
      if (contextVendorName && cleanLine.startsWith(contextVendorName)) {
        // If "VendorName: Value", strip prefix
        if (cleanLine.includes(':')) {
          cleanLine = cleanLine.substring(cleanLine.indexOf(':') + 1).trim();
        }
        // If just "VendorName", implies status confirmation
        else if (cleanLine === contextVendorName) {
          cleanLine = "Verified Suitable";
        }
      }

      if (cleanLine.includes(':')) {
        const splitIdx = cleanLine.indexOf(':');
        const title = cleanLine.substring(0, splitIdx).trim();
        const val = cleanLine.substring(splitIdx + 1).trim();
        cards.push({ title, subtitle: val });
      } else {
        cards.push({ title: cleanLine });
      }
    }
  });

  if (cards.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-2">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-[#5C4A3A] text-sm">{card.title}</h4>
            {card.details && card.details.length > 0 && (
              <div className="mt-2 space-y-1">
                {card.details.map((detail, detailIdx) => (
                  <div key={detailIdx} className="text-xs text-[#8B7355]">
                    <span className="font-medium">{detail.label}:</span> <span className="text-[#6B5B4F]">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}
            {card.subtitle && !card.details && (
              <p className="text-sm text-[#8B7355] mt-1 font-medium">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default: show as simple text block if no bullet structure found
  return (
    <div className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-sm">
      <div className="text-sm text-[#6B5B4F] leading-relaxed whitespace-pre-wrap font-medium">
        {output}
      </div>
    </div>
  );
}

export default function OrderProgressUI({ progress }: OrderProgressUIProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter to only show completed and active steps
  const visibleSteps = progress.filter(
    (step) => step.status === "completed" || step.status === "active"
  );

  // Get the current active step or the last completed step
  const activeStep = progress.find((step) => step.status === "active");
  const allCompleted = progress.length > 0 && progress.every((step) => step.status === "completed");
  const lastStep = progress[progress.length - 1];

  // Determine the title based on current step
  const getTitle = () => {
    if (allCompleted) {
      return "Order Processing Complete";
    }
    if (activeStep) {
      return activeStep.title;
    }
    if (lastStep && lastStep.status === "completed") {
      return "Finalizing Order";
    }
    return "Processing Order";
  };

  // When processing is complete, start collapsed
  useEffect(() => {
    if (allCompleted && !isExpanded) {
      setIsExpanded(false);
    }
  }, [allCompleted]);

  return (
    <div className="w-full max-w-6xl mb-6">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes unfold {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            max-height: 500px;
          }
        }
        .unfolding {
          animation: unfold 1.2s ease-out forwards;
          overflow: hidden;
        }
        .unfolding-delay {
          animation: unfold 1.2s ease-out 0.3s forwards;
          opacity: 0;
          overflow: hidden;
        }
      `}} />
      <div className="bg-gradient-to-br from-white/60 via-[#FAF0E6]/50 to-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#5C4A3A]">
            {getTitle()}
          </h2>
          {allCompleted && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#8B7355] hover:text-[#5C4A3A] hover:bg-white/60 backdrop-blur-md rounded-2xl transition-all shadow-md"
            >
              <span>{isExpanded ? "Hide" : "Show"} Details</span>
              <svg
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""
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
          )}
        </div>
        {(isExpanded || !allCompleted) && (
          <div className="space-y-6 relative pl-6">
            {/* Continuous main vertical line through all steps */}
            <div className="absolute left-3 w-0.5 bg-[#DEB887] top-0 bottom-0 z-0" style={{ marginLeft: '0' }} />

            {visibleSteps.map((step, index) => {
              // RELY ON DATA, NOT BOOLEAN: If vendorProgress exists and has items, it is parallel.
              const isParallelStep = step.vendorProgress && step.vendorProgress.length > 0;
              const prevStep = index > 0 ? visibleSteps[index - 1] : null;
              const nextStep = index < visibleSteps.length - 1 ? visibleSteps[index + 1] : null;

              const prevIsParallel = prevStep?.vendorProgress && prevStep.vendorProgress.length > 0;
              const nextIsParallel = nextStep?.vendorProgress && nextStep.vendorProgress.length > 0;

              if (isParallelStep) {
                const vendorCount = step.vendorProgress!.length;
                const isFirstParallelStep = !prevIsParallel; // This is the first step that branches

                // Render parallel vendor lines side by side
                return (
                  <div key={step.step} className="space-y-4 relative pb-6">
                    {/* Step header with main indicator - positioned on main line */}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="relative flex-shrink-0 mt-1" style={{ marginLeft: '-24px' }}>
                        {step.status === "completed" ? (
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] shadow-md flex items-center justify-center border-2 border-white">
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
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-[#8B7355] border-t-transparent animate-spin bg-white" />
                        )}
                      </div>
                      <h3
                        className={`text-base font-semibold ${step.status === "active"
                          ? "text-[#8B7355]"
                          : "text-[#5C4A3A]"
                          }`}
                      >
                        {step.title}
                      </h3>
                    </div>

                    {/* Parallel vendor lines - side by side */}
                    <div className="ml-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative mt-12">
                      {step.vendorProgress!.map((vendorProgress, vIndex) => {
                        const isFirst = vIndex === 0;
                        const isLast = vIndex === vendorCount - 1;

                        // Use border-dotted for branch lines
                        // Remove bg color, use border instead
                        const animClass = step.status === 'active' || vendorProgress.status === 'active' ? 'animate-pulse' : '';
                        const baseLineClass = `absolute border-[#DEB887] border-dotted ${animClass}`;

                        // Vertical: border-l-2, width stays small (0.5 or 0 is fine, existing was 0.5)
                        const vertLineClass = `${baseLineClass} border-l-2`;
                        // Horizontal: border-t-2
                        const horizLineClass = `${baseLineClass} border-t-2`;

                        // Animation: Apply 'unfolding' to content elements, NOT the container, 
                        // because the container has overflow:hidden which clips the negative-positioned lines.
                        const unfoldClass = vendorProgress.status === "active" ? "unfolding" : "";

                        return (
                          <div
                            key={vendorProgress.vendorId}
                            className="flex flex-col items-center gap-3 relative"
                          >

                            {/* TOP CONNECTOR LOGIC */}
                            {!prevIsParallel ? (
                              /* CASE A: First Parallel Step -> Branch from Main Timeline */
                              <>
                                {/* Vertical Line Up (connects vendor to the horizontal level) */}
                                <div
                                  className={`${vertLineClass} w-0.5`}
                                  style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    top: '-32px', // Go up to the branching level
                                    height: '32px'
                                  }}
                                />

                                {/* Horizontal Line Left */}
                                <div
                                  className={`${horizLineClass} h-0.5`}
                                  style={{
                                    right: '50%', // Starts from center of vendor
                                    top: '-32px',
                                    // For first item: reach all the way to main line (-28px approx relative to grid start)
                                    // For others: reach into the gap (50% + half gap)
                                    width: isFirst ? 'calc(50% + 80px)' : 'calc(50% + 20px)'
                                  }}
                                />

                                {/* Horizontal Line Right (except for last item) */}
                                {!isLast && (
                                  <div
                                    className={`${horizLineClass} h-0.5`}
                                    style={{
                                      left: '50%', // Starts from center of vendor
                                      top: '-32px',
                                      width: 'calc(50% + 20px)' // Reach into the gap
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              /* CASE B: Continuation Step -> Connect Straight Up to Previous Vendor */
                              <div
                                className={`${vertLineClass} w-0.5`}
                                style={{
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  top: '-150px', // Extended reach to close gap
                                  height: '150px'
                                }}
                              />
                            )}

                            {/* CONTINUOUS SPINE LINE (Runs top to bottom behind the card) */}
                            <div
                              className={`absolute left-1/2 transform -translate-x-1/2 w-0.5 border-l-2 border-dotted border-[#DEB887] top-0 bottom-0 z-0 ${step.status === 'active' ? 'animate-pulse' : ''}`}
                            />

                            {/* Vendor step indicator */}
                            <div className={`relative flex-shrink-0 w-full flex justify-center z-10 ${unfoldClass}`}>
                              {vendorProgress.status === "completed" ? (
                                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] shadow-md flex items-center justify-center border-2 border-white">
                                  <svg
                                    className="h-3 w-3 text-white"
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
                              ) : vendorProgress.status === "active" ? (
                                <div className="h-5 w-5 rounded-full border-2 border-[#8B7355] border-t-transparent animate-spin bg-white" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-[#8B7355]/40 bg-white" />
                              )}
                            </div>

                            {/* Vendor content */}
                            <div className={`w-full relative z-20 flex flex-col items-center ${unfoldClass}`}>
                              <h4 className="text-sm font-medium text-[#5C4A3A] mb-2 text-center">
                                {vendorProgress.vendorName}
                              </h4>
                              {vendorProgress.output ? (
                                <div className={`space-y-2 ${vendorProgress.status === "active" ? "unfolding-delay" : ""}`}>
                                  {typeof vendorProgress.output === 'string' ? (
                                    <OutputCards
                                      output={vendorProgress.output}
                                      stepNumber={step.step}
                                      contextVendorName={vendorProgress.vendorName}
                                    />
                                  ) : (
                                    <div className="bg-white backdrop-blur-xl rounded-2xl px-4 py-3 border border-white shadow-md">
                                      {vendorProgress.output}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-white backdrop-blur-xl rounded-2xl px-4 py-3 border border-white shadow-md">
                                  <p className="text-xs text-[#8B7355] leading-relaxed text-center">
                                    {step.message}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* BOTTOM CONNECTORS (Merge Logic) */}
                            {nextStep && (
                              <>
                                {/* Vertical Stub Down */}
                                <div
                                  className={`${vertLineClass} w-0.5`}
                                  style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bottom: '-24px',
                                    height: '24px'
                                  }}
                                />

                                {!nextIsParallel && (
                                  /* Merge Phase: Connect horizontal lines similar to branching */
                                  <>
                                    {/* Line Left */}
                                    <div
                                      className={`${horizLineClass} h-0.5`}
                                      style={{
                                        right: '50%',
                                        bottom: '-24px',
                                        width: isFirst ? 'calc(50% + 80px)' : 'calc(50% + 20px)'
                                      }}
                                    />

                                    {/* Line Right */}
                                    {!isLast && (
                                      <div
                                        className={`${horizLineClass} h-0.5`}
                                        style={{
                                          left: '50%',
                                          bottom: '-24px',
                                          width: 'calc(50% + 20px)'
                                        }}
                                      />
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Single line step (non-parallel)
              return (
                <div
                  key={step.step}
                  className={`flex items-start gap-4 relative ${step.status === "active" ? "unfolding" : ""
                    }`}
                >
                  {/* Step indicator - positioned on main line */}
                  <div className="relative flex-shrink-0 mt-1 z-10" style={{ marginLeft: '-24px' }}>
                    {step.status === "completed" ? (
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] shadow-md flex items-center justify-center border-2 border-white">
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
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-[#8B7355] border-t-transparent animate-spin bg-white" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1">
                    <h3
                      className={`text-base font-semibold mb-3 ${step.status === "active"
                        ? "text-[#8B7355]"
                        : "text-[#5C4A3A]"
                        }`}
                    >
                      {step.title}
                    </h3>
                    {step.output ? (
                      <div className={`space-y-3 ${step.status === "active" ? "unfolding-delay" : ""}`}>
                        {typeof step.output === 'string' ? (
                          <OutputCards output={step.output} stepNumber={step.step} />
                        ) : (
                          <div className="bg-white/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/40 shadow-md">
                            {step.output}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/40 shadow-md">
                        <p className="text-sm text-[#6B5B4F] leading-relaxed">
                          {step.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
        }
      </div>
    </div>
  );
}
