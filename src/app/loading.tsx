import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="border-b border-dark-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-96 max-w-xl hidden lg:block" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="mt-4 h-6 w-1/2" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
