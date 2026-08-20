export default function Loading() {
  return (
    <div className="max-w-[1200px] px-9 pt-8">
      <div className="animate-shimmer h-5 w-48 rounded-lg" />
      <div className="mt-5 grid grid-cols-1 gap-9 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="animate-shimmer h-[360px] rounded-2xl" />
          <div className="animate-shimmer h-24 rounded-2xl" />
          <div className="animate-shimmer h-40 rounded-2xl" />
        </div>
        <div className="animate-shimmer h-[420px] rounded-2xl" />
      </div>
    </div>
  );
}
