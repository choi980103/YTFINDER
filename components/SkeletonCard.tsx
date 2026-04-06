"use client";

export function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      {/* Avatar + Name */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-white/10 skeleton-pulse" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-28 rounded bg-white/10 skeleton-pulse" />
          <div className="mt-1.5 h-3 w-40 rounded bg-white/[0.07] skeleton-pulse" />
        </div>
      </div>

      {/* Ratio box */}
      <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="h-3 w-16 rounded bg-white/[0.07] skeleton-pulse" />
            <div className="h-8 w-24 rounded bg-white/10 skeleton-pulse" />
            <div className="h-4 w-16 rounded-full bg-white/[0.07] skeleton-pulse" />
          </div>
          <div className="h-10 w-16 rounded bg-white/[0.07] skeleton-pulse" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg bg-white/[0.04] p-2.5">
            <div className="h-2.5 w-10 rounded bg-white/[0.07] skeleton-pulse" />
            <div className="mt-2 h-4 w-14 rounded bg-white/10 skeleton-pulse" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="h-5 w-12 rounded-md bg-white/[0.07] skeleton-pulse" />
        <div className="h-4 w-20 rounded bg-white/[0.07] skeleton-pulse" />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 sm:gap-4">
      <div className="h-4 w-6 rounded bg-white/10 skeleton-pulse" />
      <div className="h-9 w-9 rounded-full bg-white/10 skeleton-pulse" />
      <div className="h-9 w-9 rounded-full bg-white/10 skeleton-pulse" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-32 rounded bg-white/10 skeleton-pulse" />
        <div className="mt-1 hidden h-3 w-48 rounded bg-white/[0.07] skeleton-pulse sm:block" />
      </div>
      <div className="hidden sm:flex items-center gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-14">
            <div className="h-2.5 w-10 rounded bg-white/[0.07] skeleton-pulse" />
            <div className="mt-1 h-4 w-12 rounded bg-white/10 skeleton-pulse" />
          </div>
        ))}
      </div>
      <div className="h-4 w-10 rounded bg-white/[0.07] skeleton-pulse sm:hidden" />
    </div>
  );
}

export function SkeletonGrid({ mode = "grid" }: { mode?: "grid" | "list" }) {
  if (mode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ animationDelay: `${i * 30}ms` }} className="card-animate">
            <SkeletonListItem />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 60}ms` }} className="card-animate">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
