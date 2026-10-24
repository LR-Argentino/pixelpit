# Proposal

## Why

Im Kontobereich der Sidebar ist „Mein Profil“ als weißer Primary-Button das auffälligste Element der ganzen Navigation, obwohl es nur ein Navigationslink ist. Darunter steht „Abmelden“ als zweiter umrandeter Button, sodass beide wie ein Bestätigungsdialog um Aufmerksamkeit konkurrieren. Die visuelle Gewichtung soll zur Wichtigkeit der Aktionen passen.

## What Changes

- „Mein Profil“ in der Sidebar wird von der Variante `primary` auf `secondary` herabgestuft (umrandet, transparent).
- „Abmelden“ in der Sidebar wird von `secondary` auf `ghost` herabgestuft (ohne Rahmen, gedämpfter Text, beim Hover weiß).
- Der Gast-Zustand bleibt unverändert: „Anmelden“ bleibt `primary`, weil es dort die Hauptaktion ist.
- Die Variante `primary` wird app-weit von Weiß auf einen goldenen Tint-Stil umgestellt (goldener Rahmen und Text auf 12 % Gold-Hintergrund, beim Hover voll gold mit schwarzem Text; Vorbild ist der Löschen-Button im Admin-Design), damit Hauptaktionen als Akzent erkennbar sind statt als neutrales Weiß.
- Ziele, Texte und `data-testid` der Buttons bleiben gleich.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

Keine. Die Anforderung aus `user-profile` („Die Sidebar SHALL angemeldeten Nutzern einen Link zur Profilseite anzeigen“) bleibt erfüllt; es ändert sich nur die Darstellung, kein Verhalten. Der Change setzt deshalb `skip_specs: true`.

## Nicht im Umfang

- Farbänderungen an den Varianten `secondary`, `ghost` und `danger`.
- Handgestylte weiße Elemente außerhalb der Button-Directive (z. B. in Login, Registrierung, Auth-Seite), die nicht `appButton` mit `primary` nutzen.
- Ein Umbau des Kontobereichs, z. B. mit Avatar und klickbarem Benutzernamen statt eines Profil-Buttons.
- Andere Buttons außerhalb der Sidebar, z. B. „Abmelden“ auf der Auth-Seite.

## Offene Fragen

- Ist „Abmelden“ als Ghost-Button nach dem Ausprobieren noch gut genug auffindbar? Falls nicht, bleibt es bei `secondary` und nur „Mein Profil“ wird herabgestuft.

## Impact

- Betroffenes Modul: **frontend** (Backend ist nicht betroffen).
- Dateien: `frontend/src/app/layout/sidebar/sidebar.html`, `frontend/src/app/shared/ui/button/button.ts` (betrifft alle Primary-Buttons der App), `frontend/src/styles.css` (Kommentar zum Gold-Token).
- Keine API-, Daten- oder Abhängigkeitsänderungen.
