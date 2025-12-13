import PlatformLayout from "../components/PlatformLayout";

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformLayout>{children}</PlatformLayout>;
}

