interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-3xl bg-gradient-to-br from-white/60 via-[#FAF8F3]/50 to-white/60 backdrop-blur-2xl border border-white/40 p-6 shadow-2xl ${className}`}
    >
      {title && (
        <h2 className="text-base font-semibold text-[#5C4A3A] mb-4 drop-shadow-sm">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
