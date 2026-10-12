--liquibase formatted sql

-- =====================================================================
-- Web-Forum – Datenbankschema (PostgreSQL)
-- Authentifizierung & Rollen: Tabelle accounts, Rolle als Enum-Spalte
-- Author: Luca Argentino
-- =====================================================================


-- =====================================================================
-- 1. Tabellen ohne Abhängigkeiten
-- =====================================================================

--changeset luca:001-create-files
--comment Metadaten hochgeladener Dateien, die Datei selbst liegt im Object Storage
CREATE TABLE files (
                       id           serial       PRIMARY KEY,
                       file_name    text         NOT NULL,
                       storage_key  text         NOT NULL UNIQUE,
                       mime_type    text         NOT NULL,
                       file_size    bigint       NOT NULL CHECK (file_size > 0),
                       created_at   timestamptz  NOT NULL DEFAULT now()
);
--rollback DROP TABLE files;

--changeset luca:001-create-categories
--comment Kategorien, denen Threads zugeordnet werden koennen
CREATE TABLE categories (
                            id    serial  PRIMARY KEY,
                            name  text    NOT NULL UNIQUE
);
--rollback DROP TABLE categories;


-- =====================================================================
-- 2. Accounts & Profile (öffentliche Nutzerdaten, verknüpft mit Account)
-- =====================================================================

--changeset luca:001-create-accounts
--comment Login-Daten der Nutzer (E-Mail, Passwort-Hash) mit zugewiesener Rolle
CREATE TABLE accounts (
                          id             serial        PRIMARY KEY,
                          email          varchar(255)  NOT NULL UNIQUE,
                          password_hash  text          NOT NULL,
                          role           varchar(20)   NOT NULL DEFAULT 'USER'
                                                       CHECK (role IN ('USER', 'MODERATOR', 'ADMIN')),   -- Java-Enum Role
                          created_at     timestamptz   NOT NULL DEFAULT now(),
                          updated_at     timestamptz   NOT NULL DEFAULT now()
);
--rollback DROP TABLE accounts;

--changeset luca:001-create-profiles
--comment Oeffentliche Nutzerdaten; bei Anonymisierung account_id = NULL und username = 'deleted-<id>'
CREATE TABLE profiles (
                          id                serial        PRIMARY KEY,
                          account_id        integer       NULL UNIQUE    -- NULL nach Anonymisierung
                      REFERENCES accounts (id) ON DELETE SET NULL,
                          username          varchar(100)  NOT NULL UNIQUE  -- 'deleted-<id>' nach Anonymisierung
                              CHECK (length(trim(username)) BETWEEN 3 AND 100),
                          avatar_file_id    integer       NULL UNIQUE
                      REFERENCES files (id) ON DELETE SET NULL,
                          updated_at        timestamptz   NOT NULL DEFAULT now(),

    -- Praefix 'deleted-' ist anonymisierten Profilen vorbehalten (verhindert Kollision mit 'deleted-<id>')
                          CONSTRAINT chk_profiles_deleted_username
                              CHECK (account_id IS NULL OR username NOT LIKE 'deleted-%')
);
--rollback DROP TABLE profiles;


-- =====================================================================
-- 3. Threads & Beiträge
-- =====================================================================

--changeset luca:001-create-threads
--comment Forum-Threads mit Soft Delete; FK auf die Loesung (solution_post_id) folgt nach posts
CREATE TABLE threads (
                         id                serial       PRIMARY KEY,
                         title             text         NOT NULL
                             CHECK (length(trim(title)) BETWEEN 5 AND 200),
                         created_at        timestamptz  NOT NULL DEFAULT now(),
                         created_by        integer      NOT NULL REFERENCES profiles (id),
                         solution_post_id  integer      NULL,
                         updated_at        timestamptz  NULL,
                         deleted_at        timestamptz  NULL,
                         deleted_by        integer      NULL REFERENCES profiles (id),

    -- Soft Delete: entweder beides gesetzt oder beides leer
                         CONSTRAINT chk_threads_soft_delete
                             CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))
);
--rollback DROP TABLE threads;

--changeset luca:001-create-posts
--comment Beitraege innerhalb eines Threads mit Soft Delete
CREATE TABLE posts (
                       id          serial       PRIMARY KEY,
                       content     text         NOT NULL
                           CHECK (length(trim(content)) BETWEEN 1 AND 20000),
                       created_at  timestamptz  NOT NULL DEFAULT now(),
                       thread_id   integer      NOT NULL REFERENCES threads (id),
                       created_by  integer      NOT NULL REFERENCES profiles (id),
                       updated_at  timestamptz  NULL,
                       deleted_at  timestamptz  NULL,
                       deleted_by  integer      NULL REFERENCES profiles (id),

                       CONSTRAINT chk_posts_soft_delete
                           CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))
);
--rollback DROP TABLE posts;


-- =====================================================================
-- 4. Verknüpfungs- und abhängige Tabellen
-- =====================================================================

--changeset luca:001-create-threads-categories
--comment n:m-Zuordnung von Threads zu Kategorien
CREATE TABLE threads_categories (
                                    thread_id    integer  NOT NULL REFERENCES threads (id)    ON DELETE CASCADE,
                                    category_id  integer  NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
                                    PRIMARY KEY (thread_id, category_id)
);
--rollback DROP TABLE threads_categories;

--changeset luca:001-create-attachments
--comment Dateianhaenge von Beitraegen; jede Datei gehoert zu genau einem Beitrag
CREATE TABLE attachments (
                             id       serial   PRIMARY KEY,
                             post_id  integer  NOT NULL REFERENCES posts (id),
                             file_id  integer  NOT NULL UNIQUE REFERENCES files (id) ON DELETE CASCADE
);
--rollback DROP TABLE attachments;


-- =====================================================================
-- 5. Nachträgliche Fremdschlüssel (zirkuläre Abhängigkeit threads <-> posts)
-- =====================================================================

--changeset luca:001-add-fk-threads-solution-post
--comment FK threads.solution_post_id -> posts, nachtraeglich wegen zirkulaerer Abhaengigkeit
ALTER TABLE threads
    ADD CONSTRAINT fk_threads_solution_post
        FOREIGN KEY (solution_post_id) REFERENCES posts (id)
            ON DELETE SET NULL;
--rollback ALTER TABLE threads DROP CONSTRAINT fk_threads_solution_post;
