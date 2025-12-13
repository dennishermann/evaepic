import PlatformLayout from "../components/PlatformLayout";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformLayout>{children}</PlatformLayout>;
}

