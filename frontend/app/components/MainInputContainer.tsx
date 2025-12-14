"use client";

import { useRef } from "react";
import { useButton } from "@react-aria/button";

interface MainInputContainerProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSearchClick?: () => void;
  onSendClick: () => void;
  isRecording: boolean;
  onFileAttach: (files: File[]) => void;
  attachedFiles: File[];
  onRemoveFile: (index: number) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isProcessing?: boolean;
}

export default function MainInputContainer({
  inputValue,
  onInputChange,
  onSearchClick,
  onSendClick,
  isRecording,
  onFileAttach,
  attachedFiles,
  onRemoveFile,
  onStartRecording,
  onStopRecording,
  isProcessing = false,
}: MainInputContainerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full max-w-4xl relative">
      <div className="bg-gradient-to-br from-white/60 via-[#FAF0E6]/50 to-white/60 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/40 transition-all duration-300 relative overflow-hidden">
        {/* Text Input Area */}
        <div className="mb-4 relative">
          <label htmlFor="ask-input" className="sr-only">
            Ask anything
          </label>
          <textarea
            id="ask-input"
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask anything..."
            rows={4}
            className="w-full px-0 py-2 text-xl bg-transparent text-[#5C4A3A] placeholder-[#8B7355]/70 focus:outline-none resize-none"
            style={{ minHeight: "120px" }}
            aria-label="Ask anything"
          />
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-md rounded-2xl border border-white/30 shadow-md"
                >
                  <svg
                    className="h-4 w-4 text-[#8B7355]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm text-[#6B5B4F] truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="ml-1 text-[#8B7355] hover:text-[#5C4A3A] transition-colors"
                    aria-label="Remove file"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-end pt-4 border-t border-white/30">
          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSendClick}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] hover:from-[#6B5B4F] hover:to-[#5C4A3A] text-white font-semibold text-base transition-all flex items-center justify-center shadow-xl hover:shadow-2xl backdrop-blur-md"
              aria-label={isProcessing ? "Processing..." : "Go!"}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span>Go!</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
