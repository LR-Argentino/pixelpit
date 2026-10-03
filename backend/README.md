# pixelpit – Backend

Spring-Boot-Backend des Web-Forums. Authentifizierung und Rollen liegen bei Keycloak,
das Backend läuft als OAuth2 Resource Server.

| | |
|---|---|
| Spring Boot | 4.1.1 |
| Java | 25 |
| Spring Modulith | 2.1.1 |
| Datenbank | PostgreSQL 18.4 (via Docker Compose) |
| Migrationen | Liquibase |
| Build | Maven Wrapper (`./mvnw`) |

> Stand: Das Modul ist noch ein Grundgerüst – es existiert nur `BackendApplication`.
> Schema und Infrastruktur stehen bereits.

---

## Voraussetzungen

- **JDK 25** (`<java.version>25</java.version>` in der `pom.xml`)
- **Docker** inkl. **Docker Compose v2** – muss laufen, sowohl für den Start der App als auch für die Tests
- Maven wird **nicht** lokal benötigt, der Wrapper `./mvnw` bringt alles mit

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
  findet sie nicht. In IntelliJ ist das Arbeitsverzeichnis des Moduls `backend` bereits korrekt.
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
| `001-initial-schema.sql` | `files`, `categories`, `profiles`, `threads`, `posts`, `threads_categories`, `attachments` |
| `002-modulith-event-publication.sql` | `event_publication` – die Event-Publication-Registry von Spring Modulith (die JPA-Variante legt die Tabelle nicht selbst an) |

Es gibt bewusst **keine** `accounts`- oder `roles`-Tabellen: Authentifizierung und
Rollenvergabe (RBAC) übernimmt Keycloak. `profiles.keycloak_user_id` ist die Klammer
zwischen Keycloak-Nutzer und öffentlichem Forumsprofil.

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

```bash
./mvnw clean package     # ausführbares JAR nach target/
```

---

## Weiterführende Dokumentation

- [Spring Boot – Docker Compose Support](https://docs.spring.io/spring-boot/4.1.1/reference/features/dev-services.html#features.dev-services.docker-compose)
- [Spring Boot – Testcontainers Support](https://docs.spring.io/spring-boot/4.1.1/reference/testing/testcontainers.html#testing.testcontainers)
- [Spring Boot – Liquibase](https://docs.spring.io/spring-boot/4.1.1/how-to/data-initialization.html#howto.data-initialization.migration-tool.liquibase)
- [Spring Boot – OAuth2 Resource Server](https://docs.spring.io/spring-boot/4.1.1/reference/web/spring-security.html#web.security.oauth2.server)
- [Spring Modulith Reference](https://docs.spring.io/spring-modulith/reference/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
