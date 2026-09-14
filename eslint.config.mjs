import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // El proyecto nativo lo genera Capacitor: no es código nuestro y trae su
    // propio JavaScript empaquetado.
    "android/**",
    // Las fotos y la base de la versión con servidor, a la espera de migrarse.
    "migracion/**",
  ]),
]);

export default eslintConfig;
