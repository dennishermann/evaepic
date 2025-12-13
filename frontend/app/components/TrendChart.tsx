interface TrendData {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendData[];
  title?: string;
  color?: string;
}

export default function TrendChart({
  data,
  title,
  color = "#3B82F6",
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[#8B7355]">
        No data available for chart
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-medium text-[#5C4A3A]">
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5C4A3A]">
                  {item.label}
                </span>
                <span className="font-medium text-[#5C4A3A]">
                  {item.value}
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
