import { Skeleton } from "@/components/ui/skeleton";

export default function FormPartnerSelectMultiSkeleton() {
  return (
    <div className="grid grid-cols-1 items-baseline gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <div className="col-span-4">
        <Skeleton className="mb-2 h-6 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
