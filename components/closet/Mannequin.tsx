"use client";

import { useMemo } from "react";
import { buildFigure } from "@/lib/silhouette";
import type { AvatarParams } from "@/lib/types";

/**
 * Maniquí de referencia.
 *
 * Solo aparece mientras se coloca una prenda, nunca en el probador: sirve para
 * saber dónde caen los hombros, la cintura y los pies, y así poder situar la
 * foto con criterio. Se dibuja con las medidas del usuario, de modo que la
 * referencia es su propio cuerpo y no un cuerpo genérico.
 */
export function Mannequin({ avatar, className }: { avatar: AvatarParams; className?: string }) {
  const figure = useMemo(() => buildFigure(avatar), [avatar]);
  const { viewBox, paths, y, half } = figure;

  const guides: [string, number][] = [
    ["Hombros", y.shoulder],
    ["Cintura", y.waist],
    ["Cadera", y.hip],
    ["Rodilla", y.knee],
  ];

  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden
    >
      <g
        fill="currentColor"
        fillOpacity={0.38}
        stroke="currentColor"
        strokeOpacity={0.9}
        strokeWidth={figure.height * 0.0022}
        strokeLinejoin="round"
      >
        <path d={paths.leg} />
        <path d={paths.leg} transform="scale(-1,1)" />
        <path d={paths.arm} />
        <path d={paths.arm} transform="scale(-1,1)" />
        <path d={paths.head} />
        <path d={paths.torso} />
      </g>

      {/* Cotas de referencia para alinear el bajo y los hombros de la prenda. */}
      <g stroke="currentColor" strokeOpacity={0.5} strokeWidth={figure.height * 0.0016}>
        {guides.map(([label, cy]) => (
          <line
            key={label}
            x1={viewBox.x + figure.height * 0.01}
            x2={viewBox.x + viewBox.width - figure.height * 0.01}
            y1={cy}
            y2={cy}
            strokeDasharray={`${figure.height * 0.01} ${figure.height * 0.012}`}
          />
        ))}
        <line
          x1={-half.hip * 1.6}
          x2={half.hip * 1.6}
          y1={y.floor}
          y2={y.floor}
          strokeOpacity={0.5}
        />
      </g>
    </svg>
  );
}
