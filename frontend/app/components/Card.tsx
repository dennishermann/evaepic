interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 p-6 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
