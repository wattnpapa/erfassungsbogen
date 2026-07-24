// Beispieldaten dürfen keine echten Telefonnummern enthalten. Diese Funktion
// bildet jede Nummer deterministisch auf eine erkennbar unechte Nummer ab, die
// – wie in amerikanischen Filmen – mit 555 beginnt (555 ist kein gültiger
// deutscher Vorwahl-/Netzbeginn, also sofort als Platzhalter erkennbar).
//
// Deterministisch und nur von den Ziffern der Eingabe abhängig: gleiche
// Ausgangsnummer → gleiche Fake-Nummer. So bleiben die Nummern über die
// verschiedenen Ebenen hinweg unterschiedlich, ohne den Zufallsstrom der
// Generatoren zu verschieben (die echte Nummer wird weiterhin erzeugt und erst
// hier ersetzt).
export function fakeTelefon(nummer: string | undefined): string {
  const ziffern = (nummer ?? "").replace(/\D/g, "");
  if (!ziffern) return "";
  // FNV-1a (32 Bit) über die Ziffern.
  let h = 0x811c9dc5;
  for (const z of ziffern) {
    h ^= z.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `555${String(h % 10_000_000).padStart(7, "0")}`;
}
