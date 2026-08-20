import SkeletonCard from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="max-w-[1400px] px-9 py-8">
      <div className="animate-shimmer h-9 w-64 rounded-xl" />
      <div className="animate-shimmer mt-5 h-5 w-40 rounded-lg" />
      <div className="mt-6 grid grid-cols-1 gap-6.5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
