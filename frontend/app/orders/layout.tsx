import { ReactNode } from "react";
import PlatformLayout from "../components/PlatformLayout";

export default function OrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlatformLayout>{children}</PlatformLayout>;
}

