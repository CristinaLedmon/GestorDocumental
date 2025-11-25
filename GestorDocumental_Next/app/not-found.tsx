import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid h-screen items-center bg-background pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          Página no encontrada
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Lo siento, no hemos podido encontrar la página solicitada.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-2">
          <Button size="lg" asChild>
            <Link href="/dashboard/home">Volver a inicio</Link>
          </Button>
        </div>
      </div>
      <div className="hidden lg:block">
        <Image
          src={`${process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL}/images/404.svg`}
          width={300}
          height={400}
          className="w-full object-contain lg:max-w-2xl"
          alt="not found image"
        />
      </div>
    </div>
  );
}


