"use client";

import Link from "next/link";
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
        action={
          <Link
            href="/dashboard/closet/inversion"
            className="edge flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs text-ink"
          >
            <span aria-hidden>🧾</span> Inversión
          </Link>
        }
      />
      {avatar && <ClosetView items={items} avatar={avatar} tags={tags} />}
    </>
  );
}
