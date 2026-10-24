# Design

## Context

Motivation und Umfang stehen in `proposal.md`, das Verhalten in `specs/thread-editing` und `specs/post-editing`.

Ausgangslage im Code:

- Alles gehört zum Modulith-Modul **`threads`** (`org.pixelpit.backend.threads`). `ForumThreadManagement` ist die öffentliche Service-API, Entities und Repositories liegen in `internal`, REST in `web`.
- `ForumThread` und `Post` haben bereits die Felder `updatedAt`, `deletedAt` und `deletedBy`, aber nur Factory-Methoden und keine Methoden zum Ändern. Eine Schemaänderung ist **nicht** nötig.
- Die Regel „Thread ist sichtbar“ steht an genau einer Stelle (`ForumThreadRepository.VISIBLE`). Ein Thread ist gelöscht, wenn `t.deletedAt` gesetzt ist oder sein Eröffnungspost (kleinste Post-ID) gelöscht ist.
- `PostView.editedAt` kommt aus `Post.updatedAt`. Die Lese-API zeigt Bearbeitungen also schon an.
- Der Besitz wird über die **Profil-ID** geprüft (`createdBy`). Den Account des angemeldeten Nutzers bildet `ProfileLookUp.findProfileIdByAccountId` auf sein Profil ab, wie schon in `createThread`/`createPost`.
- Frontend: `ThreadDetail` lädt Kopf (`thread`) und Beiträge (`posts`) als `httpResource`. `PostItem` ist rein darstellend. Die Kategorie-Auswahl steckt fest verbaut in `new-thread.html`. Validatoren (`requiredTrimmed`, `codePointLength`) und `problemDetailErrors` liegen schon in `shared/forms`.

## Goals / Non-Goals

**Goals:**
- Vier neue Schreibpfade im Modul `threads`, alle mit derselben Reihenfolge der Prüfungen und derselben Sperre
- Race-Conditions zwischen Antworten und Bearbeiten/Löschen ausschließen, und zwar über die Datenbank, nicht im Anwendungsspeicher
- Die Kategorie-Auswahl wird einmal gebaut und in „Neuer Thread“ und „Thread bearbeiten“ verwendet

**Non-Goals:**
- Keine neuen Events. Kein anderes Modul muss vom Bearbeiten oder Löschen erfahren, und die Profil-Zähler lesen ohnehin live aus `threads`.
- Keine Änderung an den Lese-Endpunkten und ihren Antworten
- Keine optimistische Versionierung (`@Version`)

## Decisions

### 1. REST-Endpunkte (Modul `threads`, `ForumThreadController`)

| Methode | Pfad | Request | Erfolg |
|---|---|---|---|
| `PUT` | `/api/threads/{id}` | `UpdateThreadRequest(title, content, categoryIds)` | 204 ohne Body |
| `DELETE` | `/api/threads/{id}` | – | 204 ohne Body |
| `PUT` | `/api/threads/{id}/posts/{postId}` | `UpdatePostRequest(content)` | 204 ohne Body |
| `DELETE` | `/api/threads/{id}/posts/{postId}` | – | 204 ohne Body |

- `id` und `postId` sind `@PathVariable @Positive int`.
- `UpdateThreadRequest`: `title`, `content` und `categoryIds` mit denselben Annotationen wie in `CreateThreadRequest`, mit `strip()` im kompakten Konstruktor. Thread und Eröffnungspost ändern sich in **einer** Transaktion. Der Eröffnungspost bekommt nur dann `updatedAt`, wenn sich sein Text wirklich ändert.
- **Ein Formular statt zwei (Änderung nach UI-Review):** Der Eröffnungsbeitrag hat keine eigenen Buttons. Titel, Kategorien und Text bearbeitet man gemeinsam wie beim Erstellen. `PUT /api/threads/{id}/posts/{postId}` gilt fachlich weiter auch für den Eröffnungspost (Sperre, 409), das Frontend nutzt ihn aber nur für Antworten.
- `UpdatePostRequest`: `@NotBlank @CodePointLength(min = 1, max = 20000) String content`, mit `strip()`. Das entspricht `CreatePostRequest`.
- **PUT statt PATCH:** Der Client schickt immer alle änderbaren Felder (Titel *und* Kategorien bzw. den ganzen Text). Fehlende Felder sind ein Validierungsfehler und keine „unverändert“-Angabe. Das ist ein vollständiges Ersetzen, also PUT. Bei PATCH bräuchte es Null-Semantik pro Feld, und die braucht hier niemand.
- **204 ohne Body:** Das Frontend lädt nach Erfolg ohnehin neu, weil `editedAt` vom Server kommt. Eine Antwort mit Body müsste das Format von `ThreadDetailsResponse`/`PostResponse` duplizieren.
- **Beitrag unter dem Thread-Pfad:** Wie beim Verfassen. Der Pfad stellt sicher, dass der Beitrag zum Thread gehört (sonst 404 „Beitrag nicht gefunden“), und „Thread nicht gefunden“ lässt sich wie beim Lesen beantworten.

**ProblemDetail je Fehlerfall** (alle in `ThreadExceptionHandler`):

| Fall | Status | `title` | Quelle |
|---|---|---|---|
| ungültiger Body / kein JSON | 400 | „Ungültige Eingabe“ / „Ungültige Anfrage“ | bestehende Handler |
| unbekannte Kategorie | 400 | „Ungültige Eingabe“ (`errors.categoryIds`) | bestehend |
| ungültige Thread-ID | 400 | „Ungültige Thread-ID“ | bestehend |
| ungültige Beitrags-ID | 400 | „Ungültige Beitrags-ID“ | **neu**, Parameter `postId` |
| Gast | 401 | – | Spring Security, wie bisher |
| kein CSRF-Token | 403 | – | Spring Security, wie bisher |
| fremder Inhalt | 403 | „Keine Berechtigung“ | **neu** `NotContentOwnerException` |
| Thread unbekannt/gelöscht | 404 | „Thread nicht gefunden“ | bestehend `ThreadNotFoundException` |
| Beitrag unbekannt/gelöscht/anderer Thread | 404 | „Beitrag nicht gefunden“ | **neu** `PostNotFoundException` |
| Thread hat sichtbare Antworten | 409 | „Thread hat bereits Antworten“ | **neu** `ThreadHasRepliesException` |

Die Exceptions liegen wie die bestehenden in `threads.exceptions`. `handleTypeMismatch` und `handleValidation` unterscheiden künftig zwischen `id` und `postId`. Dazu kommt neben `THREAD_ID_PARAMETER` eine Konstante `POST_ID_PARAMETER`.

### 2. Reihenfolge der Prüfungen im Service

Alle vier Pfade in `ForumThreadManagement` laufen in **einer** `@Transactional`-Methode und in dieser Reihenfolge:

```
 1. Thread-Zeile sperren (SELECT ... FOR UPDATE)     -> fehlt: 404 Thread
 2. Thread sichtbar? (VISIBLE-Regel)                  -> nein:  404 Thread
 3. [nur Post-Pfade] Beitrag in diesem Thread
    und nicht gelöscht?                               -> nein:  404 Beitrag
 4. Profil des Nutzers == createdBy?                  -> nein:  403
 5. [Thread-Pfade + Eröffnungsbeitrag]
    sichtbare Antwort vorhanden?                      -> ja:    409
 6. ändern bzw. als gelöscht markieren
```

Daraus folgen die Spec-Regeln „404 vor 403“ (gelöschte fremde Inhalte verraten nichts) und „403 vor 409“ (Fremde erfahren nichts über den Zustand). Bean Validation läuft schon vor dem Service. Ein ungültiger Body ergibt also 400, auch wenn der Thread nicht existiert. Das ist wie beim Verfassen.

`createPost` bekommt Schritt 1 vor die bestehende Sichtbarkeitsprüfung.

### 3. Pessimistische Sperre auf die Thread-Zeile

Neue Repository-Methode in `ForumThreadRepository`:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select t from ForumThread t where t.id = :id")
Optional<ForumThread> findByIdForUpdate(@Param("id") int id);
```

- Gesperrt wird die **Thread-Zeile** und nicht die Posts, denn sie ist das gemeinsame Objekt aller Konkurrenten: Antworten (`createPost`), Thread bearbeiten/löschen, Eröffnungsbeitrag bearbeiten/löschen. Wer zuerst sperrt, gewinnt. Der zweite wartet bis zum Commit und sieht dann den neuen Zustand (READ COMMITTED liest nach dem Warten den neuesten Stand).
- Die Sperre steht in einer eigenen, schlichten Abfrage. Postgres erlaubt `FOR UPDATE` nicht zusammen mit Aggregaten, und `VISIBLE` enthält `min(...)`. Die Sichtbarkeit wird danach mit dem bestehenden `findVisibleDetails` geprüft.
- **Antworten auf andere eigene Antworten** (Bearbeiten/Löschen einer Antwort) sperren den Thread ebenfalls. Das ist nicht unbedingt nötig, hält aber alle Schreibpfade gleich und kostet bei einem Forum nichts.
- *Alternative `@Version` am Thread:* Jede Antwort müsste den Thread mitschreiben, damit die Version steigt, und Konflikte bräuchten Wiederholungslogik. Verworfen (siehe Exploration).
- *Alternative `SERIALIZABLE`:* Postgres bricht Transaktionen mit Serialisierungsfehlern ab, die man abfangen und wiederholen müsste, und das ist schwer zu testen. Verworfen.

### 4. Antwort-Prüfung und Eröffnungsbeitrag

Neue Abfrage in `PostRepository`:

```java
/** Gibt es einen nicht gelöschten Post außer dem Eröffnungspost (kleinste Post-ID)? */
@Query("""
        select count(p) > 0 from Post p
        where p.thread.id = :threadId and p.deletedAt is null
          and p.id > (select min(p2.id) from Post p2 where p2.thread.id = :threadId)
        """)
boolean existsVisibleReply(@Param("threadId") int threadId);
```

- „Eröffnungsbeitrag = kleinste Post-ID“ ist dieselbe Definition wie in `VISIBLE`. Ob ein Beitrag der Eröffnungsbeitrag ist, prüft eine kleine Hilfsabfrage (`findOpeningPostId(threadId)`) oder derselbe `min`-Ausdruck.
- Eine Abfrage pro Schreibvorgang, kein Laden von Post-Listen und damit kein N+1.

### 5. Änderungsmethoden an den Entities

- `ForumThread.edit(String title, Collection<Category> categories)`: setzt Titel, ersetzt die Kategorien und setzt `updatedAt = Instant.now()`.
- `ForumThread.delete(int profileId)`: setzt `deletedAt = Instant.now()` und `deletedBy = profileId`.
- `Post.edit(String content)`: setzt den Inhalt und `updatedAt = Instant.now()`.
- `Post.delete(int profileId)`: setzt `deletedAt`/`deletedBy` und lässt `updatedAt` unverändert.
- Gespeichert wird durch Dirty Checking am Transaktionsende, ohne explizites `save`.
- Kategorien prüft `editThread` genauso wie `createThread` (`findAllById`, Größenvergleich, `UnknownCategoryException`). Diese Prüfung wird in eine private Methode herausgezogen, die beide verwenden.
- **Eröffnungsbeitrag löschen** ruft intern dieselbe Logik wie `deleteThread` auf und markiert nur den **Thread** als gelöscht. Der Eröffnungspost bleibt unverändert. Damit gibt es genau ein Löschkennzeichen pro Thread. `VISIBLE` deckt beide Varianten ab, also auch alte Daten mit gelöschtem Eröffnungspost.
- `deletedBy` ist eine Profil-ID, passend zum Fremdschlüssel `REFERENCES profiles (id)`.

### 6. Frontend

**Service (`ForumService`):** `updateThread(id, { title, categoryIds })`, `deleteThread(id)`, `updatePost(threadId, postId, content)`, `deletePost(threadId, postId)`. Alle sind `Promise<void>` über `firstValueFrom`, wie `createThread`/`createPost`.

**Position:** „Bearbeiten“ und „Löschen“ des Threads stehen unter den Beiträgen rechtsbündig in der Zeile von „Antworten“. `ThreadDetail` projiziert sie per `<ng-content>` in `ReplyForm`, damit sie in derselben Zeile stehen. Das Formular öffnet sich im Kopf, und die Seite springt dorthin. Auf einer Seite hinter dem Ende stehen die Aktionen allein unten.

**„Meins“ und „gesperrt“** berechnet `ThreadDetail` und reicht sie nach unten weiter:
- `isThreadAuthor = computed(() => authService.currentUser()?.username === thread.value().author)`. Gelöschte Konten heißen `deleted-<id>`, und dieses Präfix kann kein aktives Konto haben. Ein Profil ohne Benutzernamen (`username: null`) passt nie.
- `hasReplies = computed(() => posts.value().page.totalElements > 1)`. Solange die Beiträge laden, gilt der Thread vorsichtshalber als gesperrt (Buttons gesperrt, ohne Hinweis).
- `PostList` setzt `mine = !opening && post.author === username`. Der Eröffnungsbeitrag hat also nie eigene Buttons, auch die Lösungskarte im Kopf nicht.
- `openingPost`: ohne Antworten der erste Beitrag auf Seite 1. Er liefert den Text für das Formular, ohne ihn gibt es kein „Bearbeiten“.

**Komponenten (neu bzw. geändert):**

```
 shared/ui/category-picker/          NEU, FormValueControl<number[]> (Signal Forms),
                                     Checkboxen + Sperre ab 2 Kategorien, aus new-thread herausgelöst
 features/new-thread/                nutzt <app-category-picker [field]="threadForm.categoryIds">
 features/thread-detail/
   thread-detail.*                   Kopf: Bearbeiten/Löschen/Sperrhinweis/Lösch-Bestätigung,
                                     Modus 'view' | 'edit' | 'confirm-delete' als Signal
   thread-edit-form/                 NEU, Titel + category-picker, Speichern/Abbrechen
   post-item/                        Bearbeiten/Löschen/Sperrhinweis/Bestätigung, Modus als Signal,
                                     Outputs: changed, deleted, conflict
   post-edit-form/                   NEU, Textfeld + Speichern/Abbrechen
   post-list/                        reicht mine/locked/opening durch, leitet Outputs weiter
```

- `CategoryPicker` als `FormValueControl` lässt sich in beiden Formularen über `[field]` binden. Ladezustand, Fehler und Wiederholen der Kategorien bleiben beim Elternformular, der Picker bekommt nur die Liste. Die `data-testid`s in `new-thread.html` für Lade- und Fehleranzeigen bleiben dort. Nur die Checkboxen wechseln auf `category-picker-category-checkbox`. Die Page Objects der E2E-Tests muss der Nutzer entsprechend anpassen (siehe Risiken).
- Die Validierung kommt aus `shared/forms/validators` und ist dieselbe wie in `new-thread` und `reply-form`. Serverfehler aus 400 übernimmt `problemDetailErrors`.
- **Nach Erfolg:**
  - Thread bearbeitet: `thread.reload()`.
  - Beitrag bearbeitet: `posts.reload()` (für `editedAt`, gegebenenfalls `thread.reload()`, falls es die Lösung war).
  - Antwort gelöscht: `posts.reload()`. Liefert die Seite danach keine Beiträge und ist sie größer als 1, navigiert die Seite auf `seite - 1`.
  - Thread oder Eröffnungsbeitrag gelöscht: `router.navigate(['/'])`.
- **409:** `PostItem` bzw. das Kopf-Formular meldet `conflict`. `ThreadDetail` lädt `thread` und `posts` neu, und `hasReplies` zeigt dann den Hinweis.

## Risks / Trade-offs

- [Sperre verlängert `createPost` minimal; ein langsamer Schreibvorgang hält Antworten kurz auf] → Die Transaktionen sind kurz (wenige Statements). Es gibt keine externen Aufrufe innerhalb der Sperre.
- [Deadlock, wenn ein Pfad zuerst Posts und dann den Thread sperrt] → Alle Pfade sperren **zuerst** die Thread-Zeile und sonst nichts explizit.
- [Frontend vergleicht Benutzernamen; ließen sich Benutzernamen später ändern, könnte die Anzeige kurz veraltet sein] → Das Backend prüft immer selbst (403/409). Die Buttons sind nur Komfort.
- [`hasReplies` stützt sich auf die Beitragsliste; in einem anderen Tab kann inzwischen jemand geantwortet haben] → Das Backend antwortet mit 409, und das Frontend lädt neu (siehe Spec).
- [Umbau der Kategorie-Auswahl ändert `data-testid` der Checkboxen in „Neuer Thread“] → Wird in den Tasks ausdrücklich als Hinweis für die E2E-Page-Objects des Nutzers vermerkt.
- [Nebenläufigkeit ist schwer zu testen] → Ein Integrationstest hält die Sperre in Transaktion A (`TransactionTemplate`), startet `createPost` in einem zweiten Thread, prüft, dass dieser blockiert, setzt in A den Thread auf gelöscht, committet und erwartet `ThreadNotFoundException`. Ein zweiter Test prüft die umgekehrte Reihenfolge mit 409.

## Migration Plan

Kein Liquibase-Changeset nötig, weil alle Spalten existieren. Ausrollen ist eine reine Code-Änderung. Für einen Rollback reicht es, den Code zurückzusetzen. Bereits gesetzte `deleted_at`/`updated_at`-Werte versteht die alte Version, weil die Lese-Logik sie schon kennt.
