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
    // Plain classic-script browser extension (not the Next.js app) — every
    // function here is a deliberate cross-file global consumed via
    // importScripts()/multi-<script> loading, not a module import. ESLint's
    // no-unused-vars can't see that usage and flags all of them, so this
    // whole tree is out of scope for the app's lint rules. Anchored with a
    // leading "/" so this doesn't also match src/app/extension/.
    "/extension/**",
  ]),
]);

export default eslintConfig;
