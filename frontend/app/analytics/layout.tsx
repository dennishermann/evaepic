import PlatformLayout from "../components/PlatformLayout";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformLayout>{children}</PlatformLayout>;
}

