interface StatusChartProps {
  data: Record<string, number>;
  colors?: Record<string, string>;
}

export default function StatusChart({ data, colors }: StatusChartProps) {
  const defaultColors: Record<string, string> = {
    active: "#3B82F6",
    pending: "#F59E0B",
    completed: "#10B981",
    cancelled: "#EF4444",
    ...colors,
  };

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  const entries = Object.entries(data).filter(([_, value]) => value > 0);

  if (total === 0) {
    return (
      <div className="text-center py-8 text-[#8B7355]">
        No data available for chart
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {entries.map(([key, value]) => {
          const percentage = (value / total) * 100;
          const color = defaultColors[key] || "#6B7280";
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5C4A3A] capitalize">
                  {key}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {value} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-white/40 backdrop-blur-sm rounded-full h-2.5 shadow-inner">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
