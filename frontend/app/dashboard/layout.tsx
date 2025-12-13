import PlatformLayout from "../components/PlatformLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformLayout>{children}</PlatformLayout>;
}

