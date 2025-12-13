"use client";

import { useState, useRef, useEffect } from "react";
import { useButton } from "@react-aria/button";
import { useTextField } from "@react-aria/textfield";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your procurement assistant. How can I help you today",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const { inputProps } = useTextField(
    {
      label: "Type your message",
      placeholder: "Type your message...",
      value: inputValue,
      onChange: setInputValue,
      onKeyDown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
    },
    inputRef
  );

  const { buttonProps: closeButtonProps } = useButton(
    {
      onPress: onClose,
      "aria-label": "Close chat",
    },
    closeButtonRef
  );

  const { buttonProps: sendButtonProps } = useButton(
    {
      onPress: handleSend,
      "aria-label": "Send message",
      isDisabled: !inputValue.trim(),
    },
    sendButtonRef
  );

  function handleSend() {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I understand you're asking about: " + inputValue + ". Let me help you with that.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-gradient-to-b from-[#FAF8F3]/90 via-[#F5F5DC]/85 to-[#FAF0E6]/90 backdrop-blur-xl border-l border-[#DEB887]/40 shadow-2xl z-50 flex flex-col transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 bg-white/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] shadow-md flex items-center justify-center">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#5C4A3A]">
              Assistant
            </h3>
            <p className="text-xs text-[#8B7355]">Online</p>
          </div>
        </div>
        <button
          {...closeButtonProps}
          ref={closeButtonRef}
          className="p-2 rounded-2xl text-[#8B7355] hover:text-[#5C4A3A] hover:bg-white/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:ring-offset-2 transition-all"
        >
          <svg
            className="h-5 w-5"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent via-[#FFF8DC]/30 to-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-3xl px-4 py-2 shadow-md ${
                message.sender === "user"
                  ? "bg-[#8B7355] text-white"
                  : "bg-white/60 backdrop-blur-xl text-[#5C4A3A] border border-white/40"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "user"
                  ? "text-[#FAF0E6]"
                  : "text-[#8B7355]"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-[#DEB887]/30 bg-white/30 backdrop-blur-md">
        <div className="relative flex items-center">
          {/* Input Field */}
          <input
            {...inputProps}
            ref={inputRef}
            className="w-full pl-4 pr-20 py-3 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl text-[#5C4A3A] placeholder-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent text-sm"
            placeholder="Send a message or @Assistant"
          />
          
          {/* Send Button */}
          <button
            {...sendButtonProps}
            ref={sendButtonRef}
            className="absolute right-2 h-14 w-14 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] hover:from-[#6B5B4F] hover:to-[#5C4A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:ring-offset-2 text-white font-semibold text-base shadow-lg hover:shadow-xl backdrop-blur-sm"
            aria-label="Go!"
          >
            <span>Go!</span>
          </button>
        </div>
        <p className="text-xs text-[#8B7355] mt-2 px-1">
          Assistant can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
