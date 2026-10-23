# Spec Delta

## Purpose

Das Forum hat eine feste Menge von Kategorien, die alle Besucher abrufen können, damit Threads einer Kategorie zugeordnet und nach ihr eingeordnet werden können.

## ADDED Requirements

### Requirement: Das Forum startet mit vier Kategorien
Das System SHALL nach der Einrichtung einer leeren Datenbank genau die Kategorien „Engines“, „Programmierung“, „Showcase“ und „Off-Topic“ kennen. Jeder Kategoriename MUST eindeutig sein.

#### Scenario: Kategorien nach der Einrichtung
- **WHEN** das System auf einer leeren Datenbank eingerichtet wurde und ein Gast die Kategorien abruft
- **THEN** antwortet das System mit 200 und liefert genau „Engines“, „Off-Topic“, „Programmierung“ und „Showcase“

#### Scenario: Doppelter Name ist ausgeschlossen
- **WHEN** eine weitere Kategorie mit einem bereits vorhandenen Namen angelegt werden soll
- **THEN** wird sie nicht angelegt und die Kategorie mit diesem Namen bleibt die einzige

### Requirement: Kategorien sind für alle Besucher abrufbar
Das System SHALL die Liste aller Kategorien mit ID und Name für Gäste und für angemeldete Nutzer mit jeder Rolle (USER, MODERATOR, ADMIN) bereitstellen, alphabetisch nach Name sortiert. Für das Abrufen MUST keine Anmeldung nötig sein. Alle Besucher MUST dieselbe Liste erhalten.

#### Scenario: Gast ruft Kategorien ab
- **WHEN** ein Gast die Kategorien abruft
- **THEN** antwortet das System mit 200 und liefert alle Kategorien mit ID und Name, alphabetisch nach Name

#### Scenario: Angemeldeter Nutzer ruft Kategorien ab
- **WHEN** ein angemeldeter Nutzer mit der Rolle USER, MODERATOR oder ADMIN die Kategorien abruft
- **THEN** antwortet das System mit 200 und liefert dieselbe Liste wie für einen Gast

#### Scenario: Keine Kategorien vorhanden
- **WHEN** es keine Kategorien gibt und ein Gast die Kategorien abruft
- **THEN** antwortet das System mit 200 und einer leeren Liste

#### Scenario: Schreibende Anfrage an die Kategorien
- **WHEN** ein Gast eine Kategorie anlegen will
- **THEN** wird die Anfrage abgewiesen und es entsteht keine Kategorie
