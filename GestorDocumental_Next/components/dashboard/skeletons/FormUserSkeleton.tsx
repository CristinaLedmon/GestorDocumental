import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormUserSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-8 pt-6">
        {/* Skeleton for Name and Surname Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" /> {/* Label Skeleton */}
          <Skeleton className="h-10" /> {/* Input Skeleton */}
          <Skeleton className="h-3 w-48" /> {/* Description Skeleton */}
        </div>
        {/* Skeleton for Email Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label Skeleton */}
          <Skeleton className="h-10" /> {/* Input Skeleton */}
          <Skeleton className="h-3 w-40" /> {/* Description Skeleton */}
        </div>
        {/* Skeleton for Password Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" /> {/* Label Skeleton */}
          <Skeleton className="h-10" /> {/* Input Skeleton */}
          <Skeleton className="h-3 w-44" /> {/* Description Skeleton */}
        </div>
        {/* Skeleton for Password Confirmation Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" /> {/* Label Skeleton */}
          <Skeleton className="h-10" /> {/* Input Skeleton */}
          <Skeleton className="h-3 w-48" /> {/* Description Skeleton */}
        </div>
        {/* Skeleton for Submit Button */}
        <Skeleton className="h-10 w-24" /> {/* Button Skeleton */}
      </CardContent>
    </Card>
  );
}
