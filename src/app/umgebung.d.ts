/** Build-Konstanten, ersetzt durch `define` in vite.config.ts. */
declare const __APP_VERSION__: string;

/**
 * Standardschrift-Metriken des pdfmake-Browser-Builds (@types/pdfmake kennt
 * diesen Pfad nicht). Liefert vfs-Einträge und die Font-Definition zum
 * Registrieren per pdfMake.addFontContainer — siehe src/app/pdf.ts.
 */
declare module "pdfmake/build/standard-fonts/Helvetica" {
  const fontContainer: {
    vfs: Record<string, { data: string; encoding?: string }>;
    fonts: Record<string, unknown>;
  };
  export default fontContainer;
}

/** Vite-Umgebungsflags (nur die hier genutzte Teilmenge). */
interface ImportMeta {
  readonly env: { readonly DEV: boolean };
}
