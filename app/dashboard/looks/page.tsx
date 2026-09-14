"use client";

import { Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { LooksView } from "@/components/looks/LooksView";
import { useEspejo } from "@/lib/local/espejo";

export default function LooksPage() {
  const looks = useEspejo((s) => s.looks);

  return (
    <>
      <Titulo>Looks</Titulo>
      <Header title="Lookbook" subtitle="Tus conjuntos guardados y planificados" />
      <LooksView looks={looks} />
    </>
  );
}
