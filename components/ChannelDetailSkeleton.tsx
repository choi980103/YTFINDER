export default function ChannelDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <div className="h-4 w-16 rounded bg-white/10 skeleton-pulse" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Profile skeleton */}
        <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="h-20 w-20 rounded-full bg-white/10 skeleton-pulse" />
          <div className="min-w-0 flex-1">
            <div className="h-7 w-48 rounded bg-white/10 skeleton-pulse" />
            <div className="mt-2 h-4 w-72 rounded bg-white/[0.07] skeleton-pulse" />
            <div className="mt-2 h-3 w-40 rounded bg-white/[0.07] skeleton-pulse" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-white/10 skeleton-pulse" />
        </div>

        {/* Score hero skeleton */}
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/10 skeleton-pulse" />
              <div>
                <div className="h-5 w-24 rounded bg-white/10 skeleton-pulse" />
                <div className="mt-2 h-4 w-32 rounded bg-white/[0.07] skeleton-pulse" />
              </div>
            </div>
            <div className="flex flex-1 items-center gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-12 rounded bg-white/[0.07] skeleton-pulse" />
                  <div className="mt-1 h-4 w-16 rounded bg-white/10 skeleton-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="h-3 w-14 rounded bg-white/[0.07] skeleton-pulse" />
              <div className="mt-2 h-7 w-20 rounded bg-white/10 skeleton-pulse" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="h-4 w-32 rounded bg-white/10 skeleton-pulse" />
          <div className="mt-4 h-[180px] w-full rounded-lg bg-white/[0.05] skeleton-pulse" />
        </div>

        {/* Videos skeleton */}
        <div className="mb-8">
          <div className="mb-4 h-5 w-24 rounded bg-white/10 skeleton-pulse" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"
              >
                <div className="h-20 w-32 shrink-0 rounded-lg bg-white/10 skeleton-pulse sm:h-24 sm:w-36" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-full rounded bg-white/10 skeleton-pulse" />
                  <div className="mt-1 h-4 w-3/4 rounded bg-white/[0.07] skeleton-pulse" />
                  <div className="mt-3 h-3 w-32 rounded bg-white/[0.07] skeleton-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
