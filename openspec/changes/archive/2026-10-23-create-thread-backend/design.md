# Design

## Context

Warum es diesen Change gibt, steht in `proposal.md` unter „Why“. Das Verhalten beschreiben `specs/thread-creation/spec.md` und `specs/categories/spec.md`.

**Heutiger Stand im Modul `threads`**

- `ForumThread`, `Post` und `Category` liegen in `internal/`. Sie haben nur einen geschützten No-Args-Konstruktor und keine Setter, und bisher werden sie nur gelesen.
- Es gibt kein `CategoryRepository`. Kategorien werden heute nur über `ForumThreadRepository.findCategoriesByThreadIdIn` gelesen.
- `CreateThreadRequest` existiert schon, wird aber nirgends benutzt. Es hat `categoryId` als einzelne Zahl und ein TODO zur Umstellung auf mehrere Kategorien. Der kompakte Konstruktor bereinigt Titel und Text mit `strip()`.
- `ThreadExceptionHandler` ist per `assignableTypes` auf `ForumThreadController` beschränkt und kennt bisher nur Fehler in Pfad- und Query-Parametern.

**Nachbarmodule**

- `auth`: Der angemeldete Nutzer steht als `AccountDetails` (mit `accountId`) im Security-Kontext. `AuthController.me` liest ihn per `@AuthenticationPrincipal`.
- `profile`: `ProfileLookUp` bietet `findUsernameByAccountId`, aber keine Abfrage, die zur Account-ID die Profil-ID liefert. Das Profil entsteht **synchron** (`@EventListener` auf `AccountRegistered`) in derselben Transaktion wie der Account. Jeder Account hat also ein Profil.
- `account`: `AccountExceptionHandler` ist ein **globales** `@RestControllerAdvice` ohne Einschränkung und behandelt `MethodArgumentNotValidException` für alle Controller. Seine Antwort hat keinen `title`.

**Schema (bleibt unverändert)**

- `threads.title` hat den CHECK `length(trim(title)) BETWEEN 5 AND 200`, `posts.content` hat `BETWEEN 1 AND 20000`.
- `threads_categories(thread_id, category_id)` hat einen zusammengesetzten Primärschlüssel.
- `categories.name` ist `UNIQUE`.
- Liquibase-Changesets sind formatiertes SQL unter `db/changelog/changes/` und werden einzeln in `db.changelog-master.yaml` eingebunden.

## Goals / Non-Goals

**Goals:**
- Das Anlegen eines Threads braucht eine feste Zahl von Abfragen: Profil, Kategorien, Insert Thread, Insert Kategoriezuordnungen, Insert Post.
- Jede ungültige Eingabe ergibt 400 mit deutschem Titel. Keine ungültige Eingabe erreicht die CHECK-Constraints der Datenbank und wird dort zu einer 500.
- Das Modul `threads` hält die Modulith-Regeln ein. `profile` wird nur über seine öffentliche API angesprochen.

**Non-Goals:**
- Keine neuen Events. `threads` fragt `profile` synchron ab, und es gibt bisher keinen Interessenten für ein Event wie „Thread erstellt“.
- Kein generischer, modulübergreifender Fehler-Handler. Der globale Handler in `account` wird nicht umgebaut.
- Keine Entity-Methoden, die nicht für das Erstellen gebraucht werden, also kein Bearbeiten oder Löschen.

## Decisions

### 1. REST-Endpunkte

**`POST /api/threads`** (in `ForumThreadController`, nur angemeldet)

```
Request  CreateThreadRequest(
           @NotBlank @CodePointLength(min = 5, max = 200)  String title,
           @NotBlank @CodePointLength(min = 1, max = 20000) String content,
           @NotNull @Size(min = 1, max = 2) Set<@NotNull @Positive Integer> categoryIds)
Response 201 Created
         Location: /api/threads/{id}
         Body: CreatedThreadResponse(int id)
```

**`GET /api/categories`** (in einem neuen `CategoryController`, öffentlich)

```
Response 200 List<CategoryResponse>   // CategoryResponse(int id, String name), alphabetisch nach Name
```

`CategoryResponse` gibt es schon in `web/` und wird wiederverwendet.

**Fehlerfälle von `POST /api/threads`**

| Fall | Status | `title` | Zusätzlich |
|---|---|---|---|
| Feldvalidierung (Titel, Text, Kategorien) | 400 | „Ungültige Eingabe“ | `errors`: Map Feldname → Liste deutscher Meldungen |
| Unbekannte Kategorie | 400 | „Ungültige Eingabe“ | `errors.categoryIds`: „Kategorie existiert nicht: 999“ |
| Body ist kein gültiges JSON oder hat falsche Typen | 400 | „Ungültige Anfrage“ | – |
| Gast | 401 | – | `HttpStatusEntryPoint`, kein Body (wie bisher) |
| Ohne CSRF-Token | 403 | – | Spring Security (wie bisher) |

Bei einer unbekannten Kategorie hat die Antwort dieselbe Form wie ein Feldfehler. Das Frontend kann deshalb alle Kategoriefehler am selben Feld anzeigen.

### 2. Duplikate über `Set` statt eigener Regel

`categoryIds` ist ein `Set<Integer>`. Jackson fasst `[2, 2]` beim Einlesen zu `{2}` zusammen, und `@Size(max = 2)` prüft danach die eindeutigen IDs. Das erfüllt die Spec „Duplikate zählen nicht zur Höchstzahl“ ohne eigenen Code.
*Alternative:* `List` plus eigene Prüfung im Service. Das ist mehr Code für dasselbe Ergebnis.

### 3. Zeichen zählen wie die Datenbank (`@CodePointLength`)

`@Size` zählt UTF-16-Einheiten, Postgres zählt bei `length()` Code Points. Ein Emoji wie 🎮 zählt für `@Size` doppelt. „🎮🎮🎮“ hätte dann 6 Einheiten, bestünde `@Size(min = 5)` und würde am CHECK der Datenbank als 500 scheitern. Die Lösung ist eine kleine eigene Constraint `@CodePointLength(min, max)` in `threads/web` (Annotation plus Validator mit `String.codePointCount`). Sie ersetzt `@Size` bei Titel und Text.
*Alternative:* `DataIntegrityViolationException` abfangen und in 400 übersetzen. Dann wäre keine Fehlermeldung am Feld möglich, und die Datenbank würde als Validierung missbraucht.

`strip()` im Record entfernt mehr Leerraum als `trim()` in Postgres, nämlich alle Unicode-Leerzeichen. Der gespeicherte Wert hat also keinen Rand mehr, den `trim()` noch kürzen könnte. Die beiden Prüfungen stimmen dadurch überein.

### 4. Ablauf im Service

```
ForumThreadController.createThread(@Valid @RequestBody req, @AuthenticationPrincipal AccountDetails me)
  -> ForumThreadManagement.createThread(me.getAccountId(), title, content, categoryIds)   @Transactional
       1. profileId  = profileLookUp.findProfileIdByAccountId(accountId)
                        .orElseThrow(IllegalStateException)        // laut Context unmöglich -> 500
       2. categories = categoryRepository.findAllById(categoryIds)
          fehlende   = categoryIds - ids(categories)
          fehlende nicht leer -> UnknownCategoryException(fehlende)
       3. thread = forumThreadRepository.save(ForumThread.open(title, profileId, categories))
       4. postRepository.save(Post.opening(thread, content, profileId))
       5. return thread.getId()
```

- `ForumThreadManagement` bekommt `int accountId` statt `AccountDetails`. So hängt das Modul `threads` nicht vom Modul `auth` ab. Nur der Controller in `web/` kennt den Principal.
- `ForumThread.open(...)` und `Post.opening(...)` sind statische Fabrikmethoden in `internal/`. Die Entities bleiben ohne Setter.
- Die Kategoriezuordnung schreibt JPA über `@ManyToMany` beim Speichern des Threads. Das passt, weil `ForumThread` die besitzende Seite ist (`@JoinTable`).
- Der Eröffnungsbeitrag ist laut `thread-list` der Post mit der kleinsten ID. Er wird direkt nach dem Thread angelegt, also ist er das automatisch.

### 5. Neue öffentliche Abfrage in `profile`

`ProfileLookUp.findProfileIdByAccountId(Integer accountId): Optional<Integer>` nutzt das bestehende `ProfileRepository.findByAccountId`. Es gibt keine neue Repository-Methode.
*Alternative:* `findUsernameByAccountId` erweitern. Das würde eine bestehende API verbiegen.

### 6. Fehler-Handler: Vorrang vor dem globalen Handler

`ThreadExceptionHandler` bekommt Handler für `MethodArgumentNotValidException`, `UnknownCategoryException` (neu in `threads/exceptions`) und `HttpMessageNotReadableException`. Er wird mit `@Order(Ordered.HIGHEST_PRECEDENCE)` versehen. Spring durchsucht die Advices in ihrer Reihenfolge. Ohne `@Order` hängt es von der Registrierungsreihenfolge ab, ob der globale `AccountExceptionHandler` (ohne `title`) oder der eigene Handler greift.

`CategoryController` hat keine Fehlerfälle und braucht keinen eigenen Handler.

### 7. Kategorien abrufen

- Neues `CategoryRepository` in `internal/` mit `findAllByOrderByNameAsc()`. Das ist eine Abfrage, ohne N+1-Risiko, weil Kategorien keine Beziehungen laden.
- `ForumThreadManagement.listCategories()` liefert `List<CategoryView>`. Der Record existiert schon.
- In `SecurityConfig` kommt `GET /api/categories` in die `permitAll`-Liste. `POST` und alle anderen Methoden bleiben unter `authenticated`, ein Gast bekommt also 401.

### 8. Kategorien einspielen

Neues Changeset `004-seed-categories.sql`, eingebunden in `db.changelog-master.yaml`:

```sql
--changeset luca:004-seed-categories
INSERT INTO categories (name) VALUES ('Engines'), ('Programmierung'), ('Showcase'), ('Off-Topic')
ON CONFLICT (name) DO NOTHING;
--rollback DELETE FROM categories WHERE name IN ('Engines', 'Programmierung', 'Showcase', 'Off-Topic');
```

Bestehende Changesets bleiben unverändert.

`ON CONFLICT (name) DO NOTHING` ist nötig, weil vorhandene Datenbanken schon Kategorien von Hand haben können. Die Dev-Datenbank hat zum Beispiel bereits Engines, Programmierung und Showcase. Ein einfaches `INSERT` würde dort an der Unique-Constraint scheitern, und die Anwendung würde nicht starten. Vorhandene Kategorien behalten ihre ID, es kommen nur die fehlenden Namen hinzu.
*Alternative:* eine Liquibase-Precondition oder die Dev-Datenbank von Hand bereinigen. Beides wurde verworfen, weil es auf jeder Umgebung eigene Handarbeit erfordert.

**Test des Changesets:** Alle Integrationstests teilen sich eine Datenbank und leeren `categories` vor jedem Test. Ein Test, der sich auf die eingespielten Daten verlässt, wäre deshalb von der Reihenfolge abhängig. Stattdessen leert der Test `categories`, führt die Datei `db/changelog/changes/004-seed-categories.sql` per `ResourceDatabasePopulator` aus (die Liquibase-Kommentare sind für ihn SQL-Kommentare) und ruft dann `GET /api/categories` ab. So wird der echte Dateiinhalt geprüft, und der Test bleibt unabhängig von der Reihenfolge.

### 9. Keine neuen Events

Kein Modul reagiert heute auf neue Threads. Ein Event `ThreadCreated` kommt erst, wenn es einen Abnehmer gibt, zum Beispiel Benachrichtigungen.

## Risks / Trade-offs

- [Globaler `AccountExceptionHandler` greift trotz `@Order` zuerst] → Ein Integrationstest prüft den `title` „Ungültige Eingabe“ bei einem Feldfehler. Schlägt er fehl, bekommt der globale Handler `assignableTypes = AccountController.class`.
- [`IllegalStateException`, wenn ein Account ausnahmsweise kein Profil hat] → Das ist laut Context unmöglich, weil das Profil synchron in derselben Transaktion entsteht. Eine 500 ist hier die ehrliche Antwort. Ein Test dafür entfällt.
- [Race Condition: Kategorie wird zwischen Prüfung und Insert gelöscht] → Kategorien lassen sich heute nicht löschen. Der FK würde den Fall als 500 abfangen. Das wird erst mit der Kategorienverwaltung relevant.
- [Eingespielte Kategorien und Testdaten in den ITs] → Die bestehenden ITs leeren `categories` mit `RESTART IDENTITY` und legen eigene Kategorien an, es gibt also keine Kollision.
- [`CategoryResponse` im Frontend-Mock hat mehr Felder] → Das betrifft erst den Frontend-Change. Die API liefert bewusst nur ID und Name.

## Migration Plan

- Deployment: Liquibase führt beim Start `004-seed-categories` aus. Es gibt keine Schemaänderung und keine Datenmigration.
- Rollback: `liquibase rollback` löscht die vier Kategorien. Das klappt nur, solange noch kein Thread auf sie verweist (FK), andernfalls müssen die Threads zuerst entfernt werden. Achtung: Das Rollback löscht die vier Namen auch dann, wenn sie schon vor dem Changeset existierten (zum Beispiel in der Dev-Datenbank).
- Testcontainer mit `withReuse(true)`: Ändert sich ein Changeset nach seinem ersten Lauf, scheitert Liquibase an der gespeicherten Prüfsumme. Abhilfe: im Testcontainer `UPDATE databasechangelog SET md5sum = NULL WHERE id = '<changeset>'`. Der Code-Rollback ist unkritisch, weil die neuen Endpunkte dann einfach fehlen.
