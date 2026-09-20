"use client";

import { BotonCabecera, Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { ClosetView } from "@/components/closet/ClosetView";
import { useEspejo } from "@/lib/local/espejo";

export default function ClosetPage() {
  const items = useEspejo((s) => s.items);
  const tags = useEspejo((s) => s.tags);
  const avatar = useEspejo((s) => s.avatar);

  return (
    <>
      <Titulo>Armario</Titulo>
      <Header
        title="Escaparate"
        subtitle={`${items.length} ${items.length === 1 ? "prenda catalogada" : "prendas catalogadas"}`}
        action={
          <BotonCabecera href="/dashboard/closet/inversion" label="Ver la inversión del armario">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17Z" />
              <path d="M9.5 8.5h5M9.5 12h5" />
            </svg>
          </BotonCabecera>
        }
      />
      {avatar && <ClosetView items={items} avatar={avatar} tags={tags} />}
    </>
  );
}
