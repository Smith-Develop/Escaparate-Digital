/**
 * Colocación de las prendas en el probador.
 *
 * Cada prenda guarda dónde y con qué tamaño se coloca, en coordenadas
 * relativas a un lienzo de proporción fija. Al ser relativas, la misma
 * colocación vale igual en la miniatura del armario que a pantalla completa, y
 * no se estropea si el usuario cambia de móvil o de medidas.
 *
 * Lo decide el usuario arrastrando la prenda sobre un maniquí de referencia al
 * subir la foto: es una vez por prenda y el resultado es exacto, en lugar de
 * adivinarlo con reglas por categoría que nunca aciertan con todas las fotos.
 */

/** Proporción ancho/alto del lienzo del probador. */
export const CANVAS_ASPECT = 0.5;

export type Placement = {
  /** Centro horizontal, de 0 (izquierda) a 1 (derecha). */
  x: number;
  /** Borde superior, de 0 (arriba) a 1 (abajo). */
  y: number;
  /** Anchura como fracción del ancho del lienzo. */
  w: number;
  /**
   * Altura como fracción del alto del lienzo. 0 significa automática: se
   * deduce de la proporción de la foto. Deja de serlo cuando el usuario estira
   * la prenda para que cubra una zona concreta.
   */
  h?: number;
};

/** Punto de partida por categoría: el usuario solo tiene que retocarlo. */
const DEFAULTS: Record<string, Placement> = {
  superior: { x: 0.5, y: 0.17, w: 0.66, h: 0 },
  abrigo: { x: 0.5, y: 0.15, w: 0.76, h: 0 },
  inferior: { x: 0.5, y: 0.42, w: 0.52, h: 0 },
  calzado: { x: 0.5, y: 0.88, w: 0.46, h: 0 },
  accesorio: { x: 0.5, y: 0.02, w: 0.24, h: 0 },
};

export function defaultPlacement(category: string): Placement {
  return { ...(DEFAULTS[category] ?? DEFAULTS.superior) };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function clampPlacement(p: Placement): Placement {
  return {
    // Se permite salirse un poco del lienzo: a veces interesa que una prenda
    // sobresalga por abajo, pero no que se pierda de vista del todo.
    x: clamp(p.x, -0.2, 1.2),
    y: clamp(p.y, -0.35, 1.1),
    w: clamp(p.w, 0.08, 1.6),
    h: p.h ? clamp(p.h, 0.03, 1.6) : 0,
  };
}

/**
 * Altura con la que se dibuja la prenda. Con `h` automática se respeta la
 * proporción de la foto; en cuanto el usuario la estira, manda su valor.
 */
export function resolveHeight(p: Placement, imageWidth = 0, imageHeight = 0) {
  if (p.h && p.h > 0) return p.h;
  const ratio = imageWidth > 0 && imageHeight > 0 ? imageHeight / imageWidth : 1;
  return p.w * ratio * CANVAS_ASPECT;
}

/** Estilo CSS de una prenda colocada dentro del lienzo. */
export function placementStyle(p: Placement, height?: number): React.CSSProperties {
  return {
    position: "absolute",
    left: `${(p.x - p.w / 2) * 100}%`,
    top: `${p.y * 100}%`,
    width: `${p.w * 100}%`,
    // Sin altura explícita la pone la propia imagen y no se deforma.
    height: height && height > 0 ? `${height * 100}%` : "auto",
  };
}

/**
 * Figura de referencia del usuario para el editor de colocación y para el
 * probador: su foto de cuerpo entero, si la tiene.
 */
export function bodyReference(avatar: {
  photoUrl: string | null;
  photoX: number;
  photoY: number;
  photoW: number;
  photoH: number;
}) {
  if (!avatar.photoUrl) return null;
  return {
    imageUrl: avatar.photoUrl,
    x: avatar.photoX,
    y: avatar.photoY,
    w: avatar.photoW,
    h: avatar.photoH,
  };
}

/** Orden de apilado: lo que en la realidad va debajo se pinta antes. */
export const LAYER_ORDER = ["calzado", "inferior", "superior", "abrigo", "accesorio"];

export function sortByLayer<T extends { category: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => LAYER_ORDER.indexOf(a.category) - LAYER_ORDER.indexOf(b.category),
  );
}
