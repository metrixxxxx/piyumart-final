import { Skeleton } from "@/components/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="w-full max-w-md">
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="rounded-2xl overflow-hidden border border-gray-100">
          <Skeleton className="h-56 w-full rounded-none" />
          <div className="p-6 flex flex-col gap-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-12 rounded-xl mt-2" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}