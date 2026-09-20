"use client";

import { Header } from "@/components/layout/Header";
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
      />
      {avatar && <ClosetView items={items} avatar={avatar} tags={tags} />}
    </>
  );
}
