interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface ProductSearchViewProps {
  searchResults: Product[];
  onAddProduct: (product: Product) => void;
}

export default function ProductSearchView({
  searchResults,
  onAddProduct,
}: ProductSearchViewProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm font-medium text-[#5C4A3A]">
              No products found
            </p>
            <p className="text-xs text-[#8B7355] mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-gradient-to-br from-white/60 via-[#FAF8F3]/50 to-white/60 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/40">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/30 bg-white/50 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8B7355]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEB887]/20">
                  {searchResults.map((product) => (
                    <tr key={product.id} className="hover:bg-white/40 backdrop-blur-sm transition-all">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#5C4A3A]">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8B7355]">
                        {product.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8B7355]">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => onAddProduct(product)}
                          className="text-[#8B7355] hover:text-[#6B5B4F] font-medium transition-colors"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
