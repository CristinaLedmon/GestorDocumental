import { type ClassValue, clsx } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";
import * as d3 from "d3-color";
import { Chart } from "@/types/chart";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAvatarFallback(string: string) {
  const names = string.split(" ").filter((name: string) => name);
  const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

  return mapped.join("");
}

export function generateMeta({
  title,
  description,
  canonical
}: {
  title: string;
  description: string;
  canonical: string;
}):void {
  // return {
  //   title: `${title} - Shadcn UI Kit`,
  //   description: description,
  //   metadataBase: new URL(`${process.env.NEXT_PUBLIC_BASE_URL}`),
  //   alternates: {
  //     canonical: `/dashboard${canonical}`
  //   },
  //   openGraph: {
  //     images: [`${process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL}/seo.jpg`]
  //   }
  // };
  return;
}


// función que devuelve la unidad según el tipo
export function getUnit(type: Chart): string {
  switch (type) {
    case "temperature":
      return "°C";
    case "salinity":
      return "PSU";
    case "conductivity":
      return "mS/cm";
    case "density_anomaly":
      return "kg/m³";
    case "pressure":
      return "dbar";
    default:
      const _exhaustiveCheck: never = type;
      return _exhaustiveCheck;
  }
}


export function getHSLValue(hex: string): string {
  return d3.color(hex)!.formatHsl().slice(4, -1).replaceAll(",", "");
}
