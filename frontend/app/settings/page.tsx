"use client";

import { useState } from "react";
import Card from "../components/Card";
import { useButton } from "@react-aria/button";
import { useRef } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
    currency: "USD",
    timezone: "UTC",
  });

  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: saveButtonProps } = useButton(
    {
      onPress: () => {
        // Handle save
        console.log("Settings saved", { notifications, preferences });
      },
      "aria-label": "Save settings",
    },
    saveButtonRef
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          {...saveButtonProps}
          ref={saveButtonRef}
          className="px-4 py-2 bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] text-white rounded-2xl hover:from-[#6B5B4F] hover:to-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:ring-offset-2 transition-all text-sm font-medium shadow-xl hover:shadow-2xl backdrop-blur-md"
        >
          Save Changes
        </button>
      </div>

      {/* Profile Settings */}
      <Card title="Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="John Doe"
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="john.doe@evaepic.com"
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Job Title
            </label>
            <input
              type="text"
              defaultValue="Procurement Manager"
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card title="Notifications">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Email Notifications
              </div>
              <div className="text-sm text-[#8B7355]">
                Receive email updates about your orders and quotes
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) =>
                  setNotifications({ ...notifications, email: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/60 backdrop-blur-md peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B7355]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] shadow-md"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Push Notifications
              </div>
              <div className="text-sm text-[#8B7355]">
                Receive browser push notifications
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) =>
                  setNotifications({ ...notifications, push: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/60 backdrop-blur-md peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B7355]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] shadow-md"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                SMS Notifications
              </div>
              <div className="text-sm text-[#8B7355]">
                Receive SMS alerts for critical updates
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={(e) =>
                  setNotifications({ ...notifications, sms: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/60 backdrop-blur-md peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B7355]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] shadow-md"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card title="Preferences">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Theme
            </label>
            <select
              value={preferences.theme}
              onChange={(e) =>
                setPreferences({ ...preferences, theme: e.target.value })
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Currency
            </label>
            <select
              value={preferences.currency}
              onChange={(e) =>
                setPreferences({ ...preferences, currency: e.target.value })
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Timezone
            </label>
            <select
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences({ ...preferences, timezone: e.target.value })
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card title="Security">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Two-Factor Authentication
              </div>
              <div className="text-sm text-[#8B7355]">
                Add an extra layer of security to your account
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Change Password
              </div>
              <div className="text-sm text-[#8B7355]">
                Update your account password
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
              Change
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
