"use client";
import Logo from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import fetchModel from "@/lib/fetch-utils";
import { Register } from "@/types/register";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetchModel<Register>("register", {
        method: "POST",
        body: {
          name: name,
          email: email,
          password: password,
          password_confirmation: password_confirmation
        }
      });

      console.log(response);

      if (response.user) {
        router.replace("/dashboard/home");
      }
    } catch (errorResponse) {
      if ((errorResponse as any).data) {
        for (const [field, messages] of Object.entries((errorResponse as any).data.errors)) {
          const fieldMod = field == "password" ? "contraseña" : field;
          toast({
            title: `Error en ${fieldMod}`,
            description: Array.isArray(messages) ? messages.join(", ") : ""
          });
        }
      } else {
        toast({
          title: `Error registro`,
          description: "Se ha producido un error al registrarse. Por favor inténtelo más tarde."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex pb-8 lg:h-screen lg:pb-0">
      <div className="hidden w-1/2 bg-gray-100 lg:block">
        <img
          src={`${process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL}/images/cover.png`}
          alt="Login visual"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md space-y-8 px-4">
          <div className="text-center">
            <Logo className="flex justify-center" width="w-72" />
            <p className="mt-2 text-sm text-gray-600">Creación de nueva cuenta para acceso.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="sr-only">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full"
                  placeholder="Nombre y apellidos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email" className="sr-only">
                  Dirección de correo
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full"
                  placeholder="Dirección de correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password" className="sr-only">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="w-full"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password_confirmation" className="sr-only">
                  Confirmación contraseña
                </Label>
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  required
                  minLength={8}
                  className="w-full"
                  placeholder="Confirmación contraseña"
                  value={password_confirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registrandose..." : "Registrarse"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-muted px-2 text-gray-500">o continuar con</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Button variant="outline" className="w-full">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Dispone de una cuenta?{" "}
              <a href="/dashboard/login" className="text-primary hover:underline">
                Iniciar sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
