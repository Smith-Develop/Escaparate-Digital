"use client";

import { Foto } from "@/components/ui/Foto";
import { Mannequin } from "@/components/closet/Mannequin";
import type { AvatarParams } from "@/lib/types";

/**
 * Silueta del avatar actual superpuesta al visor de la cámara.
 *
 * Sirve de plantilla: al encuadrar la prenda —o al posar uno mismo— sobre ella,
 * la foto sale ya a la escala y en la posición que espera el probador, y apenas
 * hay que retocar después el alto y el ancho.
 *
 * Va en blanco y translúcida para que se siga viendo bien lo que enfoca la
 * cámara; si se dibujara opaca habría que disparar a ciegas.
 */
export function SiluetaGuia({ avatar }: { avatar: AvatarParams }) {
  if (avatar.photoUrl) {
    return (
      <Foto
        ruta={avatar.photoUrl}
        alt=""
        aria-hidden
        className="size-full object-contain"
        // La foto se aplana a blanco puro: interesa el contorno, no la imagen.
        style={{ filter: "brightness(0) invert(1)" }}
      />
    );
  }

  return <Mannequin avatar={avatar} className="size-full text-white" />;
}
