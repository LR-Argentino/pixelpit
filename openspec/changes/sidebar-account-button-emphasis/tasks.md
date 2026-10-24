# Tasks

## 1. Frontend

- [x] 1.1 Test zuerst: In `frontend/src/app/layout/sidebar/sidebar.spec.ts` prüfen, dass für angemeldete Nutzer `sidebar-profile-link` im Secondary-Stil und `sidebar-logout-button` im Ghost-Stil dargestellt wird (z. B. über die Varianten-Klassen `border-ink-400` bzw. `border-transparent`/`text-ink-100`); `npm test` zeigt den neuen Test als fehlschlagend
- [x] 1.2 In `frontend/src/app/layout/sidebar/sidebar.html` „Mein Profil“ auf `variant="secondary"` und „Abmelden“ auf `variant="ghost"` umstellen; der Gast-Button „Anmelden“ bleibt `primary`; verifiziert durch grünes `npm test`
- [ ] 1.3 Im Dev-Server (http://localhost:4200) angemeldet und als Gast die Sidebar ansehen, auch in mobiler Breite: „Mein Profil“ ist umrandet, „Abmelden“ ohne Rahmen und wird beim Hover weiß, „Anmelden“ ist für Gäste weiterhin weiß; bestätigt die offene Frage aus proposal.md, ob „Abmelden“ auffindbar genug ist

## 2. Frontend – Primary in Gold

- [x] 2.1 Test zuerst: In `frontend/src/app/shared/ui/button/button.spec.ts` erwartet der Standard-Varianten-Test `bg-gold/12` und `text-gold` statt `bg-white`; der Test schlägt vor der Umsetzung fehl
- [x] 2.2 In `frontend/src/app/shared/ui/button/button.ts` die Variante `primary` auf `border-gold bg-gold/12 text-gold hover:bg-gold hover:text-black` (plus Disabled-Reset) umstellen und den Gold-Kommentar in `frontend/src/styles.css` anpassen; verifiziert durch grünes `npm test`
- [ ] 2.3 Im Dev-Server alle Seiten mit Primary-Buttons ansehen (z. B. Gast-„Anmelden“ in der Sidebar, Thread erstellen, Formulare): goldener Text auf Gold-Tint ist lesbar, beim Hover füllt sich der Button gold mit schwarzem Text, und Gold-Zweitaktionen wie „Konto erstellen“ sind noch von Primary unterscheidbar
