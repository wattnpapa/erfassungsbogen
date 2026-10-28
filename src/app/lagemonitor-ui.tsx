/**
 * Lagemonitor: reine Anzeige der Lage für den Fernseher im Führungsfahrzeug.
 *
 * Läuft als eigene Seite (`?lagemonitor=<Einsatz-Kennung>`) in einem zweiten
 * Fenster desselben Geräts. Die Daten kommen aus demselben Speicher wie die
 * Einsatzansicht; ein `storage`-Ereignis aus dem Fenster, in dem gearbeitet
 * wird, löst das Neulesen aus, ein Takt von wenigen Sekunden fängt den Rest
 * ab. Es gibt kein Netz und keinen Server dazwischen.
 *
 * Gezeigt werden Zahlen und Einheitsnamen, keine Personen.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./lagemonitor.css";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import {
  BEGINN_SCHLUESSEL,
  FUNKRUF_MAX,
  FUNKRUF_SCHLUESSEL,
  einsatzFunkrufLaden,
  einsatzFunkrufSetzen,
  einsatzbeginnLaden,
  einsatzbeginnSetzen,
  beginnHinweis,
} from "./lagemonitor-beginn";
import { frageJaNein } from "./dialoge";
import { ortOhneZusatz } from "./hilfen";
import { sammlungenBeiseitegelegt } from "./unlesbar";
import { alterKurz, alterText, anwesendenAlterText, ausEingabeWert, bedarfText, dauerText, lagebild, uhrTeile, zuEingabeWert, type EinheitZeile } from "./lagemonitor";

import { URL_PARAMETER, lagemonitorKennung } from "./lagemonitor-kennung";
/** Gemerkte Helligkeitsstufe des Monitors („dunkel" oder „gedimmt"; „hell" wird nie gemerkt, R7-L3). */
export const STUFE_SCHLUESSEL = "eeb.lagestufe.v1";
/** Mehr Bewegungszeilen als das gibt es nicht im Bild; der Rest steht als „+ n weitere" (R7-K2). */
const BEWEGUNGEN_MAX = 3;
/**
 * Bewegungszeilen je nach Bild (R17-K3, K11): Die Einheitenliste ist der Kern der Lage, Bewegungen sind Beiwerk. Auf einem
 * 720p-Fernseher füllten drei Zeilen plus „+ n weitere" das Bild, von sechs Einheiten standen zwei in der Tabelle; am Telefon
 * brach jede Zeile in drei. Dort und bei niedrigem Bild eine Zeile, bis 1000 px Höhe zwei, darüber drei.
 */
export function bewegungenMax(breite: number, hoehe: number): number {
  if (breite <= 640 || hoehe <= 800) return 1;
  return hoehe <= 1000 ? 2 : BEWEGUNGEN_MAX;
}
/** Schriftfaktoren der Einheitentabelle, bevor Zeilen entfallen (R8-L1). */
const SCHRIFT_STUFEN = [1, 0.95, 0.9, 0.85];
/** Ab diesem Alter der letzten Meldung wird der Datenstand abgesetzt (R7-K8). */
const VERALTET_MIN = 60;
/** Nach jedem Stufenwechsel ist „heller" so lange gesperrt: ein Doppeltipp führt nie über eine Stufe hinaus (R9-L1). */
export const STUFEN_SPERRE_MS = 1500;

/** Normalisiert für den Vergleich Ort/Funkrufname (Groß-/Kleinschreibung, Leerraum). */
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
/** Steht der Ort einer Einheit schon im Funkrufnamen? Dann wird er am Telefon nicht noch einmal genannt (R9-K5). */
export function ortImFunkruf(e: { ort?: string | null; funkruf?: string | null }): boolean {
  const ort = norm(ortOhneZusatz(e.ort ?? ""));
  return ort === "" || norm(e.funkruf ?? "").includes(ort);
}

type Stufe = "dunkel" | "gedimmt" | "hell";
const STUFEN_NAME: Record<Stufe, string> = { dunkel: "Dunkel", gedimmt: "Gedimmt", hell: "Hell" };

function stufeLesen(): Stufe {
  try {
    const v = globalThis.localStorage?.getItem(STUFE_SCHLUESSEL);
    if (v === "dunkel" || v === "gedimmt") return v;
  } catch { /* gesperrter Speicher: Vorgabe */ }
  // Ohne gemerkte Wahl folgt der Monitor dem Modus der App: Nacht -> gedimmt (R7-L3).
  return document.documentElement.classList.contains("nacht-modus") ? "gedimmt" : "dunkel";
}

function stufeMerken(stufe: Stufe): void {
  if (stufe === "hell") return;
  try { globalThis.localStorage?.setItem(STUFE_SCHLUESSEL, stufe); } catch { /* nicht gemerkt, der Monitor läuft trotzdem */ }
}
/** Takt für Uhr, Dauer und „vor X Min". */
const TAKT_MS = 5_000;

export { lagemonitorKennung };

/**
 * Lagemonitor in einem zweiten Fenster öffnen. Lässt die Umgebung das nicht zu
 * (Popup-Sperre), wechselt dieses Fenster selbst in den Monitor.
 */
export function lagemonitorOeffnen(einsatzId: string): void {
  const adresse = `${window.location.pathname}?${URL_PARAMETER}=${encodeURIComponent(einsatzId)}`;
  const fenster = window.open(adresse, "eeb-lagemonitor");
  if (!fenster) window.location.assign(adresse);
}

function usePuls(): number {
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setJetzt(Date.now()), TAKT_MS);
    return () => window.clearInterval(t);
  }, []);
  return jetzt;
}

/** Bildschirm wachhalten, solange der Monitor läuft (wo der Browser es kann). */
function useWachhalten(): void {
  useEffect(() => {
    let sperre: { release: () => Promise<void> } | null = null;
    let weg = false;
    async function holen() {
      try {
        const w = (navigator as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (!w || document.visibilityState !== "visible") return;
        const s = await w.request("screen");
        if (weg) void s.release();
        else sperre = s;
      } catch {
        /* nicht erlaubt oder nicht unterstützt — der Monitor läuft trotzdem */
      }
    }
    void holen();
    document.addEventListener("visibilitychange", holen);
    return () => {
      weg = true;
      document.removeEventListener("visibilitychange", holen);
      void sperre?.release();
    };
  }, []);
}

/** Zähler, der hochgeht, sobald ein anderes Fenster Einsätze oder Beginn ändert. */
function useSpeicherAenderung(): number {
  const [stand, setStand] = useState(0);
  useEffect(() => {
    const horcher = (e: StorageEvent) => {
      if (e.key === null || e.key === "eeb.einsaetze.v1" || e.key === BEGINN_SCHLUESSEL || e.key === FUNKRUF_SCHLUESSEL) {
        setStand((n) => n + 1);
      }
    };
    window.addEventListener("storage", horcher);
    return () => window.removeEventListener("storage", horcher);
  }, []);
  return stand;
}

function schliessen() {
  if (window.opener) window.close();
  else window.location.assign(window.location.pathname);
}

function vollbild() {
  const doc = document;
  if (doc.fullscreenElement) void doc.exitFullscreen();
  else void doc.documentElement.requestFullscreen?.().catch(() => {});
}

/**
 * Einheitentabelle, die auf den Platz im Bild begrenzt ist: Was nicht mehr passt,
 * wird durch „+ n weitere Einheiten" ersetzt statt unter die Bildkante zu laufen
 * (R7-K1). Gemessen wird im Browser, und zwar im Endzustand: Für jede Zeilenzahl
 * wird die Tabelle so gesetzt, wie sie dann steht (Spalten und Zeilenumbrüche
 * ändern sich mit den ausgeblendeten Zeilen), und die größte Zahl genommen, bei
 * der Zeilen samt Hinweiszeile in den Behälter passen (R8-L1, R8-N2). Wo es keine
 * Messung gibt (kein Layout) oder der Behälter mitwächst (Telefon), stehen alle
 * Zeilen da. Die Zeilen sind nach „zuletzt gemeldet zuerst" geordnet (R8-K5).
 */
function EinheitenTabelle({ einheiten }: { einheiten: readonly EinheitZeile[] }) {
  const behaelter = useRef<HTMLDivElement>(null);
  const hinweisEl = useRef<HTMLDivElement>(null);
  const tabelleEl = useRef<HTMLTableElement>(null);
  const [weitere, setWeitere] = useState(0);

  useLayoutEffect(() => {
    const el = behaelter.current;
    const hinweis = hinweisEl.current;
    const tabelle = tabelleEl.current;
    if (!el || !hinweis || !tabelle) return;
    const messen = () => {
      // Nur wenn die Spalten sonst aus dem Bild liefen (F/U/M!), dürfen Wörter im Notfall mitten im Wort brechen (R9-K2, R9-L3).
      tabelle.classList.remove("lm-bruch");
      if (el.scrollWidth > el.clientWidth + 1) tabelle.classList.add("lm-bruch");
      const zeilen = Array.from(el.querySelectorAll<HTMLElement>("tbody tr"));
      const setze = (n: number) => {
        zeilen.forEach((z, i) => { z.style.display = i >= n ? "none" : ""; });
        hinweis.style.display = n < zeilen.length ? "" : "none";
      };
      const hoehe = el.clientHeight;
      if (hoehe === 0 || zeilen.length === 0) {
        setze(zeilen.length);
        return setWeitere(0);
      }
      const oben = el.getBoundingClientRect().top;
      /** Passt die Tabelle mit den ersten n Zeilen (und Hinweiszeile, wenn n < alle) in den Behälter? */
      const passt = (n: number) => {
        setze(n);
        const letzte = zeilen[n - 1]!.getBoundingClientRect().bottom - oben;
        const ende = n < zeilen.length ? Math.max(letzte, hinweis.getBoundingClientRect().bottom - oben) : letzte;
        return ende <= hoehe + 0.5;
      };
      // Zuerst die Schrift um höchstens 15 % verkleinern, wenn dadurch alle Zeilen passen (ein Umbruch kostet sonst eine Zeile).
      let n = zeilen.length;
      let ganz = false;
      for (const faktor of SCHRIFT_STUFEN) {
        tabelle.style.fontSize = faktor === 1 ? "" : `${1.1 * faktor}em`;
        if (passt(n)) { ganz = true; break; }
      }
      if (!ganz) tabelle.style.fontSize = "";
      if (!ganz) {
        // Schätzung aus dem vollen Zustand, dann im Endzustand nach unten und oben abgleichen.
        setze(zeilen.length);
        let schaetz = 0;
        zeilen.forEach((z, i) => { if (z.getBoundingClientRect().bottom - oben <= hoehe) schaetz = i + 1; });
        n = Math.min(zeilen.length - 1, Math.max(1, schaetz));
        if (passt(n)) {
          while (n + 1 < zeilen.length && passt(n + 1)) n++;
        } else {
          while (n > 1 && !passt(n)) n--;
        }
      }
      setze(n);
      setWeitere(zeilen.length - n);
    };
    messen();
    if (typeof ResizeObserver === "undefined") return;
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(el);
    return () => beobachter.disconnect();
  });

  return (
    <div className="lm-tabelle" ref={behaelter}>
      <table className="lm-einheiten" ref={tabelleEl}>
        {/* Die Reihenfolge steht über der Tabelle: Wer „seine" Einheit sucht, sieht, wonach die Zeilen geordnet sind (R18-K5). */}
        <caption className="lm-reihenfolge">Reihenfolge: ⚠ älteste Angaben zuerst, danach zuletzt gemeldet</caption>
        <thead>
          <tr>
            <th className="lm-orga">Orga</th><th>Ort</th><th><span className="lm-lang">Funkrufname</span><span className="lm-kurz">Funkruf / Ort</span></th><th className="lm-typ">Einheitentyp</th>
            <th className="lm-zahl" title="Führer">F</th>
            <th className="lm-zahl" title="Unterführer">U</th>
            <th className="lm-zahl" title="Mannschaft">M</th>
          </tr>
        </thead>
        <tbody>
          {einheiten.map((e) => (
            <tr key={e.id}>
              <td className="lm-orga">{e.orga}{e.soll && <abbr className="lm-soll" title="Sollstärke, nicht gemeldet"> S</abbr>}{e.alterMin != null && <abbr className="lm-alt" title={e.standAlt ? "Der Stand der Angaben ist älter als eine Stunde" : "Meldung ist älter als eine Stunde"}> ⚠ {e.standAlt ? "Stand " : ""}{alterKurz(e.alterMin)}</abbr>}</td>
              <td>{e.ort || "–"}</td>
              {/* Am Telefon entfällt die Ort-Spalte: Der Ort steht im Funkrufnamen oder, wenn nicht, als Zusatz darunter (R9-K5). */}
              {/* R19-K11: Der Zug steht am Telefon unter dem Funkrufnamen, nicht in der Spalte „Orga" zwischen Organisation und Alter. */}
              <td data-ort={ortImFunkruf(e) ? undefined : e.ort}>{e.funkruf || "–"}{e.zug && <span className="lm-zug-tel">{e.zug}</span>}{e.auftrag && <span className="lm-auftrag-tel">{e.auftrag}</span>}</td>
              <td className="lm-typ">
                {e.typ || (e.zug ? "" : "–")}
                {e.zug && <span className="lm-zug">{e.typ ? " · " : ""}{e.zug}</span>}
                {e.auftrag && <span className="lm-auftrag">{e.auftrag}</span>}
              </td>
              <td className="lm-zahl">{e.fuehrer}</td>
              <td className="lm-zahl">{e.unterfuehrer}</td>
              <td className="lm-zahl">{e.mannschaft}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lm-weitere" ref={hinweisEl} style={weitere === 0 ? { display: "none" } : undefined}>
        + {Math.max(weitere, 1)} weitere {weitere <= 1 ? "Einheit" : "Einheiten"} · ⚠ und zuletzt gemeldete zuerst
      </div>
    </div>
  );
}

export function Lagemonitor({ einsatzId }: { einsatzId: string }) {
  const jetzt = usePuls();
  const stand = useSpeicherAenderung();
  useWachhalten();
  // Bei jedem Durchlauf neu lesen: `stand` und `jetzt` lösen ihn aus, der Lesezugriff ist gepuffert (einsaetze-lesen.ts).
  void stand;
  const gelesen = einsaetzeLaden().find((s) => s.id === einsatzId);
  // Ist der gespeicherte Text unlesbar geworden (anderes Fenster, Absturz), bleibt der letzte gültige Stand mit seiner
  // Uhrzeit stehen, statt „nicht mehr vorhanden“ zu behaupten (R9-O2).
  const letzterGueltiger = useRef<{ einsatz: NonNullable<typeof gelesen>; am: number } | null>(null);
  if (gelesen) letzterGueltiger.current = { einsatz: gelesen, am: Date.now() };
  const nichtLesbar = !gelesen && sammlungenBeiseitegelegt();
  const einsatz = gelesen ?? (nichtLesbar ? letzterGueltiger.current?.einsatz : undefined);
  const staleSeit = !gelesen && einsatz ? letzterGueltiger.current?.am ?? null : null;
  const beginn = einsatzbeginnLaden(einsatzId);
  const funkruf = einsatzFunkrufLaden(einsatzId);

  useEffect(() => {
    document.title = einsatz ? `Lage – ${einsatz.name}` : "Lagemonitor";
  }, [einsatz]);

  // Leiter Gedimmt < Dunkel < Hell: „heller" und „dunkler" gehen je eine Sprosse. Aus Gedimmt führt ein Tipp nie auf Hell,
  // aus Hell führt ein Tipp zurück auf Dunkel statt über ein zweites helles Bild (R8-L4).
  const [stufe, setStufe] = useState<Stufe>(stufeLesen);
  const klasse = `lm${stufe === "hell" ? " lm-hell" : stufe === "gedimmt" ? " lm-gedimmt" : ""}`;
  const heller: Stufe | null = stufe === "gedimmt" ? "dunkel" : stufe === "dunkel" ? "hell" : null;
  const dunkler: Stufe | null = stufe === "hell" ? "dunkel" : stufe === "dunkel" ? "gedimmt" : null;
  // Sperre gegen Doppeltipp und Prellen: Nach jedem Wechsel ist „heller" 1,5 s gesperrt; „dunkler" nie, damit ein
  // geblendeter Nutzer sofort zurück kann (R9-L1).
  const [sperreBis, setSperreBis] = useState(0);
  const sperreRef = useRef(0);
  useEffect(() => {
    if (sperreBis <= Date.now()) return;
    const t = window.setTimeout(() => setSperreBis(0), sperreBis - Date.now());
    return () => window.clearTimeout(t);
  }, [sperreBis]);
  function stufeWechseln(neu: Stufe, heller: boolean) {
    if (heller && Date.now() < sperreRef.current) return;
    sperreRef.current = Date.now() + STUFEN_SPERRE_MS;
    setSperreBis(sperreRef.current);
    setStufe(neu);
    stufeMerken(neu);
  }
  const hellerGesperrt = sperreBis > 0;
  // Helligkeit gehört ins erste Bild, nicht hinter „Optionen": am Telefon steht die Leiste ganz oben, am Fernseher im Fuß (R10-L3).
  const stufenleiste = (
    <div className="lm-zeile lm-stufenleiste">
      <p className="lm-stufe">Stufe: {STUFEN_NAME[stufe]}</p>
      <button
        type="button"
        className="lm-knopf"
        aria-disabled={dunkler == null || undefined}
        data-anschlag={dunkler == null || undefined}
        onClick={() => dunkler && stufeWechseln(dunkler, false)}
      >
        Dunkler
      </button>
      <button
        type="button"
        className="lm-knopf"
        aria-disabled={heller == null || hellerGesperrt || undefined}
        data-anschlag={heller == null || undefined}
        onClick={() => heller && stufeWechseln(heller, true)}
      >
        Heller{stufe === "dunkel" ? " (weiß)" : ""}
      </button>
    </div>
  );

  if (!einsatz) {
    const imPapierkorb = einsaetzePapierkorb().some((s) => s.id === einsatzId);
    // Auch hier läuft die Uhr weiter, damit ein Monitor ohne Daten nicht wie ein eingefrorener aussieht (R6-L6).
    const leer = uhrTeile(new Date(jetzt));
    return (
      <main className={`${klasse} lm-leer`}>
        <div className="lm-zeile lm-r1">
          {/* Im Papierkorb ist nichts verloren: Das Hauptfenster stellt ihn wieder her (R7-O3). */}
          {imPapierkorb
            ? "Dieser Einsatz liegt im Papierkorb (30 Tage) — im Hauptfenster wiederherstellen."
            : nichtLesbar
              ? "Die gespeicherten Sammlungen sind nicht lesbar und liegen beiseite — im Hauptfenster „Daten sichern…“."
              : "Dieser Einsatz ist auf diesem Gerät nicht (mehr) vorhanden."}
        </div>
        <div className="lm-zeile lm-dtg" aria-label="Uhrzeit und Datum">
          <div className="lm-dtg-text">
            <strong>{leer.zeit}</strong> <span>{leer.datum}</span>
          </div>
        </div>
        <button type="button" className="lm-knopf" onClick={schliessen}>Schließen</button>
      </main>
    );
  }

  const bild = lagebild(einsatz, jetzt);
  const s = bild.summen;
  const dtg = uhrTeile(new Date(jetzt));
  const bedarf = bedarfText(s);
  // Ohne gesetzten Beginn gilt die erste Meldung als Vorschlag, statt einen Fehler auf den Fernseher zu schreiben (R6-K4).
  const dauer = beginn != null ? dauerText(beginn, jetzt) : bild.ersteMeldung != null ? dauerText(bild.ersteMeldung, jetzt) : null;
  // Eine Aussage je Zeile: leer -> nur die Lagezeile sagt es (R7-K8); Zeiten in der Zukunft werden genannt statt verschwiegen (R7-K3).
  const dauerZeile: string | null =
    beginn != null
      ? dauer != null
        ? `seit Beginn: ${dauer}`
        : jetzt < beginn
          ? "Einsatz beginnt noch"
          : null
      : dauer != null
        ? `seit erster Meldung: ${dauer}`
        : bild.zeitenPruefen
          ? "Dauer unklar – Zeiten prüfen (Geräteuhr?)"
          : null;
  // R19-L1: Übungsmeldungen, die in dieser Lage nicht zählen, stehen in der Größe der Lagezeile da; „Noch nichts gemeldet" neben
  // „gerade eben eingetroffen" las sich als Widerspruch.
  const uebungTeil = bild.uebungenDaneben > 0 ? `${bild.uebungenDaneben} ${bild.uebungenDaneben === 1 ? "Übungsmeldung" : "Übungsmeldungen"} nicht gezählt` : "";
  const lage =
    s.einheiten === 0
      ? bild.abgerueckt > 0
        ? `Alle ${bild.abgerueckt} Einheiten abgerückt`
        : uebungTeil || "Noch nichts gemeldet"
      : // Jede Angabe bleibt ungeteilt („1 abgerückt" brach am Telefon in „… · 1" und „abgerückt", R17-K11); umbrochen wird nur bei „ · ".
        (
          <>
            <span className="lm-nb">{s.einheiten} {s.einheiten === 1 ? "Einheit" : "Einheiten"}</span>
            {" · "}
            <span className="lm-nb">{s.fahrzeuge} {s.fahrzeuge === 1 ? "Fahrzeug" : "Fahrzeuge"}</span>
            {bild.abgerueckt > 0 && (
              <>
                {" · "}
                <span className="lm-nb">{bild.abgerueckt} abgerückt</span>
              </>
            )}
            {uebungTeil && (
              <>
                {" · "}
                <span className="lm-nb">{uebungTeil}</span>
              </>
            )}
          </>
        );
  // Das Alter der anwesenden Einheiten, nicht nur der jüngsten Meldung: eine frische abgerückte Einheit
  // verdeckte sonst, dass die Stärke auf Meldungen von vor Stunden beruht (R11-K1).
  const alterAnwesende = bild.zeitenPruefen ? null : anwesendenAlterText(bild.anwesendenAlter, jetzt);
  // Nur der Teil „älteste Meldung …" trägt Warnfarbe und ⚠; eine frische letzte Meldung ist keine Warnung (R15-K4).
  const letzteAlt = bild.letzteMeldung != null && jetzt - bild.letzteMeldung >= VERALTET_MIN * 60_000;
  const datenstand = bild.zeitenPruefen
    ? "Meldezeiten liegen in der Zukunft – Zeiten prüfen (Geräteuhr?)"
    : bild.letzteMeldung != null
      ? `letzte Meldung ${alterText(bild.letzteMeldung, jetzt)}`
      : "";
  const veraltet = bild.zeitenPruefen || letzteAlt;
  const ortText = bild.ort?.trim() ? <span className="lm-ort"> · {bild.ort.trim()}</span> : null;
  const sichtbareBewegungen = bild.bewegungen.slice(0, bewegungenMax(window.innerWidth, window.innerHeight));
  const weitereBewegungen = bild.bewegungen.length - sichtbareBewegungen.length;

  return (
    <main className={klasse}>
      {/* Erste Zeile: eigener Funkrufname, optional — ohne ihn rückt der Einsatzname nach oben. */}
      {bild.uebung && <div className="lm-zeile lm-r2 lm-uebung" role="status">ÜBUNG – keine Echtlage</div>}
      {funkruf && <h1 className="lm-zeile lm-r1">{funkruf}</h1>}
      {funkruf ? (
        <div className="lm-zeile lm-r2">{einsatz.name}{ortText}</div>
      ) : (
        <h1 className="lm-zeile lm-r1">{einsatz.name}{ortText}</h1>
      )}
      <div className="lm-zeile lm-dtg" aria-label="Uhrzeit und Datum">
        <span className="lm-label lm-dtg-label">Uhrzeit · Datum</span>
        <div className="lm-dtg-text">
          <strong>{dtg.zeit}</strong> <span>{dtg.datum}</span>
        </div>
      </div>
      <div className="lm-zeile lm-r3" aria-label="Stärke Führer, Unterführer, Mannschaft, gesamt">
        {/* Reine Sollstärke steckt in der Gesamtstärke: der Vorbehalt gehört an die Zahl, die vorgelesen wird (R9-K1);
            er steht in der Beschriftung der Stärkezeile statt in einer eigenen Zeile, die Einheiten kostet (R10-K4). */}
        <span className="lm-label">
          Stärke Führer / Unterführer / Mannschaft = gesamt
          {bild.sollstaerke.einheiten > 0 && (
            <>
              {" · "}
              <span className="lm-label lm-veraltet lm-inline">davon {bild.sollstaerke.personen} Sollstärke (S), nicht gemeldet</span>
            </>
          )}
        </span>
        {s.staerke.fuehrer} / {s.staerke.unterfuehrer} / {s.staerke.mannschaft} = <u>{s.staerke.gesamt}</u>
      </div>
      {staleSeit != null && (
        <div className="lm-zeile lm-r3 lm-stand" role="alert">
          <span className="lm-label lm-veraltet">
            Sammlung nicht lesbar – letzter Stand von {new Date(staleSeit).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr; Hauptfenster: „Daten sichern…“
          </span>
        </div>
      )}
      <div className="lm-zeile lm-r3 lm-stand">
        {lage}
        {datenstand && (
          <span className={`lm-label${veraltet ? " lm-veraltet" : ""}`}>
            {datenstand}
            {/* R19-K11: Der Teil steht als eigene Zeile da (index.html); ein Trennpunkt am Zeilenanfang las sich als Rest eines Satzes. */}
            {alterAnwesende && <span className="lm-warnteil">⚠ {alterAnwesende}</span>}
          </span>
        )}
      </div>
      {/* Sofortbedarf wie in der Kopfzeile der Einsatzansicht; eine kleine Zeile, nur wenn etwas angefordert ist (R10-K5). */}
      {(dauerZeile || bedarf) && (
        <div className="lm-zeile lm-r2 lm-dauer">
          {dauerZeile}
          {dauerZeile && bedarf && <span className="lm-trenn"> · </span>}
          {bedarf && <span className="lm-bedarf">{bedarf}</span>}
        </div>
      )}
      {sichtbareBewegungen.length > 0 && (
        <div className="lm-zeile lm-bewegungen">
          {sichtbareBewegungen.map((b, i) => (
            <div key={b.id} className="lm-bewegung">
              {b.art}: {b.name}
              {b.detail ? ` – ${b.detail}` : ""} <span className="lm-label lm-inline">{alterText(b.zeit, jetzt)}</span>
              {/* Der Rest steht am Ende der letzten Zeile statt in einer eigenen: jede Zeile kostet eine Einheit in der Tabelle. */}
              {weitereBewegungen > 0 && i === sichtbareBewegungen.length - 1 && (
                <span className="lm-label lm-inline lm-weitere-bewegungen"> · + {weitereBewegungen} weitere {weitereBewegungen === 1 ? "Bewegung" : "Bewegungen"}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="lm-zeile lm-einheiten-block" aria-labelledby="lm-einheiten-titel">
        <h2 id="lm-einheiten-titel" className="lm-titel">Einheiten</h2>
        {bild.einheiten.length === 0 ? (
          <p className="lm-leer-hinweis">
            {bild.abgerueckt > 0 ? "Alle Einheiten sind abgerückt." : "Noch keine Einheit gemeldet."}
          </p>
        ) : (
          <EinheitenTabelle einheiten={bild.einheiten} />
        )}
      </section>

      <div className="lm-fuss">
      <details className="lm-zeile lm-klapp">
        <summary>Einsatzdaten</summary>
        <dl className="lm-daten">
          <dt>Art</dt><dd>{bild.art}{bild.ort ? ` · ${bild.ort}` : ""}</dd>
          <dt>Funkrufname</dt><dd>{funkruf ?? "nicht gesetzt (in der Einsatzansicht einstellen)"}</dd>
          <dt>Einsatzbeginn</dt>
          <dd>
            {beginn != null
              ? (() => { const b = uhrTeile(new Date(beginn)); return `${b.zeit} Uhr, ${b.datum}`; })()
              : "nicht gesetzt (in der Einsatzansicht einstellen)"}
          </dd>
          <dt>Einheiten</dt><dd>{s.einheiten}</dd>
          <dt>Fahrzeuge</dt><dd>{s.fahrzeuge}</dd>
        </dl>
      </details>

      {stufenleiste}
      <details className="lm-zeile lm-klapp">
        <summary>Optionen</summary>
        <div className="lm-optionen">
          <button type="button" className="lm-knopf" onClick={vollbild}>Vollbild</button>
          <button type="button" className="lm-knopf" onClick={schliessen}>Schließen</button>
        </div>
      </details>
      </div>
    </main>
  );
}

/**
 * Block in der Einsatzansicht: Beginn setzen und den Monitor öffnen. Sitzt dort,
 * wo gearbeitet wird; der Monitor selbst bleibt reine Anzeige.
 */
export function LagemonitorBlock({ einsatzId, alleIds }: { einsatzId: string; alleIds: readonly string[] }) {
  const [beginn, setBeginn] = useState<number | null>(() => einsatzbeginnLaden(einsatzId));
  const [fehler, setFehler] = useState(false);
  // Der Funkrufname meldet ein Scheitern des Speicherns wie der Beginn, mit eigenem Satz (R11-O5).
  const [funkrufFehler, setFunkrufFehler] = useState(false);
  const [funkruf, setFunkruf] = useState(() => einsatzFunkrufLaden(einsatzId) ?? "");

  function setzeFunkruf(text: string) {
    setFunkruf(text.slice(0, FUNKRUF_MAX));
    setFunkrufFehler(!einsatzFunkrufSetzen(einsatzId, text, alleIds));
  }

  function setze(ms: number | null) {
    const ok = einsatzbeginnSetzen(einsatzId, ms, alleIds);
    setFehler(!ok);
    if (ok) setBeginn(ms);
  }

  /** „Jetzt" ersetzt keinen eingetragenen Beginn ohne Rückfrage, die den alten Wert nennt (R11-D4). */
  async function setzeJetzt() {
    if (beginn != null) {
      const alt = uhrTeile(new Date(beginn));
      const ja = await frageJaNein({
        titel: "Einsatzbeginn überschreiben?",
        text: `Eingetragen ist ${alt.zeit} Uhr, ${alt.datum}. „Jetzt" ersetzt ihn durch die aktuelle Uhrzeit; der alte Beginn ist danach nicht mehr gespeichert.`,
        ok: "Durch jetzt ersetzen",
        abbruch: "Beginn behalten",
        gefahr: true,
        fokus: "abbruch",
      });
      if (!ja) return;
    }
    setze(Date.now());
  }

  /**
   * „Beginn entfernen" (und Leeren des Feldes) fragt wie „Jetzt" nach und nennt den Wert, der verloren ginge:
   * die genaue Alarmierungszeit lässt sich später nur schätzen (R13-D1).
   */
  async function entferneBeginn() {
    if (beginn == null) return;
    const alt = uhrTeile(new Date(beginn));
    const ja = await frageJaNein({
      titel: "Einsatzbeginn entfernen?",
      text: `Eingetragen ist ${alt.zeit} Uhr, ${alt.datum}. Der Beginn ist danach nicht mehr gespeichert, der Fernseher zeigt keine Dauer.`,
      ok: "Beginn entfernen",
      abbruch: "Beginn behalten",
      gefahr: true,
      fokus: "abbruch",
    });
    if (!ja) return;
    setze(null);
  }

  // R19-D2: Wird ein vorhandener Beginn im Feld überschrieben, bleibt der alte Wert mit Rückweg stehen.
  const [beginnWar, setBeginnWar] = useState<number | null>(null);

  function beginnGeaendert(wert: string) {
    const ms = ausEingabeWert(wert);
    if (ms == null && beginn != null) void entferneBeginn();
    else {
      if (ms != null && beginn != null && ms !== beginn) setBeginnWar((war) => war ?? beginn);
      setze(ms);
    }
  }

  function beginnZurueck() {
    if (beginnWar == null) return;
    const ok = einsatzbeginnSetzen(einsatzId, beginnWar, alleIds);
    setFehler(!ok);
    if (ok) {
      setBeginn(beginnWar);
      setBeginnWar(null);
    }
  }

  const hinweis = beginnHinweis(beginn, Date.now());
  const [offenAnfang] = useState(() => typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 30rem)").matches);

  return (
    // R19-M13, G8, S11: Am Telefon ein Aufklapper (der Block war 460 bis 650 px lang und stand zwischen Export und Übergabe); unter dem Block
    // bleibt ein Abstand zur Karte „Übergabe und Abschluss" (index.html).
    <details className="lm-block" open={offenAnfang}>
      <summary className="lm-block-titel"><strong>Lagemonitor für den Fernseher</strong></summary>
      <p className="hinweis">
        Zweites Fenster mit der Lage in großer Schrift, ohne Personennamen — auf den Fernseher ziehen (HDMI,
        erweiterter Bildschirm). Es aktualisiert sich von selbst, solange es auf diesem Gerät läuft. In der ersten
        Zeile steht der Funkrufname (wenn eingetragen), darunter der Name dieses Einsatzes.
      </p>
      <div className="vorlage-aktionen">
        <label>
          Funkrufname (optional){" "}
          <input
            type="text"
            value={funkruf}
            maxLength={FUNKRUF_MAX}
            placeholder="z. B. Salus Übungsleitung"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setzeFunkruf(e.target.value)}
          />
        </label>
      </div>
      {/* R12-N5: Zweck und Wirkung von Feld und Knöpfen stehen vor ihnen. */}
      <p className="hinweis lm-beginn-erklaerung">
        Der Fernseher zeigt die Dauer seit dem Einsatzbeginn („seit Beginn: 2 Stunden, 5 Minuten“). „Jetzt“ setzt den
        Beginn auf die aktuelle Uhrzeit, „Beginn entfernen“ nimmt ihn zurück — der Einsatz selbst bleibt unverändert.
      </p>
      <div className="vorlage-aktionen">
        <label>
          Einsatzbeginn{" "}
          <input
            type="datetime-local"
            value={beginn != null ? zuEingabeWert(beginn) : ""}
            onChange={(e) => beginnGeaendert(e.target.value)}
          />
        </label>{" "}
        <button type="button" onClick={() => void setzeJetzt()}>Jetzt</button>{" "}
        {beginn != null && <button type="button" onClick={() => void entferneBeginn()}>Beginn entfernen</button>}{" "}
        <button type="button" className="primaer" onClick={() => lagemonitorOeffnen(einsatzId)}>
          Lagemonitor öffnen
        </button>
      </div>
      {beginnWar != null && beginn != null && beginnWar !== beginn && (
        <p className="hinweis lm-beginn-war" role="status">
          Beginn war {uhrTeile(new Date(beginnWar)).zeit} Uhr, {uhrTeile(new Date(beginnWar)).datum}.{" "}
          <button type="button" className="link" onClick={beginnZurueck}>Alten Beginn zurückholen</button>
        </p>
      )}
      {hinweis && <p className="hinweis warnung-text lm-beginn-hinweis" role="status">{hinweis}</p>}
      {fehler && <p className="fehler" role="status">Der Beginn konnte nicht gespeichert werden (Speicher voll oder gesperrt).</p>}
      {funkrufFehler && (
        <p className="fehler" role="status">Der Funkrufname konnte nicht gespeichert werden (Speicher voll oder gesperrt) — der Lagemonitor zeigt ihn nicht.</p>
      )}
    </details>
  );
}
