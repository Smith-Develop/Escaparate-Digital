"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { APARECE, escalonado } from "@/lib/animaciones";

type Props = HTMLMotionProps<"div"> & {
  /** Posición en la lista: marca el retardo de entrada. */
  index?: number;
};

/**
 * Envoltorio que hace entrar a su contenido como entran las prendas del
 * armario. Existe para no repetir las mismas tres propiedades en cada sección
 * de cada pantalla, y para que cambiar el gesto de la app sea tocar un sitio.
 */
export function Aparece({ index = 0, ...props }: Props) {
  return <motion.div {...APARECE} transition={escalonado(index)} {...props} />;
}

/** El mismo gesto para un elemento de lista, que no puede ir dentro de un div. */
export function ApareceItem({ index = 0, ...props }: HTMLMotionProps<"li"> & { index?: number }) {
  return <motion.li {...APARECE} transition={escalonado(index)} {...props} />;
}

/** Y para una sección de pantalla, que sí es un hito del documento. */
export function ApareceSeccion({
  index = 0,
  ...props
}: HTMLMotionProps<"section"> & { index?: number }) {
  return <motion.section {...APARECE} transition={escalonado(index)} {...props} />;
}
