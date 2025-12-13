"use client";

import { useState, useEffect } from "react";
import { OrderProgressStep } from "../types/order";

interface OrderProgressUIProps {
  progress: OrderProgressStep[];
}

// Helper component to render output as cards
function OutputCards({ output, stepNumber }: { output: string; stepNumber: number }) {
  const lines = output.split('\n').filter(line => line.trim());
  
  // Parse different step outputs into cards
  if (stepNumber === 1) {
    // Order items - parse bullet points with details
    const items: Array<{ name: string; details: string[] }> = [];
    let currentItem: { name: string; details: string[] } | null = null;
    
    lines.forEach(line => {
      if (line.trim().startsWith('•')) {
        if (currentItem) items.push(currentItem);
        const match = line.match(/•\s*(\d+)x\s*(.+)/);
        if (match) {
          currentItem = { name: `${match[1]}x ${match[2]}`, details: [] };
        }
      } else if (currentItem && line.trim()) {
        currentItem.details.push(line.trim());
      }
    });
    if (currentItem) items.push(currentItem);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-md">
            <h4 className="font-semibold text-[#5C4A3A] mb-2">{item.name}</h4>
            <div className="space-y-1">
              {item.details.map((detail, i) => (
                <p key={i} className="text-xs text-[#8B7355]">{detail}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (stepNumber === 2 || stepNumber === 3) {
    // Vendors - parse vendor list
    const vendorLines = lines.filter(line => line.includes('vendors') || line.includes('Vendor') || line.includes('all_vendors') || line.includes('relevant_vendors'));
    if (vendorLines.length > 0) {
      return (
        <div className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-md">
          <p className="text-sm font-medium text-[#5C4A3A]">{vendorLines[0]}</p>
        </div>
      );
    }
  }
  
  if (stepNumber === 4) {
    // Strategies
    const strategyLines = lines.filter(line => line.includes('strategies') || line.includes('vendor_strategies'));
    if (strategyLines.length > 0) {
      return (
        <div className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-md">
          <p className="text-sm font-medium text-[#5C4A3A]">{strategyLines[0]}</p>
        </div>
      );
    }
  }
  
  if (stepNumber === 5) {
    // Negotiation/Quotes
    const quoteLines = lines.filter(line => line.includes('Negotiated') || line.includes('leaderboard') || line.includes('quotes'));
    if (quoteLines.length > 0) {
      return (
        <div className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-md">
          <p className="text-sm font-medium text-[#5C4A3A]">{quoteLines[0]}</p>
        </div>
      );
    }
  }
  
  if (stepNumber === 6) {
    // Market analysis - parse into multiple cards
    const analysisCards: Array<{ title: string; value: string }> = [];
    
    lines.forEach(line => {
      if (line.trim().startsWith('•')) {
        // Parse bullet points
        const cleanLine = line.replace('•', '').trim();
        if (cleanLine.includes('Best Price:')) {
          const match = cleanLine.match(/Best Price:\s*(.+)/);
          if (match) analysisCards.push({ title: 'Best Price', value: match[1].trim() });
        } else if (cleanLine.includes('Median Price:')) {
          const match = cleanLine.match(/Median Price:\s*(.+)/);
          if (match) analysisCards.push({ title: 'Median Price', value: match[1].trim() });
        } else if (cleanLine.includes('Vendor Rankings:')) {
          const match = cleanLine.match(/Vendor Rankings:\s*(.+)/);
          if (match) {
            analysisCards.push({ title: 'Vendor Rankings', value: match[1].trim() });
          } else {
            analysisCards.push({ title: 'Vendor Rankings', value: 'Generated' });
          }
        } else if (cleanLine.includes('Final Comparison Report:')) {
          const match = cleanLine.match(/Final Comparison Report:\s*(.+)/);
          if (match) analysisCards.push({ title: 'Final Report', value: match[1].trim() });
        }
      } else if (line.includes('Best Price:')) {
        const match = line.match(/Best Price:\s*(.+)/);
        if (match) analysisCards.push({ title: 'Best Price', value: match[1].trim() });
      } else if (line.includes('Median Price:')) {
        const match = line.match(/Median Price:\s*(.+)/);
        if (match) analysisCards.push({ title: 'Median Price', value: match[1].trim() });
      } else if (line.includes('Vendor Rankings:')) {
        const match = line.match(/Vendor Rankings:\s*(.+)/);
        if (match) {
          analysisCards.push({ title: 'Vendor Rankings', value: match[1].trim() });
        } else {
          analysisCards.push({ title: 'Vendor Rankings', value: 'Generated' });
        }
      } else if (line.includes('Final Comparison Report:')) {
        const match = line.match(/Final Comparison Report:\s*(.+)/);
        if (match) analysisCards.push({ title: 'Final Report', value: match[1].trim() });
      }
    });
    
    if (analysisCards.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysisCards.map((card, idx) => (
            <div key={idx} className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-md">
              <h4 className="text-xs font-medium text-[#8B7355] mb-1">{card.title}</h4>
              <p className="text-sm font-semibold text-[#5C4A3A]">{card.value}</p>
            </div>
          ))}
        </div>
      );
    }
  }
  
  // Default: show as single card with formatted text
  return (
    <div className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-md">
      <div className="text-sm text-[#6B5B4F] leading-relaxed whitespace-pre-line">
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
    <div className="w-full max-w-4xl mb-6">
      <style dangerouslySetInnerHTML={{__html: `
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
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
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
          <div className="space-y-6">
            {visibleSteps.map((step, index) => (
            <div
              key={step.step}
              className={`flex items-start gap-4 relative ${
                step.status === "active" ? "unfolding" : ""
              }`}
            >
              {/* Vertical line connector */}
              {index > 0 && (
                <div className="absolute left-3 w-0.5 h-6 -top-6 bg-[#DEB887]" />
              )}

              {/* Step indicator */}
              <div className="relative flex-shrink-0 mt-1">
                {step.status === "completed" ? (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] shadow-md flex items-center justify-center">
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
                  <div className="h-6 w-6 rounded-full border-2 border-[#8B7355] border-t-transparent animate-spin" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1">
                <h3
                  className={`text-base font-semibold mb-3 ${
                    step.status === "active"
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
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
