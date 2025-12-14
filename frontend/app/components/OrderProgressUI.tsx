"use client";

import { useState, useEffect } from "react";
import { OrderProgressStep } from "../types/order";

interface OrderProgressUIProps {
  progress: OrderProgressStep[];
}

// Helper component to render output as cards
function OutputCards({ output, stepNumber }: { output: string; stepNumber: number }) {
  const lines = output.split('\n').filter(line => line.trim());

  // Generic card renderer for bullet points
  const cards: Array<{ title: string; subtitle?: string }> = [];

  lines.forEach(line => {
    if (line.trim().startsWith('•')) {
      const cleanLine = line.trim().substring(1).trim();
      // Check if line has a value split like "Name: Value"
      if (cleanLine.includes(':')) {
        const [title, val] = cleanLine.split(/:(.+)/);
        cards.push({ title: title.trim(), subtitle: val.trim() });
      } else {
        cards.push({ title: cleanLine });
      }
    }
  });

  if (cards.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-[#5C4A3A] text-sm">{card.title}</h4>
            {card.subtitle && (
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
    <div className="w-full max-w-4xl mb-6">
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
          <div className="space-y-6">
            {visibleSteps.map((step, index) => (
              <div
                key={step.step}
                className={`flex items-start gap-4 relative ${step.status === "active" ? "unfolding" : ""
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
