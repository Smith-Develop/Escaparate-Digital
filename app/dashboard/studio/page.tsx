"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { StudioView } from "@/components/studio/StudioView";
import { useEspejo } from "@/lib/local/espejo";

/**
 * El estudio llega con `?look=<id>` desde el lookbook.
 *
 * Antes ese parámetro lo leía el servidor. Al pasar a cliente hay que usar
 * `useSearchParams`, y Next exige envolverlo en `<Suspense>` para poder
 * pregenerar la página: sin eso, la compilación falla.
 */
export default function StudioPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <Estudio />
    </Suspense>
  );
}

function Cargando() {
  return (
    <div className="grid flex-1 place-items-center">
      <span
        aria-label="Cargando"
        className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
      />
    </div>
  );
}

function Estudio() {
  const lookId = useSearchParams().get("look");
  const items = useEspejo((s) => s.items);
  const looks = useEspejo((s) => s.looks);
  const avatar = useEspejo((s) => s.avatar);

  if (!avatar) return <Cargando />;

  return (
    <>
      <Titulo>Estudio</Titulo>
      <Header title="Estudio" subtitle="Combina tus prendas" />
      <StudioView avatar={avatar} items={items} looks={looks} initialLookId={lookId} />
    </>
  );
}
