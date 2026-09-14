import type { AvatarParams } from "@/lib/types";

/**
 * Silueta del maniquí de referencia.
 *
 * Solo se usa al colocar una prenda: sirve para que el usuario vea dónde caen
 * los hombros, la cintura y los pies de su propio cuerpo y sitúe la foto con
 * criterio. El probador no la dibuja.
 *
 * Todo el dibujo se hace en centímetros reales: el origen está en la coronilla
 * y la Y crece hacia el suelo, de modo que una persona de 174 cm ocupa 174
 * unidades de alto. Gracias a eso las medidas que introduce el usuario con una
 * cinta métrica se usan tal cual, sin factores de conversión escondidos, y
 * colocar una prenda es tan directo como decir "60 cm de ancho a la altura de
 * los hombros".
 *
 * Los contornos (pecho, cintura, cadera) se convierten en anchuras suponiendo
 * una sección elíptica: el perímetro de una elipse es aproximadamente
 * π·(semieje mayor + semieje menor), así que si conocemos la proporción entre
 * fondo y anchura del tramo podemos despejar la anchura. Es la misma cuenta que
 * hace un patronista.
 */

export type Figure = ReturnType<typeof buildFigure>;

/** Proporciones que distinguen una silueta base de otra. */
const FIGURES = {
  neutra: {
    waistY: 0.375,
    chestY: 0.255,
    chestDepth: 0.72,
    waistDepth: 0.74,
    hipDepth: 0.78,
    shoulderSlope: 0.014,
    jaw: 0.86,
    underbust: 0.9,
  },
  femenina: {
    waistY: 0.365,
    chestY: 0.25,
    chestDepth: 0.78,
    waistDepth: 0.76,
    hipDepth: 0.8,
    shoulderSlope: 0.017,
    jaw: 0.79,
    underbust: 0.82,
  },
  masculina: {
    waistY: 0.385,
    chestY: 0.258,
    chestDepth: 0.7,
    waistDepth: 0.73,
    hipDepth: 0.76,
    shoulderSlope: 0.011,
    jaw: 0.93,
    underbust: 0.95,
  },
} as const;

type Point = [number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Anchura de un tramo a partir de su contorno y de la proporción fondo/ancho. */
function widthFromGirth(girthCm: number, depthRatio: number) {
  return girthCm / (Math.PI * (1 + depthRatio));
}

export function buildFigure(m: AvatarParams) {
  const F = FIGURES[m.figure as keyof typeof FIGURES] ?? FIGURES.neutra;
  const H = m.heightCm;
  const headH = H * 0.128;

  const y = {
    top: 0,
    eyes: headH * 0.53,
    chin: headH,
    neck: H * 0.163,
    shoulder: H * 0.195,
    chest: H * F.chestY,
    underbust: H * (F.chestY + 0.05),
    waist: H * F.waistY,
    hip: H * 0.495,
    crotch: Math.min(Math.max(H - m.inseamCm, H * 0.5), H * 0.58),
    knee: 0,
    ankle: H * 0.952,
    floor: H,
  };
  y.knee = y.crotch + (y.ankle - y.crotch) * 0.47;

  const half = {
    head: headH * 0.33,
    neck: (m.neckCm / (2 * Math.PI)) * 1.06,
    shoulder: m.shoulderCm / 2,
    chest: widthFromGirth(m.chestCm, F.chestDepth),
    waist: widthFromGirth(m.waistCm, F.waistDepth),
    hip: widthFromGirth(m.hipCm, F.hipDepth),
    thigh: (m.thighCm / (2 * Math.PI)) * 1.06,
    bicep: (m.bicepCm / (2 * Math.PI)) * 1.05,
    knee: 0,
    calf: 0,
    ankle: 0,
    forearm: 0,
    wrist: 0,
    hand: 0,
  };
  half.knee = half.thigh * 0.66;
  half.calf = half.thigh * 0.74;
  half.ankle = half.thigh * 0.4;
  half.forearm = half.bicep * 0.84;
  half.wrist = half.bicep * 0.52;
  half.hand = half.wrist * 1.5;

  /* ── Ejes de brazos y piernas ─────────────────────────────────────────── */

  const arm = {
    xShoulder: half.shoulder - half.bicep,
    // La muñeca cae por fuera de la cintura: si no, el antebrazo se comería el
    // costado y la figura parecería un bloque.
    xWrist: Math.max(half.waist + half.wrist + H * 0.012, half.shoulder - half.bicep),
    yShoulder: y.shoulder + headH * 0.08,
    yElbow: y.shoulder + m.armCm * 0.47,
    yWrist: y.shoulder + m.armCm,
    handLength: H * 0.107,
  };
  const xElbow = lerp(arm.xShoulder, arm.xWrist, 0.55);
  const yHandTip = arm.yWrist + arm.handLength;

  const legX = half.hip * 0.46;

  /* ── Contornos ────────────────────────────────────────────────────────── */

  const headPath = mirrored([
    [0, 0],
    [half.head * 0.72, headH * 0.1],
    [half.head, headH * 0.4],
    [half.head * 0.95, headH * 0.66],
    [half.head * F.jaw * 0.8, headH * 0.88],
    [half.head * 0.33, y.chin],
    [half.neck * 0.94, y.chin + headH * 0.1],
    [half.neck, y.neck + headH * 0.06],
  ]);

  const torsoPath = mirrored([
    [half.neck * 0.95, y.neck],
    [half.shoulder * 0.5, y.shoulder - H * F.shoulderSlope],
    [half.shoulder * 0.97, y.shoulder + H * 0.006],
    [half.chest, y.chest],
    [half.chest * F.underbust, y.underbust],
    [half.waist, y.waist],
    [half.hip, y.hip],
    [half.hip * 0.85, y.crotch - H * 0.015],
    [half.thigh * 0.72, y.crotch + H * 0.012],
    [0, y.crotch - H * 0.004],
  ]);

  /** Brazo: se baja por el borde exterior y se sube por el interior. */
  const armPath = () =>
    closed([
      [arm.xShoulder - half.bicep * 0.5, y.shoulder + H * 0.004],
      [arm.xShoulder + half.bicep * 1.02, y.shoulder + H * 0.016],
      [xElbow + half.forearm, arm.yElbow],
      [arm.xWrist + half.wrist, arm.yWrist],
      [arm.xWrist + half.hand, arm.yWrist + arm.handLength * 0.42],
      [arm.xWrist + half.hand * 0.55, yHandTip],
      [arm.xWrist - half.hand * 0.55, yHandTip],
      [arm.xWrist - half.hand, arm.yWrist + arm.handLength * 0.42],
      [arm.xWrist - half.wrist, arm.yWrist],
      [xElbow - half.forearm, arm.yElbow],
      [arm.xShoulder - half.bicep * 0.9, y.shoulder + headH * 0.45],
    ]);

  /** Pierna, con el pie incluido en el mismo contorno. */
  const legPath = () =>
    closed([
      [legX - half.thigh * 0.75, y.hip - H * 0.02],
      [legX + half.thigh, y.hip + H * 0.01],
      [legX + half.knee * 1.04, y.knee],
      [legX + half.calf, y.knee + (y.ankle - y.knee) * 0.3],
      [legX + half.ankle, y.ankle],
      [legX + half.ankle * 1.35, y.floor - H * 0.006],
      [legX + half.ankle * 1.15, y.floor],
      [legX - half.ankle * 0.95, y.floor],
      [legX - half.ankle, y.ankle],
      [legX - half.calf * 0.82, y.knee + (y.ankle - y.knee) * 0.3],
      [legX - half.knee * 0.95, y.knee],
      [legX - half.thigh * 0.9, y.crotch + H * 0.01],
    ]);

  const outer = Math.max(half.shoulder, half.hip, arm.xWrist + half.hand) + H * 0.06;

  return {
    measurements: m,
    height: H,
    headH,
    y,
    half,
    arm: { ...arm, xElbow, yHandTip },
    legX,
    /** Área de dibujo en centímetros, lista para el atributo viewBox. */
    viewBox: { x: -outer, y: -H * 0.02, width: outer * 2, height: H * 1.05 },
    paths: {
      head: headPath,
      torso: torsoPath,
      arm: armPath(),
      leg: legPath(),
    },
  };
}

/* ── Trazado de contornos ────────────────────────────────────────────────── */

/**
 * Refleja la mitad derecha para obtener un contorno cerrado y simétrico.
 * Los puntos que caen justo sobre el eje (la coronilla, la entrepierna) no se
 * duplican: si se repitieran, la curva daría un tirón al cerrarse.
 */
function mirrored(right: Point[]): string {
  const left = right
    .slice()
    .reverse()
    .filter(([x]) => Math.abs(x) > 0.001)
    .map(([x, yy]) => [-x, yy] as Point);
  return closed([...right, ...left]);
}

/**
 * Curva suave que pasa por todos los puntos (Catmull-Rom convertida a Bézier).
 * Dibujar la silueta con segmentos rectos la haría parecer un polígono.
 */
function closed(points: Point[]): string {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  let d = `M ${fmt(points[0][0])} ${fmt(points[0][1])}`;

  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${fmt(c1[0])} ${fmt(c1[1])}, ${fmt(c2[0])} ${fmt(c2[1])}, ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return `${d} Z`;
}

const fmt = (n: number) => Math.round(n * 100) / 100;
