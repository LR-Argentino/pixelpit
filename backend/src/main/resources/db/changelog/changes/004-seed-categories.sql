--liquibase formatted sql

--changeset luca:004-seed-categories
--comment Feste Kategorien des Forums (dieselben wie im Frontend-Mock); bereits vorhandene Namen bleiben unverändert
INSERT INTO categories (name) VALUES ('Engines'), ('Programmierung'), ('Showcase'), ('Off-Topic')
ON CONFLICT (name) DO NOTHING;
--rollback DELETE FROM categories WHERE name IN ('Engines', 'Programmierung', 'Showcase', 'Off-Topic');
