# pixelpit – Backend

Spring-Boot-Backend des Web-Forums. Authentifizierung läuft über Spring Security mit
serverseitigem Session-Management (Session-Cookie), Accounts und Rollen liegen in der eigenen Datenbank.

| | |
|---|---|
| Spring Boot | 4.1.1 |
| Java | 25 |
| Spring Modulith | 2.1.1 |
| Datenbank | PostgreSQL 18.4 (via Docker Compose) |
| Migrationen | Liquibase |
| Build | Maven Wrapper (`./mvnw`), Modul des Root-Aggregators `pixelpit/pom.xml` |

### Module

Das Backend ist mit Spring Modulith in fachliche Module unter `org.pixelpit.backend` geschnitten.
Jedes Modul exportiert seine API im Wurzelpaket, Implementierung liegt in `internal`, REST-Controller in `web`.

| Modul | Aufgabe | Endpunkte |
|---|---|---|
| `account` | Registrierung, Account löschen, Rollen-Enum `Role`; publiziert `AccountRegistered`/`AccountDeleted` | `/api/accounts` |
| `auth` | Login/Logout, eingeloggter Nutzer (`UserService` als `UserDetailsService`) | `/api/auth` |
| `profile` | Öffentliches Profil (Username), reagiert auf Account-Events, Anonymisierung beim Löschen | – |
| `threads` | Threads, Beiträge und Kategorien inkl. Bearbeiten und Löschen | `/api/threads`, `/api/categories` |
| `admin` | Admin-Dashboard: Accounts auflisten, Rollen ändern | `/api/admin/accounts` |
| `configs` | Security, CORS, Argon2-Parameter | – |

---

## Voraussetzungen

- **JDK 25** (`<java.version>25</java.version>` in der `pom.xml`)
- **Docker** inkl. **Docker Compose v2** – muss laufen, sowohl für den Start der App als auch für die Tests
- Maven wird **nicht** lokal benötigt, der Wrapper `./mvnw` bringt alles mit

---

## IntelliJ-Setup

Das Projekt wird über den **Repo-Root** `pixelpit/` geöffnet, nicht über `backend/`.
Die `pom.xml` im Root ist ein reiner Aggregator (`packaging: pom`) mit den Modulen
`backend` und `frontend`. Sie ist **nicht** der Parent des Backends –
`backend/pom.xml` erbt weiterhin von `spring-boot-starter-parent`.

Beim ersten Öffnen: Rechtsklick auf `pixelpit/pom.xml` → **Add as Maven Project**.
Danach erscheinen beide Module im Maven-Tool-Fenster.

`.idea/` und `*.iml` sind git-ignored – die Modulstruktur ergibt sich ausschließlich
aus den `pom.xml`-Dateien.

---

## Setup: `.env` anlegen

`compose.yaml` referenziert die Credentials über Platzhalter (`${POSTGRES_USER}` usw.).
Diese Werte kommen aus `backend/.env`.

```bash
cd backend
cp .env.example .env
```

Danach in `.env` mindestens `POSTGRES_PW` auf einen eigenen Wert setzen.

| Key | Bedeutung |
|---|---|
| `POSTGRES_USER` | DB-Benutzer, der beim ersten Start angelegt wird |
| `POSTGRES_DB` | Name der Datenbank |
| `POSTGRES_PW` | Passwort des DB-Benutzers |

Wichtig zu wissen:

- Docker Compose liest `.env` **implizit** aus dem Verzeichnis der Compose-Datei, also aus `backend/`.
  Deshalb steht in `compose.yaml` bewusst kein `env_file:`-Eintrag.
- Der Key heißt `POSTGRES_PW`, nicht `POSTGRES_PASSWORD`. In `compose.yaml` wird er auf die
  vom Postgres-Image erwartete Variable `POSTGRES_PASSWORD` gemappt.
- `.env` ist git-ignored und gehört nicht ins Repository. Nur `.env.example` wird eingecheckt.

---

## Starten

```bash
cd backend
./mvnw spring-boot:run
```

### Woher kommt die Datasource?

In `src/main/resources/application.yaml` steht **kein** `spring.datasource.url`, kein `username`,
kein `password` – im ganzen Repository nicht. Die Verbindung entsteht zur Laufzeit:

1. Die Runtime-Dependency **`spring-boot-docker-compose`** (siehe `pom.xml`) sucht beim Start
   eine `compose.yaml` im **Arbeitsverzeichnis** und findet `backend/compose.yaml`.
2. Spring Boot startet den Service `postgres` und wartet, bis dessen Healthcheck
   (`pg_isready`, `start_period: 30s`) grün ist.
3. Boot liest die Umgebungsvariablen und den gemappten Port aus dem laufenden Container und
   baut daraus automatisch die `JdbcConnectionDetails` – **das ist die Datasource**.
   Genau deshalb muss und darf sie nicht in der `application.yaml` stehen.
4. **Liquibase** läuft anschließend über den Boot-Default
   `classpath:/db/changelog/db.changelog-master.yaml` und legt das Schema an.
   Auch hier ist keine Konfiguration nötig, weil der tatsächliche Pfad dem Default entspricht.
5. **Hibernate** validiert nur noch gegen dieses Schema (`ddl-auto: validate`)
   und legt selbst nichts an.

### Zwei Fallstricke

- **Das Arbeitsverzeichnis muss `backend/` sein.** `spring.docker.compose.file` ist nicht gesetzt,
  Boot sucht die Compose-Datei also relativ zum Arbeitsverzeichnis. Ein Start aus dem Repo-Root
  findet sie nicht. Das gilt auch, wenn das Projekt in IntelliJ über den Root geöffnet ist:
  In der Run-Konfiguration muss als Working Directory `backend/` (bzw. `$MODULE_WORKING_DIR$`)
  eingetragen sein.
- **Der Container läuft nach dem Beenden der App weiter.** `application.yaml` setzt
  `spring.docker.compose.lifecycle-management: start_only` – Boot startet den Stack, stoppt ihn
  aber nicht wieder. Zum Herunterfahren:

  ```bash
  docker compose down
  ```

### Datenbank separat starten

Läuft der Stack bereits, erkennt Boot das und nutzt ihn, statt einen neuen zu starten:

```bash
docker compose up -d     # starten
docker compose ps        # Status
docker compose down      # stoppen, Daten bleiben erhalten
docker compose down -v   # stoppen und Volume pgdata löschen
```

---

## Datenbank & Schema

Der Port ist in `compose.yaml` fest auf den Host gemappt, eine Verbindung von außen
(z. B. aus dem IntelliJ-DB-Tool) geht also über:

```
jdbc:postgresql://localhost:5432/${POSTGRES_DB}
```

Das Schema wird ausschließlich über Liquibase verwaltet
(`src/main/resources/db/changelog/`):

| Changeset | Legt an |
|---|---|
| `001-initial-schema.sql` | `files`, `categories`, `accounts`, `profiles`, `threads`, `posts`, `threads_categories`, `attachments` |
| `002-modulith-event-publication.sql` | `event_publication` – die Event-Publication-Registry von Spring Modulith (die JPA-Variante legt die Tabelle nicht selbst an) |
| `003-modulith-event-publication-archive.sql` | `event_publication_archive` – Archiv abgeschlossener Events (`completion-mode: archive`) |
| `004-seed-categories.sql` | Feste Kategorien `Engines`, `Programmierung`, `Showcase`, `Off-Topic` |

`accounts` enthält die Login-Daten (E-Mail, Argon2-Passwort-Hash) und die Rolle als Spalte
(`USER`, `MODERATOR`, `ADMIN` – entspricht dem Java-Enum `Role`). Eine separate `roles`-Tabelle
gibt es nicht. `profiles.account_id` verknüpft den Account mit dem öffentlichen Forumsprofil
(Username, Avatar); bei Anonymisierung wird sie auf `NULL` gesetzt.

---

## Authentifizierung & Session

Das Backend nutzt klassisches **Session-Management** von Spring Security, keine Tokens:

1. `POST /api/auth/login` nimmt Username **oder** E-Mail plus Passwort entgegen.
   `UserService` sucht den Account, das Passwort wird mit dem `Argon2PasswordEncoder` geprüft.
2. Bei Erfolg wird die Session-ID gewechselt (Schutz vor Session Fixation) und der
   `SecurityContext` in der HTTP-Session gespeichert.
3. Der Browser schickt ab dann das Session-Cookie mit (`http-only`, `same-site: lax`,
   Timeout 30 Minuten – siehe `server.servlet.session` in `application.yaml`).
4. `POST /api/auth/logout` beendet die Session, `GET /api/auth/me` liefert den eingeloggten Nutzer.

CSRF-Schutz ist für die SPA aktiv (`CsrfConfigurer::spa`): Das Frontend sendet den Token im
Header `X-XSRF-TOKEN`. Die Autorisierung steht in `SecurityConfig` – Lesen von Threads und
Kategorien ist öffentlich, `/api/admin/**` erfordert die Rolle `ADMIN`, alles andere einen Login.

Die Daten liegen im benannten Volume `pgdata` und überleben ein `docker compose down`.
Für einen komplett frischen Stand `docker compose down -v` verwenden – dann laufen beim
nächsten Start alle Liquibase-Changesets erneut.

---

## Tests

```bash
./mvnw test
```

Die Tests nutzen **nicht** den Compose-Stack, sondern **Testcontainers**: `TestcontainersConfiguration`
stellt einen `PostgreSQLContainer` auf `postgres:18.4` als `@ServiceConnection` bereit. Jeder Testlauf
bekommt damit eine frische Datenbank; ein laufender Compose-Container wird nicht angefasst.
Docker muss dafür laufen.

Die App lässt sich auch lokal mit Testcontainers statt Compose starten – dann ist die Datenbank
bei jedem Start leer. Main-Klasse dafür ist `org.pixelpit.backend.TestBackendApplication`
(liegt in `src/test/java`).

---

## Build

Nur das Backend, aus `backend/`:

```bash
./mvnw clean package     # ausführbares JAR nach target/
```

Backend **und** Frontend zusammen, aus dem Repo-Root:

```bash
backend/mvnw clean package
```

Der Maven-Wrapper liegt nur in `backend/`, deshalb der Aufruf über `backend/mvnw`.
Das Frontend-Modul (`frontend/pom.xml`) nutzt das `frontend-maven-plugin`: Es lädt eine
gepinnte Node/npm-Version nach `frontend/target/` und führt `npm install` und `npm run build` aus.
Ein lokal installiertes Node ist für den Maven-Build daher nicht nötig.

---

## Weiterführende Dokumentation

- [Spring Boot – Docker Compose Support](https://docs.spring.io/spring-boot/4.1.1/reference/features/dev-services.html#features.dev-services.docker-compose)
- [Spring Boot – Testcontainers Support](https://docs.spring.io/spring-boot/4.1.1/reference/testing/testcontainers.html#testing.testcontainers)
- [Spring Boot – Liquibase](https://docs.spring.io/spring-boot/4.1.1/how-to/data-initialization.html#howto.data-initialization.migration-tool.liquibase)
- [Spring Security – Session Management](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)
- [Spring Security – CSRF für Single-Page-Apps](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa)
- [Spring Modulith Reference](https://docs.spring.io/spring-modulith/reference/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
