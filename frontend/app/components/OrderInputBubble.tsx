interface OrderInputBubbleProps {
  text: string;
}

export default function OrderInputBubble({ text }: OrderInputBubbleProps) {
  return (
    <div className="w-full max-w-4xl mb-6">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl px-4 py-3 bg-white/60 backdrop-blur-xl text-[#5C4A3A] border border-white/40 shadow-lg">
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </div>
  );
}
