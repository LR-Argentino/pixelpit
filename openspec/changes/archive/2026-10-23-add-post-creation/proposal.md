# Proposal

## Why

Besucher können Threads lesen und angemeldete Nutzer können neue Threads eröffnen, aber niemand kann auf einen bestehenden Thread antworten. Ohne Antworten gibt es keine Diskussion. Diese User Story („Als Nutzer möchte ich einen Beitrag in einem Thread verfassen, damit ich mich an der Diskussion beteiligen kann.“) schließt die Lücke zwischen Lesen und Eröffnen.

## What Changes

- Neuer REST-Endpunkt, über den angemeldete Nutzer (USER, MODERATOR, ADMIN) einen Beitrag mit reinem Text (1–20.000 Zeichen, Leerzeichen am Rand werden entfernt) an einen sichtbaren Thread anhängen. Die Antwort enthält nur die ID des neuen Beitrags.
- Gäste werden abgewiesen. Unbekannte oder gelöschte Threads führen zu „Thread nicht gefunden“, ungültige Eingaben zu Fehlern je Feld.
- Die Thread-Detailseite bekommt unter den Beiträgen ein Antwortformular für angemeldete Nutzer. Gäste sehen stattdessen den Hinweis „Antworten — nur für angemeldete Mitglieder“ mit dem Link „Anmelden“.
- Nach dem Absenden springt die Detailseite zur letzten Seite und dort zum neuen Beitrag. Dafür bekommt jeder Beitrag eine eigene Sprungadresse (`#beitrag-<id>`).
- Schlägt das Senden fehl, bleibt der eingegebene Text erhalten und der Fehler erscheint am Formular.

## Capabilities

### New Capabilities
- `post-creation`: Angemeldete Nutzer verfassen einen Beitrag in einem bestehenden Thread: Berechtigung, Prüfung des Textes, Fehlerfälle sowie das Antwortformular auf der Detailseite und wohin der Nutzer nach dem Absenden gelangt.

### Modified Capabilities
- `thread-detail`: Jeder Beitrag auf der Detailseite ist über eine eigene Adresse `#beitrag-<id>` direkt anspringbar.

## Nicht im Umfang

- Anhänge an Beiträgen (eigene User Story, folgt später)
- Markdown-Vorschau im Formular. Bisher hat auch „Neuen Thread erstellen“ keine Vorschau; eine Vorschau sollte später für beide Formulare gemeinsam kommen.
- Beiträge bearbeiten, löschen oder zitieren
- Geschlossene oder gesperrte Threads. Das Datenmodell kennt diesen Zustand nicht.
- Benachrichtigungen an den Thread-Ersteller oder andere Teilnehmer
- Schutz vor Spam oder Flooding (Rate Limiting)

## Offene Fragen

- Für den Umfang wurden folgende Standards angenommen, die noch nicht ausdrücklich bestätigt sind: Das Formular erscheint auf jeder Seite des Threads (nicht nur auf der letzten), der Gast-Hinweis lautet „Antworten — nur für angemeldete Mitglieder“, und es gibt keine Markdown-Vorschau.

## Impact

- **Betroffene Module: beide (backend und frontend).**
- Backend, Modul `threads`: neuer Endpunkt `POST /api/threads/{id}/posts`, neuer Request- und Response-Record, neue Methode im Service, Factory für Antwortbeiträge. Keine Schemaänderung, denn die Tabelle `posts` deckt alles ab. Keine neuen Events, keine neuen Abhängigkeiten zwischen Modulen (Profil-ID weiterhin über `ProfileLookUp`).
- Frontend: Antwortformular auf der Thread-Detailseite, neue Methode in `ForumService`, Sprungadresse an `post-item`, `data-testid` für die Playwright-Tests. Die E2E-Tests selbst schreibt der Nutzer außerhalb dieses Changes.
- Bestehende Endpunkte und Clients bleiben unverändert.
