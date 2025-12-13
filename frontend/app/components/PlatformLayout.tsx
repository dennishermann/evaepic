"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageTitleMap: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard & Analytics",
  "/orders": "Orders",
  "/quotes": "Quotes",
  "/vendors": "Vendors",
  "/negotiations": "Negotiations",
  "/settings": "Settings",
};

export default function PlatformLayout({
  children,
  isChatOpen = false,
}: {
  children: React.ReactNode;
  isChatOpen?: boolean;
}) {
  const pathname = usePathname();
  const pageTitle = pageTitleMap[pathname] || "";
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      const mobile = width < 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile/tablet
      if (width < 1024) {
        setIsCollapsed(true);
      }
    };

    // Set initial width
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      handleResize();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && !isCollapsed) {
      setIsCollapsed(true);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Overlay for mobile */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`
          relative z-50 transition-transform duration-300 ease-in-out
          ${isMobile && isCollapsed ? "-translate-x-full" : "translate-x-0"}
        `}
      >
        <Sidebar 
          isCollapsed={isMobile ? false : isCollapsed} 
          onToggle={handleToggle} 
        />
      </div>
      
      {/* Main content */}
      <div 
        className="flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300"
        style={{
          marginRight: isChatOpen ? '384px' : '0',
        }}
      >
        <Header onToggle={handleToggle} isCollapsed={isCollapsed} pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto bg-transparent p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

