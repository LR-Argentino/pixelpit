# Design: Playwright-E2E-Tests für Konto erstellen

## Umfang

Die Tests decken den vorhandenen UI-Stand des Registrierungsformulars ab. Die Anwendungslogik und die Backend-Anbindung werden nicht verändert.

## Teststruktur

- `frontend/e2e/pages/konto-erstellen-page.ts`: Page Object mit Locators aus den bestehenden `data-testid`-Attributen und deutsch benannten Nutzeraktionen.
- `frontend/e2e/fixture/fixture.ts`: Registrierung von `kontoErstellenPage` in der bestehenden Fixture.
- `frontend/e2e/specs/konto-erstellen.spec.ts`: getrennte Tests für Benutzername, E-Mail, Passwort, Passwortbestätigung sowie einen gültigen Formularzustand.

## Abdeckung

- Pflichtfeld- und Formatfehler werden nach dem Verlassen eines Feldes geprüft.
- Ein gültiger Benutzername wird ohne Fehlermeldung akzeptiert.
- Ein gültiges vollständiges Formular aktiviert den Submit-Button.
- Die Fixture verwendet absichtlich `page.goto('')` mit TODO; die Ziel-URL wird gemäß den Projektregeln nicht aus der Anwendung abgeleitet.

## Bewusste Grenze

Ein erfolgreicher Backend-Submit und ein sichtbarer Erfolgszustand werden nicht geprüft, weil das Formular aktuell keinen Frontend-Request ausführt und keinen Erfolgsstatus rendert.
