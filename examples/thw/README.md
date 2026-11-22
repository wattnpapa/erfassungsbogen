# Beispiel-Erfassungsbögen THW

In [`ortsverbaende/`](ortsverbaende/README.md) liegen alle Einheiten aller
Ortsverbände als Übungsbögen, gegliedert nach Landesverband › Regionalstelle ›
Ortsverband (`npm run beispiele:thw-ov`).

Direkt in diesem Ordner liegt nur ein bewusst übergroßer Stress-Test-Bogen, der
die QR-Segmentierung auslöst (Sammel-Scan zum Ausprobieren). Neu erzeugen mit:
`npm run beispiele` (deterministisch, fester Zufalls-Seed). Die früheren 100
zufällig gewählten Beispiel-Einheiten sind seit 11/2026 entfallen.

| Datei | Einheit | OV | Landesverband | Stärke | Fz | Abweichung |
|---|---|---|---|---|---|---|
| grossbogen-verstaerkter-bergungszug | Verstärkter Bergungszug | Oldenburg (NI) | Bremen, Niedersachsen | 1/9/28/38 | 10 | Großbogen (Stress-Test QR-Segmentierung) |
