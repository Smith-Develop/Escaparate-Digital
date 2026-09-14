"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSesion } from "@/components/SesionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { estado } = useSesion();

  useEffect(() => {
    if (estado === "dentro") router.replace("/dashboard");
  }, [estado, router]);

  return <main className="flex flex-1 flex-col justify-center px-6 pb-safe pt-safe">{children}</main>;
}
