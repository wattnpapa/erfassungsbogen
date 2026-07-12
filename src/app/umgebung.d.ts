/** Build-Konstanten, ersetzt durch `define` in vite.config.ts. */
declare const __APP_VERSION__: string;

/** Vite-Umgebungsflags (nur die hier genutzte Teilmenge). */
interface ImportMeta {
  readonly env: { readonly DEV: boolean };
}
