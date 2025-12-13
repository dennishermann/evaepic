"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since analytics is now combined with dashboard
    router.replace("/dashboard");
  }, [router]);

  return null;
}

