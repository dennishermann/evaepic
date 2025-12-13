import PlatformLayout from "../components/PlatformLayout";

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformLayout>{children}</PlatformLayout>;
}

