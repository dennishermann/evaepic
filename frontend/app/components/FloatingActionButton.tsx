"use client";

import { useRef } from "react";
import { useButton } from "@react-aria/button";

interface FloatingActionButtonProps {
  onPress: () => void;
  "aria-label": string;
  icon: React.ReactNode;
  className?: string;
}

export default function FloatingActionButton({
  onPress,
  "aria-label": ariaLabel,
  icon,
  className = "",
}: FloatingActionButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(
    {
      onPress,
      "aria-label": ariaLabel,
    },
    buttonRef
  );

  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      className={`fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] hover:from-[#6B5B4F] hover:to-[#5C4A3A] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#8B7355]/30 z-40 backdrop-blur-sm ${className}`}
    >
      {icon}
    </button>
  );
}
