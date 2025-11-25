import { Skeleton } from "@/components/ui/skeleton";

export default function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border border-gray-300">
        <div className="flex justify-between">
          <div className="m-4 w-72">
            <Skeleton className="h-8" />
          </div>
          <div className="m-4 w-16">
            <Skeleton className="h-8" />
          </div>
        </div>
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              {/* Skeleton de las cabeceras de la tabla */}
              <th className="p-4 text-left">
                <Skeleton className="w-22 h-8" />
              </th>
              <th className="p-4 text-left">
                <Skeleton className="h-8 w-32" />
              </th>
              <th className="p-4 text-left">
                <Skeleton className="h-8 w-32" />
              </th>
              <th className="p-4 text-left">
                <Skeleton className="h-8 w-32" />
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Skeleton de las filas */}
            {[...Array(3)].map((_, index) => (
              <tr key={index}>
                <td className="p-4">
                  <Skeleton className="w-22 h-8" />
                </td>
                <td className="p-4">
                  <Skeleton className="w-42 h-8" />
                </td>
                <td className="p-4">
                  <Skeleton className="w-42 h-8" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-8 w-32" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
