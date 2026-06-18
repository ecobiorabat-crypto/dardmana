export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="dd-shimmer h-9 w-64" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dd-shimmer h-28 w-full" aria-hidden="true" />
        ))}
      </div>
      <div className="dd-shimmer h-80 w-full" aria-hidden="true" />
    </div>
  )
}
