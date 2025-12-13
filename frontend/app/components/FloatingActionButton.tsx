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
      className={`fixed bottom-6 right-6 h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 z-40 ${className}`}
    >
      {icon}
    </button>
  );
}
