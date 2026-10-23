# Tasks

Nur Frontend. Alle Befehle laufen im Ordner `frontend/`. Jede Aufgabe endet mit grünem `npm test` und fehlerfreiem `ng build`.

Für Frontend-Code vorher Angular MCP (`get_best_practices`) und Angular Skill nutzen. Dafür Claude Code im Repo-Wurzelverzeichnis oder in `frontend/` starten (Design, Context).

Test zuerst: Neue Bausteine bekommen eine Vitest-Spec, bevor sie umgesetzt werden. Beim Verschieben vorhandenen Codes sind die bestehenden Specs das Sicherheitsnetz.

Unveränderte `data-testid`: Vor und nach jeder Template-Änderung `grep -rho 'data-testid="[^"]*"' src/app | sort` vergleichen. Die Menge muss gleich bleiben (Design, Risiken).

Aufgaben mit dem Vermerk **(selbst)** setzt der Tester um. Claude gibt dabei nur Hinweise, wo und wie anzufangen ist.

## 1. Frontend – Formular-Helfer und Service

- [x] 1.1 Vitest `shared/forms/validators.spec.ts` für `requiredTrimmed` (nur Leerzeichen → Fehler) und `codePointLength` (zum Beispiel „🎮🎮🎮🎮“ bei min 5 → „Mindestens 5 Zeichen“, 20.001 → „Höchstens 20.000 Zeichen“) schreiben und rot sehen. Danach beide Funktionen aus `features/new-thread/new-thread.ts` nach `shared/forms/validators.ts` verschieben, Importe in `new-thread.ts` und `reply-form.ts` anpassen und alles grün sehen. Prüfen, dass `grep -r "new-thread/new-thread" src/app/features/thread-detail` nichts findet.
- [x] 1.2 Vitest `shared/forms/problem-detail.spec.ts` für `problemDetailErrors` schreiben und rot sehen. Abzudecken sind: 400 mit `errors` (Feldfehler am richtigen `fieldTree`), 401 mit eingeschalteter Option (`sessionExpired`), 401 ohne Option (Fallback) und 500 (Fallback-Text). Dann umsetzen (Design, Entscheidung 1) und grün sehen.
- [x] 1.3 `toServerErrors` in `new-thread.ts` und `reply-form.ts` durch `problemDetailErrors` ersetzen, die 404 bleibt in `reply-form` als Sonderfall. Die bestehenden Fehler-Tests in `new-thread.spec.ts` und `reply-form.spec.ts` müssen unverändert grün sein.
- [ ] 1.4 `toServerErrors` in `register.ts` (409 und Passwort-Abweichung bleiben als Sonderfälle) und `login.ts` (401 bleibt „falsche Zugangsdaten“) auf `problemDetailErrors` umstellen. `register.spec.ts` und `login.spec.ts` bleiben unverändert grün.
- [x] 1.5 `AuthService.register` auf `Promise<void>` umstellen und `firstValueFrom` aus `register.ts` entfernen. `auth-service.spec.ts` an den neuen Rückgabetyp anpassen und grün sehen.
- [x] 1.6 `Tag.toneClass()` in ein `computed` umbauen und `npm run prettier:fix` ausführen (behebt `=computed` in `new-thread.ts`). `tag.spec.ts` bleibt grün.

## 2. Frontend – UI-Bausteine

- [x] 2.1 Vitest `shared/ui/input/input.spec.ts` schreiben: Die Direktive setzt die Basisklassen an `input` und `textarea`, und eigene Klassen am Element bleiben erhalten. Rot sehen, dann `appInput` nach dem Muster von `appButton` mit Tokens (`bg-ink-650`, `focus:border-ink-400`, `placeholder:text-ink-200`) umsetzen und grün sehen (Design, Entscheidung 2).
- [x] 2.2 Alle Eingabefelder in `login.html`, `register.html`, `new-thread.html` und `reply-form.html` auf `appInput` umstellen und dabei den langen `class`-String entfernen. Die `data-testid`-Menge bleibt gleich, alle Specs grün.
- [x] 2.3 Vitest `shared/ui/field-errors/field-errors.spec.ts` schreiben: Bei `show` = false ist nichts sichtbar. Bei `show` = true erscheint je Fehler eine Meldung mit dem übergebenen `testId`. Der Container trägt die übergebene `errorId`. Rot sehen, dann umsetzen (Design, Entscheidung 3) und grün sehen.
- [x] 2.4 Die Fehlerblöcke in den vier Formularen durch `<app-field-errors>` ersetzen. Login übergibt `submitted() && …`, alle anderen `touched()`. Jedes Feld bekommt `aria-describedby` mit Hinweis- und Fehler-`id`. Die bestehenden Fehler-Tests der vier Formulare bleiben grün.
- [x] 2.5 Vitest `shared/ui/pagination/pagination.spec.ts` schreiben und rot sehen. Abzudecken sind:
  - Seite 1 von 1 zeigt keine Navigation.
  - Seite 1 von 3 zeigt nur „weiter“ mit `seite=2`.
  - Seite 2 zeigt „zurück“ ohne `seite`.
  - Die `data-testid` werden aus Präfix und Rollen gebildet.

  Danach umsetzen (Design, Entscheidung 4) und grün sehen.
- [x] 2.6 `<app-pagination>` in `thread-list.html` (`queryParamsHandling="merge"`, Fragment `threads`) und `post-list.html` (Fragment `beitraege`) einsetzen und die `computed`-Signale für das Blättern aus beiden Komponenten entfernen. Die Blätter-Tests in `thread-list.spec.ts`, `post-list.spec.ts`, `home.spec.ts` und `thread-detail.spec.ts` bleiben grün.

## 3. Frontend – Struktur

- [x] 3.1 Vitest `layout/shell/shell.spec.ts` schreiben: Die Shell zeigt `app-sidebar` und ein `router-outlet` innerhalb von `<main>`. Rot sehen, dann `layout/shell/` umsetzen (Design, Entscheidung 5) und grün sehen.
- [ ] 3.2 `app.routes.ts` auf die Eltern-Route mit `Shell` umstellen, Auth-Routen ohne Shell. Gerüst und `<app-sidebar />` aus `home.html`, `new-thread.html` und `thread-detail.html` entfernen. Die Sidebar-Erwartungen in `home.spec.ts` (Z. 68 ff.) und `thread-detail.spec.ts` (Z. 203) entfernen, weil `shell.spec.ts` sie übernimmt. In `app.routes.spec.ts` prüfen, dass `/`, `/threads/neu` und `/threads/7` unter der Shell liegen und `/anmelden` nicht. Alles grün sehen und im Dev-Server die Anker `/#threads` und `/threads/<id>#beitrag-<id>` manuell prüfen.
- [x] 3.3 `core/auth/{auth,login,register}` samt Specs, CSS und Templates nach `features/auth/` verschieben, Importe und `loadComponent` in `app.routes.ts` anpassen. Prüfen, dass `core/auth/` nur noch `auth-service*` und `model/` enthält und alle Specs grün sind.
- [ ] 3.4 **(selbst)** `toPageNumber` und `toThreadId` samt ihrer Specs nach `core/routing/route-params.ts` verschieben. In `Home` und `ThreadDetail` dann `seite` und `id` auf `input(…, { transform })` umstellen und die `computed`-Signale `page`/`threadId` entfernen (Design, Entscheidung 6). `home.spec.ts` und `thread-detail.spec.ts` bleiben ohne Änderung an `setInput` grün.

## 4. Frontend – Aufräumen und Barrierefreiheit

- [x] 4.1 In `ThreadDetail` die `inject`-Felder (`router`, `document`, `fragment`) vor die Methoden ziehen und `this.threadId()!` durch eine frühe Rückkehr bei `null` ersetzen. Die Tests zu „neuer Beitrag“ in `thread-detail.spec.ts` bleiben grün.
- [ ] 4.2 In `auth.html` aus `<a href="/">` einen `routerLink="/"` machen, beide Bilder auf `NgOptimizedImage` umstellen (mit `width`/`height`) und die drei Inline-SVGs durch `app-icon` ersetzen, fehlende Icons in `icons.ts` ergänzen. `auth.spec.ts` bleibt grün, im Dev-Server ohne Konsolenwarnung von `NgOptimizedImage` prüfen.
- [x] 4.3 `novalidate` an das Formular in `register.html` setzen. `register.spec.ts` bleibt grün.
- [x] 4.4 Restliche Hex-Farben in `auth.html`, `login.html`, `register.html`, `new-thread.html` und `reply-form.html` durch `@theme`-Tokens ersetzen. Fehlertexte einheitlich `text-danger` statt `text-red-500`/`#e0483c`, fehlende Grautöne (`#6f726f`) als Token in `styles.css` ergänzen. Prüfen, dass `grep -rn "#[0-9a-fA-F]\{6\}\|red-500" src/app --include=*.html` nichts mehr findet.
- [ ] 4.5 Abschlusslauf: `npm test` und `ng build` sind grün, `data-testid`-Menge gegenüber `master` unverändert. Im Dev-Server Startseite, Blättern, Thread-Detail, Antworten, Neuer Thread, Login und Registrierung einmal durchklicken.

## Workflow follow-up

- E2E (Tester): Die bestehenden Playwright-Tests mit `npm run e2e` laufen lassen. Weil sich keine Texte und keine `data-testid` ändern, sollten sie ohne Anpassung grün sein.
- Beim Archivieren prüfen, ob `frontend/CLAUDE.md` die neuen Bausteine (`appInput`, `app-field-errors`, `app-pagination`, Shell-Route) erwähnen sollte.
- Offene Fragen aus proposal.md (einheitliche Fehler- und Sperr-Regel, Umbenennen abweichender `data-testid`) als eigene Changes aufnehmen.
