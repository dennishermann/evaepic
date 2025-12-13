"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useButton } from "@react-aria/button";
import { useRef } from "react";

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Orders",
    href: "/orders",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Quotes",
    href: "/quotes",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: "Negotiations",
    href: "/negotiations",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  
  const { buttonProps } = useButton(
    {
      onPress: onToggle,
      "aria-label": isCollapsed ? "Expand sidebar" : "Collapse sidebar",
      "aria-expanded": !isCollapsed,
    },
    toggleButtonRef
  );

  // User data - in a real app, this would come from auth context
  const userName = "John Doe";
  const userEmail = "john.doe@evaepic.com";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`
        flex h-screen flex-col bg-slate-800 dark:bg-slate-900 transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Logo at Top - Centered */}
      <div className="flex h-20 items-center justify-between border-b border-slate-700 px-4">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <h1 className="text-lg font-semibold text-white">E</h1>
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-white">EvaEpic</h1>
        )}
        <button
          {...buttonProps}
          ref={toggleButtonRef}
          className="ml-auto rounded-md p-1.5 text-yellow-400 hover:bg-slate-700 hover:text-yellow-300 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          {isCollapsed ? (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation Buttons - Centered in Middle */}
      <nav className={`flex-1 flex flex-col ${isCollapsed ? "items-center justify-center" : "items-start"} gap-4 py-8 ${isCollapsed ? "px-0" : "px-4"}`}>
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const hasNotification = item.name === "Orders"; // Add notification dot to Orders (optional)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group relative flex items-center ${isCollapsed ? "justify-center w-12 h-12" : "justify-start w-full px-3 h-12"} rounded-lg transition-all
                ${
                  isActive
                    ? "bg-slate-700 dark:bg-slate-600"
                    : "hover:bg-slate-700/50 dark:hover:bg-slate-700/50"
                }
              `}
              title={isCollapsed ? item.name : undefined}
            >
              <span
                className={`
                  transition-colors relative flex-shrink-0
                  ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-300"
                  }
                `}
              >
                {item.icon}
                {hasNotification && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-yellow-400 rounded-full border-2 border-slate-800" />
                )}
              </span>
              {!isCollapsed && (
                <span className={`ml-3 text-sm font-medium ${isActive ? "text-white" : "text-gray-300"}`}>
                  {item.name}
                </span>
              )}
              {isActive && isCollapsed && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-l-full" />
              )}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Settings and User Info */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        {/* Settings Button */}
        <Link
          href="/settings"
          className={`
            flex items-center ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "justify-start w-full px-3 h-12"} rounded-lg transition-all
            ${
              pathname === "/settings"
                ? "bg-slate-700 dark:bg-slate-600"
                : "hover:bg-slate-700/50 dark:hover:bg-slate-700/50"
            }
          `}
          title={isCollapsed ? "Settings" : undefined}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              pathname === "/settings"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {!isCollapsed && (
            <span className={`ml-3 text-sm font-medium ${pathname === "/settings" ? "text-white" : "text-gray-300"}`}>
              Settings
            </span>
          )}
        </Link>

        {/* Logout Button */}
        <button
          className={`flex items-center ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "justify-start w-full px-3 h-12"} rounded-lg transition-all hover:bg-slate-700/50 dark:hover:bg-slate-700/50 text-gray-400 hover:text-gray-300`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium text-gray-300">Logout</span>
          )}
        </button>

        {/* User Info */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-slate-700">
            <div className="text-center">
              <div className="font-medium text-white text-sm truncate px-2">
                {userName}
              </div>
              <div className="text-xs text-gray-400 truncate px-2 mt-1">
                {userEmail}
              </div>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="pt-4 border-t border-slate-700 flex justify-center">
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium text-sm">
              {userInitials}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

