"use client";

import { motion } from "framer-motion";
import { centimosRedondeados } from "@/lib/dinero";
import type { Grupo } from "@/lib/inversion";

/**
 * Los gráficos del inicio.
 *
 * Dibujados a mano con SVG y animados con las transiciones que ya usa la app:
 * una biblioteca de gráficos son 50 kB largos para pintar un anillo y una
 * línea, y encima habría que pelearse con ella para que respetara los colores
 * del tema.
 *
 * Los dos llevan su lectura en texto al lado —la leyenda del anillo, las cifras
 * de la línea—, porque un gráfico que solo se entiende mirándolo deja fuera a
 * quien usa lector de pantalla y a quien no distingue bien los colores.
 */

/** Tonos del anillo: el ámbar de la marca y variaciones suyas, de más a menos. */
const TONOS = ["var(--accent)", "#d9944a", "#b8783a", "#8f5a0e", "#6b4a2a"];

export function AnilloCategorias({ grupos, total }: { grupos: Grupo[]; total: number }) {
  const conGasto = grupos.filter((g) => g.total > 0);
  if (conGasto.length === 0 || total === 0) return null;

  const R = 54;
  const CIRCUNFERENCIA = 2 * Math.PI * R;

  // El arranque de cada arco se calcula antes de pintar, no acumulando dentro
  // del map: React puede repetir el render y una variable que se va sumando
  // sobre la marcha daría un anillo distinto cada vez.
  const arcos = conGasto.reduce<{ grupo: Grupo; inicio: number; porcion: number }[]>(
    (acc, grupo) => {
      const previo = acc.at(-1);
      const inicio = previo ? previo.inicio + previo.porcion : 0;
      return [...acc, { grupo, inicio, porcion: grupo.total / total }];
    },
    [],
  );

  return (
    <section className="edge rounded-[1.5rem] bg-surface p-5">
      <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Reparto por categoría</h2>

      <div className="mt-4 flex items-center gap-5">
        <svg viewBox="0 0 140 140" className="size-36 shrink-0 -rotate-90" role="img"
             aria-label={`Reparto del gasto: ${conGasto.map((g) => `${g.label}, ${Math.round((g.total / total) * 100)} por ciento`).join("; ")}`}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth="16" />
          {arcos.map(({ grupo, inicio, porcion }, i) => {
            return (
              <motion.circle
                key={grupo.id}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={TONOS[i % TONOS.length]}
                strokeWidth="16"
                strokeLinecap="butt"
                strokeDasharray={`${porcion * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                strokeDashoffset={-inicio * CIRCUNFERENCIA}
                initial={{ opacity: 0, strokeDasharray: `0 ${CIRCUNFERENCIA}` }}
                animate={{ opacity: 1, strokeDasharray: `${porcion * CIRCUNFERENCIA} ${CIRCUNFERENCIA}` }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: "easeOut" }}
              />
            );
          })}
        </svg>

        <ul className="min-w-0 flex-1 space-y-2">
          {conGasto.map((grupo, i) => (
            <li key={grupo.id} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: TONOS[i % TONOS.length] }}
              />
              <span className="min-w-0 flex-1 truncate">{grupo.label}</span>
              <span className="tabular shrink-0 text-xs text-ink-muted">
                {Math.round((grupo.total / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Gasto por año.
 *
 * Con un solo año no hay línea que trazar, así que en ese caso no se pinta
 * nada: un gráfico de un punto no dice más que el número.
 */
export function LineaPorAño({ grupos }: { grupos: Grupo[] }) {
  const años = [...grupos].filter((g) => g.id !== "sin").sort((a, b) => a.id.localeCompare(b.id));
  if (años.length < 2) return null;

  const max = Math.max(...años.map((a) => a.total), 1);
  const ANCHO = 280;
  const ALTO = 90;
  const punto = (i: number, valor: number) => ({
    x: (i / (años.length - 1)) * ANCHO,
    y: ALTO - (valor / max) * (ALTO - 12) - 6,
  });
  const puntos = años.map((a, i) => punto(i, a.total));
  const linea = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${linea} L${ANCHO} ${ALTO} L0 ${ALTO} Z`;

  return (
    <section className="edge rounded-[1.5rem] bg-surface p-5">
      <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Gasto por año</h2>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="mt-4 w-full"
        role="img"
        aria-label={`Gasto por año: ${años.map((a) => `${a.id}, ${centimosRedondeados(a.total)}`).join("; ")}`}
      >
        <motion.path
          d={area}
          fill="var(--color-accent)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.16 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        />
        <motion.path
          d={linea}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {puntos.map((p, i) => (
          <motion.circle
            key={años[i].id}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="var(--color-surface)"
            stroke="var(--color-accent)"
            strokeWidth="3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          />
        ))}
      </svg>

      <ul className="mt-2 flex justify-between text-xs text-ink-muted">
        {años.map((a) => (
          <li key={a.id} className="text-center">
            <span className="tabular block text-sm text-ink">{centimosRedondeados(a.total)}</span>
            {a.id}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Barra que crece al entrar, para los desgloses en lista. */
export function BarraAnimada({ porcentaje, retraso = 0 }: { porcentaje: number; retraso?: number }) {
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${porcentaje}%` }}
        transition={{ duration: 0.6, delay: retraso, ease: "easeOut" }}
      />
    </div>
  );
}

/**
 * Anillo de puntuación, con la cifra dentro.
 *
 * Es el gesto de la referencia para resumir un porcentaje de un vistazo. La
 * cifra va en texto de verdad en el centro del SVG, no dibujada: así se puede
 * seleccionar, se lee con lector de pantalla y crece con la tipografía del
 * sistema.
 */
export function AnilloPuntuacion({
  porcentaje,
  titulo,
  pie,
}: {
  porcentaje: number;
  titulo: string;
  pie: string;
}) {
  const R = 46;
  const CIRCUNFERENCIA = 2 * Math.PI * R;
  const recortado = Math.max(0, Math.min(100, porcentaje));

  return (
    <section className="edge flex items-center gap-5 rounded-[1.5rem] bg-surface p-5">
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            initial={{ strokeDashoffset: CIRCUNFERENCIA }}
            animate={{ strokeDashoffset: CIRCUNFERENCIA * (1 - recortado / 100) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>
        <span className="tabular absolute inset-0 grid place-items-center font-display text-2xl">
          {recortado}%
        </span>
      </div>

      <div className="min-w-0">
        <h2 className="font-display text-lg leading-tight">{titulo}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{pie}</p>
      </div>
    </section>
  );
}
