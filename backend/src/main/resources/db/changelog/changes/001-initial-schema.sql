--liquibase formatted sql

-- =====================================================================
-- Web-Forum – Datenbankschema (PostgreSQL)
-- Authentifizierung & Rollen: Keycloak (RBAC) – daher keine accounts/roles
-- Author: Luca Argentino
-- =====================================================================

--changeset luca:001-initial-schema
--comment Ausgangsschema des Forums: Dateien, Kategorien, Profile, Threads, Beitraege

-- =====================================================================
-- 1. Tabellen ohne Abhängigkeiten
-- =====================================================================

-- Metadaten hochgeladener Dateien (Datei selbst liegt im Object Storage)
CREATE TABLE files (
                       id           serial       PRIMARY KEY,
                       file_name    text         NOT NULL,
                       storage_key  text         NOT NULL UNIQUE,
                       mime_type    text         NOT NULL,
                       file_size    bigint       NOT NULL CHECK (file_size > 0),
                       created_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE categories (
                            id    serial  PRIMARY KEY,
                            name  text    NOT NULL UNIQUE
);


-- =====================================================================
-- 2. Profile (öffentliche Nutzerdaten, verknüpft mit Keycloak)
-- =====================================================================

CREATE TABLE profiles (
                          id                serial        PRIMARY KEY,
                          keycloak_user_id  uuid          NULL UNIQUE,   -- NULL nach Anonymisierung
                          username          varchar(100)  NOT NULL
                              CHECK (length(trim(username)) BETWEEN 3 AND 100),
                          avatar_file_id    integer       NULL UNIQUE
                      REFERENCES files (id) ON DELETE SET NULL,
                          updated_at        timestamptz   NOT NULL DEFAULT now()
);


-- =====================================================================
-- 3. Threads & Beiträge
-- =====================================================================

-- solution_post_id verweist auf posts -> FK wird unten per ALTER TABLE ergänzt
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


-- =====================================================================
-- 4. Verknüpfungs- und abhängige Tabellen
-- =====================================================================

CREATE TABLE threads_categories (
                                    thread_id    integer  NOT NULL REFERENCES threads (id)    ON DELETE CASCADE,
                                    category_id  integer  NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
                                    PRIMARY KEY (thread_id, category_id)
);

CREATE TABLE attachments (
                             id       serial   PRIMARY KEY,
                             post_id  integer  NOT NULL REFERENCES posts (id),
                             file_id  integer  NOT NULL UNIQUE REFERENCES files (id) ON DELETE CASCADE
);


-- =====================================================================
-- 5. Nachträgliche Fremdschlüssel (zirkuläre Abhängigkeit threads <-> posts)
-- =====================================================================

ALTER TABLE threads
    ADD CONSTRAINT fk_threads_solution_post
        FOREIGN KEY (solution_post_id) REFERENCES posts (id)
            ON DELETE SET NULL;

--rollback ALTER TABLE threads DROP CONSTRAINT fk_threads_solution_post;
--rollback DROP TABLE attachments;
--rollback DROP TABLE threads_categories;
--rollback DROP TABLE posts;
--rollback DROP TABLE threads;
--rollback DROP TABLE profiles;
--rollback DROP TABLE categories;
--rollback DROP TABLE files;
