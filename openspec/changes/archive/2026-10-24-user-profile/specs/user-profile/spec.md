# Spec Delta

## Purpose

Angemeldete Nutzer sehen auf einer eigenen Profilseite ihren Benutzernamen, ihre E-Mail-Adresse und wie viele Threads und Posts sie im Forum geschrieben haben.

## ADDED Requirements

### Requirement: Nur angemeldete Nutzer sehen ihr Profil
Das System SHALL angemeldeten Nutzern mit der Rolle USER, MODERATOR oder ADMIN ihre eigenen Profildaten liefern. Gäste MUST abgewiesen werden. Ein Nutzer MUST immer nur seine eigenen Profildaten erhalten.

#### Scenario: USER ruft seine Profildaten ab
- **WHEN** ein angemeldeter USER mit dem Benutzernamen „blackbird“ und der E-Mail „blackbird@example.com“ seine Profildaten abruft
- **THEN** antwortet das System mit 200 und liefert den Benutzernamen „blackbird“ und die E-Mail „blackbird@example.com“

#### Scenario: MODERATOR und ADMIN rufen ihre Profildaten ab
- **WHEN** ein angemeldeter MODERATOR oder ADMIN seine Profildaten abruft
- **THEN** antwortet das System mit 200 und liefert seine eigenen Daten

#### Scenario: Gast wird abgewiesen
- **WHEN** ein Gast Profildaten abrufen will
- **THEN** antwortet das System mit 401

### Requirement: Profil zeigt die Anzahl der Threads
Das System SHALL zu den Profildaten die Anzahl der Threads liefern, die der Nutzer erstellt hat. Es MUST nur sichtbare Threads zählen. Ein Thread ist nicht sichtbar, wenn er selbst oder sein Eröffnungsbeitrag gelöscht ist. Threads anderer Nutzer MUST NOT mitgezählt werden.

#### Scenario: Eigene Threads werden gezählt
- **WHEN** ein angemeldeter USER zwei Threads erstellt hat, ein anderer Nutzer einen Thread erstellt hat und der USER seine Profildaten abruft
- **THEN** antwortet das System mit 200 und die Anzahl der Threads ist 2

#### Scenario: Neuer Nutzer ohne Threads
- **WHEN** ein angemeldeter USER, der noch keinen Thread erstellt hat, seine Profildaten abruft
- **THEN** antwortet das System mit 200 und die Anzahl der Threads ist 0

#### Scenario: Gelöschter Thread zählt nicht
- **WHEN** ein angemeldeter USER zwei Threads erstellt hat, einer davon gelöscht ist und der USER seine Profildaten abruft
- **THEN** antwortet das System mit 200 und die Anzahl der Threads ist 1

#### Scenario: Thread mit gelöschtem Eröffnungsbeitrag zählt nicht
- **WHEN** ein angemeldeter USER einen Thread erstellt hat, dessen Eröffnungsbeitrag gelöscht ist, und der USER seine Profildaten abruft
- **THEN** antwortet das System mit 200 und die Anzahl der Threads ist 0

### Requirement: Profil zeigt die Anzahl der Posts
Das System SHALL zu den Profildaten die Anzahl der Beiträge liefern, die der Nutzer geschrieben hat. Der Eröffnungsbeitrag eines Threads MUST als Beitrag mitzählen. Es MUST nur Beiträge zählen, die selbst nicht gelöscht sind und in einem sichtbaren Thread stehen. Beiträge anderer Nutzer MUST NOT mitgezählt werden.

#### Scenario: Eröffnungsbeitrag und Antworten werden gezählt
- **WHEN** ein angemeldeter USER einen Thread erstellt und zwei Antworten in Threads geschrieben hat und seine Profildaten abruft
- **THEN** antwortet das System mit 200 und die Anzahl der Posts ist 3

#### Scenario: Beiträge anderer Nutzer zählen nicht
- **WHEN** ein anderer Nutzer im Thread eines angemeldeten USER antwortet und der USER seine Profildaten abruft
- **THEN** antwortet das System mit 200 und die Antwort des anderen Nutzers ist nicht in der Anzahl der Posts des USER enthalten

#### Scenario: Gelöschter Beitrag zählt nicht
- **WHEN** ein angemeldeter USER zwei Antworten geschrieben hat, eine davon gelöscht ist und der USER seine Profildaten abruft
- **THEN** antwortet das System mit 200 und nur die nicht gelöschte Antwort ist in der Anzahl der Posts enthalten

#### Scenario: Beitrag in gelöschtem Thread zählt nicht
- **WHEN** ein angemeldeter USER in einem fremden Thread geantwortet hat, dieser Thread danach gelöscht wurde und der USER seine Profildaten abruft
- **THEN** antwortet das System mit 200 und die Antwort ist nicht in der Anzahl der Posts enthalten

### Requirement: Profilseite im Frontend
Das Frontend SHALL angemeldeten Nutzern eine Profilseite mit Benutzername, E-Mail, Anzahl der Threads und Anzahl der Posts anzeigen. Die Seite MUST die Daten beim Öffnen neu laden, damit gerade erstellte Threads und Posts mitgezählt sind. Die Sidebar SHALL angemeldeten Nutzern einen Link zur Profilseite anzeigen. Gäste MUST statt der Profildaten einen Hinweis zur Anmeldung sehen.

#### Scenario: Angemeldeter Nutzer öffnet sein Profil
- **WHEN** ein angemeldeter USER in der Sidebar den Link zum Profil wählt
- **THEN** zeigt die Profilseite seinen Benutzernamen, seine E-Mail sowie die Anzahl seiner Threads und Posts

#### Scenario: Zahlen sind nach neuem Beitrag aktuell
- **WHEN** ein angemeldeter USER einen Thread erstellt und danach seine Profilseite öffnet
- **THEN** sind der neue Thread und sein Eröffnungsbeitrag in den angezeigten Zahlen enthalten

#### Scenario: Gast öffnet die Profilseite
- **WHEN** ein Gast die Profilseite direkt über ihre Adresse aufruft
- **THEN** sieht er keine Profildaten, sondern einen Hinweis mit Link zur Anmeldung

#### Scenario: Gast sieht keinen Profil-Link
- **WHEN** ein Gast die Sidebar betrachtet
- **THEN** wird kein Link zur Profilseite angezeigt
