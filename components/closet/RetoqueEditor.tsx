"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Modo = "borrar" | "restaurar";
type Trazo = { modo: Modo; radio: number; puntos: [number, number][] };

type Props = {
  /** Imagen ya recortada de fondo, sobre la que se retoca. */
  blob: Blob;
  onChange: (blob: Blob) => void;
};

/**
 * Retoque manual del recorte.
 *
 * El borrado automático deja casi siempre restos: una percha, un trozo de suelo
 * o la sombra de la prenda. Aquí se quitan pasando el dedo, y si uno se pasa,
 * el modo restaurar los devuelve.
 *
 * Los trazos se guardan como vectores —puntos y radio— en lugar de guardar
 * copias de la imagen. Deshacer es entonces volver a pintar la lista sin el
 * último, que es instantáneo y no ocupa decenas de megas en memoria, algo
 * importante en un móvil con una foto de 1280 px.
 */
export function RetoqueEditor({ blob, onChange }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const original = useRef<ImageBitmap | null>(null);
  const trazos = useRef<Trazo[]>([]);
  const actual = useRef<Trazo | null>(null);

  const [modo, setModo] = useState<Modo>("borrar");
  const [radio, setRadio] = useState(28);
  const [hayTrazos, setHayTrazos] = useState(false);
  const [listo, setListo] = useState(false);

  /** Vuelve a pintar la imagen y encima todos los trazos acumulados. */
  const repintar = useCallback(() => {
    const canvas = lienzo.current;
    const imagen = original.current;
    if (!canvas || !imagen) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagen, 0, 0);
    for (const trazo of trazos.current) aplicar(ctx, imagen, trazo);
  }, []);

  useEffect(() => {
    let vivo = true;
    createImageBitmap(blob).then((bitmap) => {
      if (!vivo) {
        bitmap.close();
        return;
      }
      original.current = bitmap;
      const canvas = lienzo.current;
      if (canvas) {
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        repintar();
      }
      setListo(true);
    });
    return () => {
      vivo = false;
    };
  }, [blob, repintar]);

  /** Convierte la posición del dedo a coordenadas de la imagen. */
  function punto(event: React.PointerEvent): [number, number] {
    const canvas = lienzo.current!;
    const caja = canvas.getBoundingClientRect();
    return [
      ((event.clientX - caja.left) / caja.width) * canvas.width,
      ((event.clientY - caja.top) / caja.height) * canvas.height,
    ];
  }

  function empezar(event: React.PointerEvent) {
    if (!listo) return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    // El radio se guarda en píxeles de la imagen para que el trazo no cambie
    // de grosor si después se ve a otro tamaño.
    const canvas = lienzo.current!;
    const escala = canvas.width / canvas.getBoundingClientRect().width;
    actual.current = { modo, radio: radio * escala, puntos: [punto(event)] };
    pintarUltimo();
  }

  function seguir(event: React.PointerEvent) {
    if (!actual.current) return;
    actual.current.puntos.push(punto(event));
    pintarUltimo();
  }

  function terminar() {
    if (!actual.current) return;
    trazos.current.push(actual.current);
    actual.current = null;
    setHayTrazos(true);
    exportar();
  }

  /** Pinta solo el trazo en curso, sin repintar toda la imagen. */
  function pintarUltimo() {
    const canvas = lienzo.current;
    const imagen = original.current;
    if (!canvas || !imagen || !actual.current) return;
    aplicar(canvas.getContext("2d")!, imagen, actual.current);
  }

  function deshacer() {
    trazos.current.pop();
    setHayTrazos(trazos.current.length > 0);
    repintar();
    exportar();
  }

  function limpiar() {
    trazos.current = [];
    setHayTrazos(false);
    repintar();
    exportar();
  }

  function exportar() {
    lienzo.current?.toBlob((resultado) => resultado && onChange(resultado), "image/png");
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-muted">
        Pasa el dedo para quitar lo que haya quedado del fondo: una percha, un trozo de suelo, una
        sombra. Si te pasas, cambia a restaurar y vuelve a pasarlo.
      </p>

      <div className="bg-checker edge grid place-items-center overflow-hidden rounded-2xl p-2">
        <canvas
          ref={lienzo}
          onPointerDown={empezar}
          onPointerMove={seguir}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          className="max-h-[42vh] w-auto max-w-full touch-none"
          style={{ cursor: "crosshair" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["borrar", "restaurar"] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            aria-pressed={modo === valor}
            onClick={() => setModo(valor)}
            className={[
              "min-h-10 rounded-full text-sm capitalize transition-shadow",
              modo === valor ? "bg-accent font-medium text-on-accent" : "edge bg-surface text-ink-muted",
            ].join(" ")}
          >
            {valor}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-2 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-[0.14em] text-ink-faint">Grosor</span>
          <span className="tabular font-display text-lg">{radio * 2} px</span>
        </span>
        <input
          type="range"
          min={6}
          max={90}
          value={radio}
          onChange={(e) => setRadio(Number(e.target.value))}
          aria-label="Grosor del pincel"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-[var(--color-accent)]"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={deshacer}
          disabled={!hayTrazos}
          className="edge min-h-10 flex-1 rounded-full text-sm text-ink-muted disabled:opacity-40"
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={limpiar}
          disabled={!hayTrazos}
          className="edge min-h-10 flex-1 rounded-full text-sm text-ink-muted disabled:opacity-40"
        >
          Empezar de nuevo
        </button>
      </div>
    </div>
  );
}

/** Pinta un trazo: borra con `destination-out` o repone desde el original. */
function aplicar(ctx: CanvasRenderingContext2D, imagen: ImageBitmap, trazo: Trazo) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = trazo.radio * 2;

  const camino = new Path2D();
  const [primero, ...resto] = trazo.puntos;
  camino.moveTo(primero[0], primero[1]);
  for (const [x, y] of resto) camino.lineTo(x, y);
  // Un solo punto no dibuja línea: se marca con un círculo.
  if (resto.length === 0) camino.arc(primero[0], primero[1], trazo.radio, 0, Math.PI * 2);

  if (trazo.modo === "borrar") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(camino);
    ctx.stroke(camino);
  } else {
    // Restaurar pinta con un patrón de la propia imagen alineado al origen, de
    // modo que cada píxel recuperado vuelve exactamente a su sitio. Recortar al
    // trazo no serviría: el contorno de una línea no delimita ningún área.
    const patron = ctx.createPattern(imagen, "no-repeat");
    if (patron) {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = patron;
      ctx.fillStyle = patron;
      ctx.fill(camino);
      ctx.stroke(camino);
    }
  }
  ctx.restore();
}
