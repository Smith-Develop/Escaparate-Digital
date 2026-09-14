"use client";

import { Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { AddItemFlow } from "@/components/closet/AddItemFlow";
import { useEspejo } from "@/lib/local/espejo";

export default function NewItemPage() {
  const avatar = useEspejo((s) => s.avatar);
  const tags = useEspejo((s) => s.tags);

  return (
    <>
      <Titulo>Añadir prenda</Titulo>
      <Header
        title="Nueva prenda"
        subtitle="Fotografía, recorte y catalogación"
        back="/dashboard/closet"
      />
      {avatar && <AddItemFlow avatar={avatar} tags={tags} />}
    </>
  );
}
