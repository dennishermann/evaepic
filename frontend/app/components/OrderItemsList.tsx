import { OrderItem } from "../types/order";

interface OrderItemsListProps {
  orderItems: OrderItem[];
  onRemoveItem: (itemKey: string) => void;
  onUpdateQuantity: (itemKey: string, quantity: number) => void;
  formatCurrency: (amount: number) => string;
}

export default function OrderItemsList({
  orderItems,
  onRemoveItem,
  onUpdateQuantity,
  formatCurrency,
}: OrderItemsListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#5C4A3A] drop-shadow-sm">
          Order Items
        </h3>
        <p className="text-sm text-[#8B7355] mt-0.5">
          {orderItems.length} {orderItems.length === 1 ? "item" : "items"} in order
        </p>
      </div>
      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/40 rounded-3xl bg-white/40 backdrop-blur-xl">
          <svg
            className="h-12 w-12 text-[#8B7355]/60 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <p className="text-sm font-medium text-[#5C4A3A]">
            No items in order yet
          </p>
          <p className="text-xs text-[#8B7355] mt-1">
            Search and add products to get started
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {orderItems.map((item) => (
            <div
              key={item.itemKey}
              className="border border-white/40 rounded-3xl p-4 bg-gradient-to-br from-white/60 via-[#FAF8F3]/50 to-white/60 backdrop-blur-2xl shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#5C4A3A]">
                    {item.name}
                  </h4>
                  {item.vendorName && (
                    <p className="text-xs text-[#8B7355] mt-1">
                      Vendor: {item.vendorName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.itemKey)}
                  className="rounded-2xl p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50/60 backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 shadow-md"
                  aria-label="Remove item"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.itemKey, item.quantity - 1)}
                    className="w-8 h-8 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md flex items-center justify-center hover:bg-white/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 shadow-md"
                    disabled={item.quantity <= 1}
                  >
                    <svg
                      className="h-4 w-4 text-[#8B7355]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <span className="w-12 text-center font-medium text-[#5C4A3A]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.itemKey, item.quantity + 1)}
                    className="w-8 h-8 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md flex items-center justify-center hover:bg-white/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 shadow-md"
                  >
                    <svg
                      className="h-4 w-4 text-[#8B7355]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#5C4A3A]">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
