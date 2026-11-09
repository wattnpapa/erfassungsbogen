/**
 * Alter der Angaben einer Meldung (R14-K1).
 *
 * „Meldung vor 5 Min" maß bisher das Eintreffen am Gerät. Ein Bogen, den die Einheit gestern Abend erstellt hat und
 * der heute früh gescannt oder per Datei übergeben wird, galt damit als „gerade eben" — die Zahlen darin sind aber
 * vierzehn Stunden alt. Alle Altersmarken (Kopf, Karte, Tabelle, Filter, Monitor, Lageblatt) rechnen deshalb ab dem
 * früheren von beiden: dem Stand im Bogen oder dem Eingang. Ein Stand nach dem Eingang (falsche Geräteuhr, eigene
 * Warnung) verlängert nichts.
 */


/**
 * Alter der Angaben bei einer Fassung, die am Meldekopf von Hand entstand („Stärke ändern…", „Als Einsatzmeldung
 * zählen…", R17-K1): Die Handänderung ändert den Eintrag, nicht den Zeitpunkt, zu dem die Einheit zuletzt gemeldet hat.
 * Ohne diese Angabe stünde eine hundert Tage alte Meldung danach als „gerade eben" da, und das ⚠ „älter als 1 Std"
 * entfiele. Wie `ersetztDurch` ein optionales Feld am Eintrag, kein Schemawechsel.
 */
export interface AngabenSeit {
  /** Zeit, ab der die Angaben der Vorgängerin galten (ms). */
  seit: number;
  /** „Stand" oder „Meldung" der Vorgängerin. */
  wort: "Stand" | "Meldung";
  /** Nur die Kennzeichnung (Übung/Einsatz) wurde umgestellt: keine Folgemeldung mit neuem Inhalt. */
  kennzeichnung?: boolean;
  /** Der Ort der Einheit wurde am Meldekopf geändert (R20-H1); `kennzeichnung` ist dann ebenfalls gesetzt. */
  name?: boolean;
  /** Wann am Meldekopf geändert wurde (ms). */
  geaendertAm: number;
}

declare module "@bos/meldekopf/einsaetze" {
  interface MeldeEintrag {
    angaben?: AngabenSeit;
  }
}







