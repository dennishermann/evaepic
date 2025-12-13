"use client";

import { useState } from "react";

export default function Home() {
  const [apiResponse, setApiResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [name, setName] = useState("World");

  const fetchFromBackend = async (endpoint: string) => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to EvaEpic
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Next.js + FastAPI Full-Stack Application
            </p>
          </div>

          {/* API Test Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Test Backend API
            </h2>
            
            <div className="space-y-4 mb-6">
              <button
                onClick={() => fetchFromBackend("/api/health")}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Health Check"}
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => fetchFromBackend(`/api/hello?name=${encodeURIComponent(name)}`)}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : "Say Hello"}
                </button>
              </div>
            </div>

            {/* Response Display */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {apiResponse && (
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  API Response:
                </p>
                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Frontend
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>✓ Next.js 15 (App Router)</li>
                <li>✓ TypeScript</li>
                <li>✓ Tailwind CSS</li>
                <li>✓ React 19</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Backend
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>✓ FastAPI</li>
                <li>✓ Python 3.12</li>
                <li>✓ UV Package Manager</li>
                <li>✓ CORS Configured</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
