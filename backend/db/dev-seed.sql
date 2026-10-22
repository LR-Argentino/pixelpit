-- =====================================================================
-- Testdaten für lokale Entwicklung (NICHT Teil der Liquibase-Changelogs)
-- Wiederholbar: entfernt zuerst alle vorherigen Seed-Daten (@seed.local)
--
-- Ausführen:
--   docker exec -i backend-postgres-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db/dev-seed.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Alte Seed-Daten entfernen
-- ---------------------------------------------------------------------
CREATE TEMP TABLE seed_profiles ON COMMIT DROP AS
SELECT p.id
FROM profiles p
         JOIN accounts a ON a.id = p.account_id
WHERE a.email LIKE '%@seed.local';

UPDATE threads SET solution_post_id = NULL WHERE created_by IN (SELECT id FROM seed_profiles);
DELETE FROM posts WHERE thread_id IN (SELECT id FROM threads WHERE created_by IN (SELECT id FROM seed_profiles));
DELETE FROM threads WHERE created_by IN (SELECT id FROM seed_profiles); -- threads_categories per CASCADE
DELETE FROM profiles WHERE id IN (SELECT id FROM seed_profiles);
DELETE FROM accounts WHERE email LIKE '%@seed.local';

-- ---------------------------------------------------------------------
-- 2. Kategorien
-- ---------------------------------------------------------------------
INSERT INTO categories (name)
VALUES ('Programmierung'), ('Grafik'), ('Audio'), ('Engines'), ('Game Design'), ('Showcase'), ('Community')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Nutzer, Threads und Posts
-- ---------------------------------------------------------------------
DO
$$
    DECLARE
        p_ids     int[];
        p_count   int;
        t         record;
        t_id      int;
        t_n       int := 0;
        t_author  int;
        reply_id  int;
        replies   text[] := ARRAY [
            'Gute Frage, das habe ich mich auch schon gefragt.',
            'Bei uns hat sich bewährt, das so früh wie möglich festzulegen.',
            'Ich würde erst einen Prototyp bauen und dann entscheiden.',
            'Hast du dir dazu schon die GDC-Talks angeschaut? Da gibt es ein paar gute.',
            'Kommt stark auf den Scope an. Für ein kleines Projekt reicht die einfache Variante.',
            'Wir haben das genau so gemacht und es später bereut :D',
            'Kannst du ein Beispiel zeigen? Dann kann ich konkreter helfen.',
            '+1, würde mich auch interessieren.',
            'Ich verlinke dir nachher mal meinen Ansatz.',
            'Danke, das hilft mir weiter!'
            ];
    BEGIN
        -- Accounts + Profile (Passwort-Hash ist ungültig, Login mit diesen Usern ist nicht möglich)
        WITH acc AS (
            INSERT INTO accounts (email, password_hash)
                SELECT u || '@seed.local', 'seed-no-login'
                FROM unnest(ARRAY ['alice', 'bob', 'chris', 'dana', 'emil', 'fiona']) AS u
                RETURNING id, email)
        INSERT
        INTO profiles (account_id, username)
        SELECT id, split_part(email, '@', 1)
        FROM acc;

        SELECT array_agg(p.id ORDER BY p.id)
        INTO p_ids
        FROM profiles p
                 JOIN accounts a ON a.id = p.account_id
        WHERE a.email LIKE '%@seed.local';
        p_count := array_length(p_ids, 1);

        -- age = wann der Thread erstellt wurde, last_ago = wann die letzte Antwort kam
        FOR t IN
            SELECT v.*
            FROM (VALUES ('Wie strukturiert ihr ein ECS, wenn es später Multiplayer werden soll?',
                          'Systeme sauber trennen klingt gut, bis die Replikation dazukommt. Wie viel Netcode packt ihr direkt in die Systeme?',
                          ARRAY ['Programmierung'], interval '32 days', 30, interval '2 hours', false),
                         ('Pixel-Art: Welche Palette für ein düsteres Dungeon-Setting?',
                          'Ich suche eine Palette mit max. 16 Farben, die düster wirkt, aber trotzdem gut lesbar bleibt. Habt ihr Empfehlungen?',
                          ARRAY ['Grafik'], interval '1 day', 5, interval '20 minutes', false),
                         ('Godot 4 oder Unity für das erste 2D-Projekt?',
                          'Ich habe bisher nur kleine Sachen in Pygame gemacht und will jetzt auf eine richtige Engine umsteigen. Was würdet ihr empfehlen?',
                          ARRAY ['Engines'], interval '10 days', 18, interval '3 days', false),
                         ('Chiptune-Soundtrack: Mit welchem Tracker startet ihr?',
                          'Furnace, FamiTracker oder doch was ganz anderes? Ich will authentischen NES-Sound.',
                          ARRAY ['Audio'], interval '6 days', 3, interval '5 days', false),
                         ('Feedback zu meinem Platformer-Prototyp',
                          'Hier ist ein erster spielbarer Build. Mich interessiert vor allem, ob sich der Sprung gut anfühlt.',
                          ARRAY ['Showcase', 'Game Design'], interval '3 days', 7, interval '1 hour', false),
                         ('Wie balanciert ihr Loot-Drops in einem Roguelike?',
                          'Meine Spieler finden entweder zu früh die besten Items oder gar nichts. Wie geht ihr das an?',
                          ARRAY ['Game Design'], interval '14 days', 12, interval '13 days', false),
                         ('Kollisionsabfrage bei schnellen Projektilen (Tunneling)',
                          'Meine Kugeln fliegen bei hoher Geschwindigkeit durch dünne Wände. Raycast pro Frame oder Substeps?',
                          ARRAY ['Programmierung'], interval '4 hours', 0, interval '4 hours', false),
                         ('Suche Mitstreiter für die nächste Game Jam',
                          'Ich programmiere, suche jemanden für Grafik und eventuell Sound. Jam ist in drei Wochen.',
                          ARRAY ['Community'], interval '20 days', 9, interval '30 minutes', false),
                         ('Shader für Pixel-perfektes Upscaling',
                          'Bei nicht-ganzzahligen Skalierungen flimmert mein Spiel. Kennt jemand einen guten Shader dafür?',
                          ARRAY ['Grafik', 'Programmierung'], interval '8 days', 2, interval '7 days', false),
                         ('Wie motiviert ihr euch bei langen Solo-Projekten?',
                          'Ich bin jetzt seit einem Jahr an meinem Spiel dran und merke, wie die Motivation sinkt. Tipps?',
                          ARRAY ['Community'], interval '25 days', 22, interval '1 day', false),
                         ('Save-System: JSON oder Binärformat?',
                          'JSON ist schön zum Debuggen, aber die Dateien werden groß. Was nutzt ihr?',
                          ARRAY ['Programmierung'], interval '2 days', 4, interval '6 hours', false),
                         ('Testthread bitte löschen',
                          'Nur ein Test.',
                          ARRAY ['Community'], interval '5 days', 1, interval '5 days', true)) AS v(title, content, cats, age, reply_count, last_ago, deleted)
            LOOP
                t_n := t_n + 1;
                t_author := p_ids[1 + (t_n % p_count)];

                INSERT INTO threads (title, created_at, created_by, deleted_at, deleted_by)
                VALUES (t.title, now() - t.age, t_author,
                        CASE WHEN t.deleted THEN now() - interval '1 day' END,
                        CASE WHEN t.deleted THEN t_author END)
                RETURNING id INTO t_id;

                INSERT INTO threads_categories (thread_id, category_id)
                SELECT t_id, c.id
                FROM categories c
                WHERE c.name = ANY (t.cats);

                -- Eröffnungspost (gleicher Zeitpunkt und Autor wie der Thread)
                INSERT INTO posts (content, created_at, thread_id, created_by)
                VALUES (t.content, now() - t.age, t_id, t_author);

                -- Antworten, gleichmäßig verteilt zwischen Erstellung und letzter Aktivität
                INSERT INTO posts (content, created_at, thread_id, created_by)
                SELECT replies[1 + (i % array_length(replies, 1))],
                       now() - t.age + (t.age - t.last_ago) * i / t.reply_count,
                       t_id,
                       p_ids[1 + ((t_n + i) % p_count)]
                FROM generate_series(1, t.reply_count) AS i;
            END LOOP;

        -- Lösung markieren: 3. Antwort im Godot/Unity-Thread
        SELECT p.id
        INTO reply_id
        FROM posts p
                 JOIN threads th ON th.id = p.thread_id
        WHERE th.title LIKE 'Godot 4 oder Unity%'
        ORDER BY p.id
        OFFSET 3 LIMIT 1;
        UPDATE threads SET solution_post_id = reply_id WHERE title LIKE 'Godot 4 oder Unity%';

        -- Einen Post soft-deleten: 5. Antwort im ECS-Thread
        UPDATE posts
        SET deleted_at = now() - interval '1 day',
            deleted_by = created_by
        WHERE id = (SELECT p.id
                    FROM posts p
                             JOIN threads th ON th.id = p.thread_id
                    WHERE th.title LIKE 'Wie strukturiert ihr ein ECS%'
                    ORDER BY p.id
                    OFFSET 5 LIMIT 1);
    END
$$;

COMMIT;
