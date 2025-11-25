"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { MailIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/layout/logo";

const formSchema = z.object({
  email: z.string().email("Por favor introduzca una dirección de correo válida")
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ""
    }
  });

  const { toast } = useToast();

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "Respuesta enviada!"
    });

    return false;
  };

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <Card className="mx-auto w-96">
        <CardHeader>
          <Logo className="flex justify-center" width="w-72" />
          <CardTitle className="pt-3 text-center text-2xl">Recuperar contraseña</CardTitle>
          <CardDescription className="text-center">
            Introduzca su dirección de correo para que podamos indicarle las instrucciones para
            recuperar su contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email" className="sr-only">
                      Dirección de correo
                    </Label>
                    <FormControl>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform opacity-30" />
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          autoComplete="email"
                          className="w-full pl-10"
                          placeholder="Introduzca su dirección de correo"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Enviar instrucciones de recuperación"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Dispone de una cuenta?{" "}
            <a href="/dashboard/login" className="text-primary hover:underline">
              Iniciar sesión
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
