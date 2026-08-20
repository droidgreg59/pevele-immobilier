/** Format exact de ListingCard — placeholder pendant le chargement d'un lot. */
export default function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="animate-shimmer aspect-[4/3]" />
      <div className="flex flex-col gap-2.5 px-4 pb-3.5 pt-3">
        <div className="animate-shimmer h-5 w-2/5 rounded-md" />
        <div className="animate-shimmer h-3.5 w-4/5 rounded-md" />
        <div className="animate-shimmer h-3 w-3/5 rounded-md" />
        <div className="animate-shimmer mt-2 h-4 w-1/3 rounded-md" />
      </div>
    </div>
  );
}
