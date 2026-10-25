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
} from "./lagemonitor-beginn";
import { alterText, ausEingabeWert, dauerText, dtgTeile, lagebild, zuEingabeWert, type EinheitZeile } from "./lagemonitor";

const URL_PARAMETER = "lagemonitor";
/** Gemerkte Helligkeitsstufe des Monitors („dunkel" oder „gedimmt"; „hell" wird nie gemerkt, R7-L3). */
export const STUFE_SCHLUESSEL = "eeb.lagestufe.v1";
/** Mehr Bewegungszeilen als das gibt es nicht im Bild; der Rest steht als „+ n weitere" (R7-K2). */
const BEWEGUNGEN_MAX = 3;
/** Schriftfaktoren der Einheitentabelle, bevor Zeilen entfallen (R8-L1). */
const SCHRIFT_STUFEN = [1, 0.95, 0.9, 0.85];
/** Ab diesem Alter der letzten Meldung wird der Datenstand abgesetzt (R7-K8). */
const VERALTET_MIN = 60;

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

/** Kennung aus der Adresse, wenn die Seite als Lagemonitor aufgerufen wurde. */
export function lagemonitorKennung(suche: string = window.location.search): string | null {
  const id = new URLSearchParams(suche).get(URL_PARAMETER);
  return id ? id : null;
}

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
        <thead>
          <tr>
            <th className="lm-orga">Orga</th><th>Ort</th><th><span className="lm-lang">Funkrufname</span><span className="lm-kurz">Funkruf</span></th><th className="lm-typ">Einheitentyp</th>
            <th className="lm-zahl" title="Führer">F</th>
            <th className="lm-zahl" title="Unterführer">U</th>
            <th className="lm-zahl" title="Mannschaft">M</th>
          </tr>
        </thead>
        <tbody>
          {einheiten.map((e) => (
            <tr key={e.id}>
              <td className="lm-orga">{e.orga}</td>
              <td>{e.ort || "–"}</td>
              <td>{e.funkruf || "–"}</td>
              <td className="lm-typ">{e.typ || "–"}</td>
              <td className="lm-zahl">{e.fuehrer}</td>
              <td className="lm-zahl">{e.unterfuehrer}</td>
              <td className="lm-zahl">{e.mannschaft}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lm-weitere" ref={hinweisEl} style={weitere === 0 ? { display: "none" } : undefined}>
        + {Math.max(weitere, 1)} weitere {weitere <= 1 ? "Einheit" : "Einheiten"} · zuletzt gemeldet zuerst
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
  const einsatz = einsaetzeLaden().find((s) => s.id === einsatzId);
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
  function stufeWechseln(neu: Stufe) {
    setStufe(neu);
    stufeMerken(neu);
  }

  if (!einsatz) {
    const imPapierkorb = einsaetzePapierkorb().some((s) => s.id === einsatzId);
    // Auch hier läuft die Uhr weiter, damit ein Monitor ohne Daten nicht wie ein eingefrorener aussieht (R6-L6).
    const leer = dtgTeile(new Date(jetzt));
    return (
      <main className={`${klasse} lm-leer`}>
        <div className="lm-zeile lm-r1">
          {/* Im Papierkorb ist nichts verloren: Das Hauptfenster stellt ihn wieder her (R7-O3). */}
          {imPapierkorb
            ? "Dieser Einsatz liegt im Papierkorb (30 Tage) — im Hauptfenster wiederherstellen."
            : "Dieser Einsatz ist auf diesem Gerät nicht (mehr) vorhanden."}
        </div>
        <div className="lm-zeile lm-dtg" aria-label="Datum-Zeit-Gruppe">
          <div className="lm-dtg-text">
            <span>{leer.tag}</span> <strong>{leer.zeit}</strong> <span>{leer.monat}</span> <span>{leer.jahr}</span>
          </div>
        </div>
        <button type="button" className="lm-knopf" onClick={schliessen}>Schließen</button>
      </main>
    );
  }

  const bild = lagebild(einsatz, jetzt);
  const s = bild.summen;
  const dtg = dtgTeile(new Date(jetzt));
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
  const lage =
    s.einheiten === 0
      ? bild.abgerueckt > 0
        ? `Alle ${bild.abgerueckt} Einheiten abgerückt`
        : "Noch nichts gemeldet"
      : `${s.einheiten} ${s.einheiten === 1 ? "Einheit" : "Einheiten"} · ${s.fahrzeuge} ${s.fahrzeuge === 1 ? "Fahrzeug" : "Fahrzeuge"}${bild.abgerueckt > 0 ? ` · ${bild.abgerueckt} abgerückt` : ""}`;
  const datenstand = bild.zeitenPruefen
    ? "Meldezeiten liegen in der Zukunft – Zeiten prüfen (Geräteuhr?)"
    : bild.letzteMeldung != null
      ? `letzte Meldung ${alterText(bild.letzteMeldung, jetzt)}`
      : "";
  const veraltet = bild.zeitenPruefen || (bild.letzteMeldung != null && jetzt - bild.letzteMeldung >= VERALTET_MIN * 60_000);
  const ortText = bild.ort?.trim() ? <span className="lm-ort"> · {bild.ort.trim()}</span> : null;
  const sichtbareBewegungen = bild.bewegungen.slice(0, BEWEGUNGEN_MAX);
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
      <div className="lm-zeile lm-dtg" aria-label="Datum-Zeit-Gruppe">
        <span className="lm-label lm-dtg-label">Uhr</span>
        <div className="lm-dtg-text">
          <span>{dtg.tag}</span> <strong>{dtg.zeit}</strong> <span>{dtg.monat}</span> <span>{dtg.jahr}</span>
        </div>
      </div>
      <div className="lm-zeile lm-r3" aria-label="Stärke Führer, Unterführer, Mannschaft, gesamt">
        <span className="lm-label">Stärke F / U / M // gesamt</span>
        {s.staerke.fuehrer} / {s.staerke.unterfuehrer} / {s.staerke.mannschaft} // <u>{s.staerke.gesamt}</u>
      </div>
      <div className="lm-zeile lm-r3 lm-stand">
        {lage}
        {datenstand && <span className={`lm-label${veraltet ? " lm-veraltet" : ""}`}>{datenstand}</span>}
      </div>
      {dauerZeile && <div className="lm-zeile lm-r2 lm-dauer">{dauerZeile}</div>}
      {sichtbareBewegungen.length > 0 && (
        <div className="lm-zeile lm-bewegungen">
          {sichtbareBewegungen.map((b) => (
            <div key={b.id} className="lm-bewegung">
              {b.art}: {b.name}
              {b.detail ? ` – ${b.detail}` : ""} <span className="lm-label lm-inline">{alterText(b.zeit, jetzt)}</span>
            </div>
          ))}
          {weitereBewegungen > 0 && (
            <div className="lm-bewegung lm-weitere-bewegungen">
              + {weitereBewegungen} weitere {weitereBewegungen === 1 ? "Bewegung" : "Bewegungen"}
            </div>
          )}
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
              ? (() => { const b = dtgTeile(new Date(beginn)); return `${b.tag} ${b.zeit} ${b.monat} ${b.jahr}`; })()
              : "nicht gesetzt (in der Einsatzansicht einstellen)"}
          </dd>
          <dt>Einheiten</dt><dd>{s.einheiten}</dd>
          <dt>Fahrzeuge</dt><dd>{s.fahrzeuge}</dd>
        </dl>
      </details>

      <details className="lm-zeile lm-klapp">
        <summary>Optionen</summary>
        <div className="lm-optionen">
          {heller && (
            <button type="button" className="lm-knopf" onClick={() => stufeWechseln(heller)}>
              Stufe: {STUFEN_NAME[stufe]} · heller: {STUFEN_NAME[heller]}
            </button>
          )}
          {dunkler && (
            <button type="button" className="lm-knopf" onClick={() => stufeWechseln(dunkler)}>
              {heller ? "" : `Stufe: ${STUFEN_NAME[stufe]} · `}dunkler: {STUFEN_NAME[dunkler]}
            </button>
          )}
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
  const [funkruf, setFunkruf] = useState(() => einsatzFunkrufLaden(einsatzId) ?? "");

  function setzeFunkruf(text: string) {
    setFunkruf(text.slice(0, FUNKRUF_MAX));
    setFehler(!einsatzFunkrufSetzen(einsatzId, text, alleIds));
  }

  function setze(ms: number | null) {
    const ok = einsatzbeginnSetzen(einsatzId, ms, alleIds);
    setFehler(!ok);
    if (ok) setBeginn(ms);
  }

  return (
    <div className="lm-block">
      <p className="lm-block-titel"><strong>Lagemonitor für den Fernseher</strong></p>
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
            onChange={(e) => setzeFunkruf(e.target.value)}
          />
        </label>
      </div>
      <div className="vorlage-aktionen">
        <label>
          Einsatzbeginn{" "}
          <input
            type="datetime-local"
            value={beginn != null ? zuEingabeWert(beginn) : ""}
            onChange={(e) => setze(ausEingabeWert(e.target.value))}
          />
        </label>{" "}
        <button type="button" onClick={() => setze(Date.now())}>Jetzt</button>{" "}
        {beginn != null && <button type="button" onClick={() => setze(null)}>Löschen</button>}{" "}
        <button type="button" className="primaer" onClick={() => lagemonitorOeffnen(einsatzId)}>
          Lagemonitor öffnen
        </button>
      </div>
      {fehler && <p className="fehler" role="status">Der Beginn konnte nicht gespeichert werden (Speicher voll oder gesperrt).</p>}
    </div>
  );
}
