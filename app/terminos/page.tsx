"use client";

import Link from "next/link";
import { Apartado, Documento } from "@/components/legal/Documento";
import { CONTACTO, RESPONSABLE } from "@/lib/legal";

/**
 * Condiciones de uso.
 *
 * Cortas a propósito. Una app de armario personal no necesita veinte páginas de
 * cláusulas: necesita decir de quién son las fotos, qué no se puede subir y qué
 * pasa si el servicio se cierra.
 */
export default function TerminosPage() {
  return (
    <Documento
      titulo="Condiciones de uso"
      entradilla="Las reglas del sitio, en corto: de quién es cada cosa y qué se puede esperar."
    >
      <Apartado titulo="Qué es esto">
        <p>
          Escaparate es una aplicación para catalogar tu ropa y combinarla. La ofrece{" "}
          {RESPONSABLE} desde su propio servidor. Usarla es gratis y no lleva publicidad.
        </p>
      </Apartado>

      <Apartado titulo="Tus fotos son tuyas">
        <p>
          Todo lo que subes sigue siendo tuyo. No se usa para nada que no sea enseñártelo a ti
          dentro de la app: no se publica, no se cede, no se vende y no se usa para entrenar
          ningún modelo. Al borrar la cuenta desaparece.
        </p>
      </Apartado>

      <Apartado titulo="Qué no se puede subir">
        <p>
          Contenido ilegal, de otras personas sin su permiso, o fotos de menores. Una cuenta que
          haga eso se suspende, y si procede se borra.
        </p>
      </Apartado>

      <Apartado titulo="Tu cuenta">
        <p>
          Cuida tu contraseña: quien la tenga entra en tu armario. Si sospechas que alguien la
          sabe, cámbiala desde{" "}
          <Link href="/recuperar" className="text-accent-ink underline underline-offset-4">
            recuperar contraseña
          </Link>
          .
        </p>
        <p>
          Puedes cerrar tu cuenta en cualquier momento; cómo hacerlo está en{" "}
          <Link href="/borrar-cuenta" className="text-accent-ink underline underline-offset-4">
            borrar tu cuenta
          </Link>
          .
        </p>
      </Apartado>

      <Apartado titulo="Qué no se promete">
        <p>
          El servicio se ofrece tal cual, sin garantía de estar disponible siempre ni de que no
          haya fallos. Haz copia de lo que no quieras perder: la app no sustituye a una copia de
          seguridad de tus fotos.
        </p>
        <p>
          Si algún día el servicio fuera a cerrarse, se avisaría dentro de la app con antelación
          suficiente para que te lleves tus datos.
        </p>
      </Apartado>

      <Apartado titulo="Dudas">
        <p>
          Escribe a{" "}
          <a href={`mailto:${CONTACTO}`} className="text-accent-ink underline underline-offset-4">
            {CONTACTO}
          </a>
          . Se aplica la ley española.
        </p>
      </Apartado>
    </Documento>
  );
}
