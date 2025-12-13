export interface OrderItem {
  id: number;
  itemKey: string; // Unique key combining product id and vendor id
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description: string;
  vendorId?: number;
  vendorName?: string;
}

export interface OrderProgressStep {
  step: number;
  status: "pending" | "active" | "completed";
  title: string;
  message: string;
}
