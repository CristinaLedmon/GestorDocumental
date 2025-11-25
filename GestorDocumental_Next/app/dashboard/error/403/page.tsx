import { Button } from "@/components/ui/button";
import { generateMeta } from "@/lib/utils";
import Link from "next/link";

export async function generateMetadata() {
  return generateMeta({
    title: "403 Página",
    description: "Página de acceso no permitido 403.",
    canonical: "/pages/error/403"
  });
}

export default function Error403() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <figure className="m-auto w-40 lg:w-72">
          <img src={`${process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL}/images/403.svg`} className="w-full" />
        </figure>
        <div className="mt-8 space-y-4 lg:mt-14">
          <h1 className="text-3xl font-bold tracking-tight lg:text-5xl">No autorizado</h1>
          <p className="text-muted-foreground">
            Usted no dispone de permisos para acceder a esta página.
          </p>
        </div>
        <div className="mt-8">
          <Button size="lg" asChild>
            <Link href="/dashboard/home">Volver a inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
