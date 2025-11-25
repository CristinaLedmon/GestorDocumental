import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "500 Página",
    description: "Página de error 500 server.",
    canonical: "/pages/error/500"
  });
}

export default function Error404() {
  return (
    <div className="grid h-screen items-center bg-background pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">500</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          Error en servidor
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Estamos teniendo problemas de conexión con el servidor o la web.
        </p>
      </div>

      <div className="col-span-1 hidden lg:block">
        <img
          src={`${process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL}/images/500.svg`}
          alt="Login visual"
          className="object-contain"
        />
      </div>
    </div>
  );
}
