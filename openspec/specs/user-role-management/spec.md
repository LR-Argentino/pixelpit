# user-role-management Specification

## Purpose

Administratoren verwalten über das Administrator-Dashboard die Rollen der Mitglieder (USER, MODERATOR, ADMIN). Gäste, USER und MODERATOR haben auf diese Funktion keinen Zugriff.

## Requirements

### Requirement: Mitgliederliste für Administratoren
Das System SHALL einem ADMIN eine seitenweise Liste aller bestehenden Konten liefern. Jeder Eintrag enthält Account-ID, Benutzername, E-Mail und Rolle. Die Liste ist nach Account-ID aufsteigend sortiert und hat standardmäßig 20 Einträge pro Seite. Gelöschte Konten erscheinen nicht.

#### Scenario: Admin ruft die Mitgliederliste ab
- **WHEN** ein angemeldeter ADMIN die Mitgliederliste abruft und drei Konten existieren
- **THEN** antwortet das System mit 200 und liefert alle drei Konten mit Benutzername, E-Mail und Rolle sowie die Seiteninformationen (Seite, Größe, Gesamtzahl)

#### Scenario: Liste wird seitenweise geliefert
- **WHEN** ein ADMIN die zweite Seite mit Seitengröße 2 abruft und fünf Konten existieren
- **THEN** antwortet das System mit 200 und liefert das dritte und vierte Konto

#### Scenario: Gelöschte Konten fehlen
- **WHEN** ein Mitglied sein Konto gelöscht hat und ein ADMIN die Mitgliederliste abruft
- **THEN** enthält die Liste dieses Konto nicht

#### Scenario: Gast hat keinen Zugriff
- **WHEN** ein Gast die Mitgliederliste abruft
- **THEN** antwortet das System mit 401

#### Scenario: USER und MODERATOR haben keinen Zugriff
- **WHEN** ein angemeldeter USER oder MODERATOR die Mitgliederliste abruft
- **THEN** antwortet das System mit 403

### Requirement: Rolle eines Mitglieds ändern
Das System SHALL einem ADMIN erlauben, einem anderen Konto eine der Rollen USER, MODERATOR oder ADMIN zuzuweisen. Die Antwort enthält den aktualisierten Eintrag. Die neue Rolle gilt für das betroffene Mitglied ab seinem nächsten Login.

#### Scenario: Admin ernennt einen Moderator
- **WHEN** ein ADMIN einem USER die Rolle MODERATOR zuweist
- **THEN** antwortet das System mit 200, liefert das Konto mit Rolle MODERATOR, und die Mitgliederliste zeigt danach MODERATOR für dieses Konto

#### Scenario: Admin stuft einen anderen Admin herab
- **WHEN** ein ADMIN einem anderen ADMIN die Rolle USER zuweist
- **THEN** antwortet das System mit 200 und das Konto hat die Rolle USER

#### Scenario: Gleiche Rolle erneut zuweisen
- **WHEN** ein ADMIN einem MODERATOR die Rolle MODERATOR zuweist
- **THEN** antwortet das System mit 200 und die Rolle bleibt MODERATOR

#### Scenario: Neue Rolle wirkt ab dem nächsten Login
- **WHEN** ein ADMIN einem USER die Rolle ADMIN zuweist und dieser sich danach neu anmeldet
- **THEN** meldet das System bei der Abfrage des angemeldeten Nutzers die Rolle ADMIN

#### Scenario: Unbekanntes Konto
- **WHEN** ein ADMIN einem nicht existierenden Konto eine Rolle zuweist
- **THEN** antwortet das System mit 404 und einer Fehlermeldung, dass das Konto nicht gefunden wurde

#### Scenario: Ungültige oder fehlende Rolle
- **WHEN** ein ADMIN eine Rolle zuweist, die nicht USER, MODERATOR oder ADMIN ist, oder keine Rolle angibt
- **THEN** antwortet das System mit 400 und die Rolle des Kontos bleibt unverändert

#### Scenario: Gast darf keine Rollen ändern
- **WHEN** ein Gast versucht, eine Rolle zuzuweisen
- **THEN** antwortet das System mit 401

#### Scenario: USER und MODERATOR dürfen keine Rollen ändern
- **WHEN** ein angemeldeter USER oder MODERATOR versucht, eine Rolle zuzuweisen
- **THEN** antwortet das System mit 403 und die Rolle des Zielkontos bleibt unverändert

### Requirement: Eigene Rolle ist geschützt
Das System SHALL verhindern, dass ein ADMIN seine eigene Rolle ändert. So bleibt immer mindestens ein Administrator erhalten.

#### Scenario: Admin versucht sich selbst herabzustufen
- **WHEN** ein ADMIN seinem eigenen Konto die Rolle USER zuweist
- **THEN** antwortet das System mit 409 und der Meldung „Die eigene Rolle kann nicht geändert werden“, und seine Rolle bleibt ADMIN

#### Scenario: Eigene Rolle ist in der Oberfläche nicht wählbar
- **WHEN** ein ADMIN in der Benutzerverwaltung das Aktionsmenü seiner eigenen Zeile betrachtet
- **THEN** ist die Rollenauswahl dort deaktiviert

#### Scenario: Rollen anderer Konten bleiben wählbar
- **WHEN** ein ADMIN das Aktionsmenü eines anderen Mitglieds öffnet
- **THEN** kann er dort USER, MODERATOR oder ADMIN wählen

### Requirement: Benutzerverwaltung im Dashboard
Das System SHALL einem ADMIN unter „Administration / Benutzer“ eine Seite „Benutzerverwaltung“ anzeigen. Jede Zeile zeigt Avatar, Benutzername, E-Mail und ein Rollen-Badge (Benutzer, Moderator, Admin). Über ein Aktionsmenü wählt der ADMIN die neue Rolle, und die aktuelle Rolle ist markiert. Nach einer Änderung zeigt die Zeile die neue Rolle, und bei einem Fehler erscheint eine Fehlermeldung.

#### Scenario: Admin ändert eine Rolle über das Menü
- **WHEN** ein ADMIN in der Zeile eines Benutzers das Aktionsmenü öffnet und „Moderator“ wählt
- **THEN** schließt sich das Menü und die Zeile zeigt das Badge „Moderator“

#### Scenario: Fehler beim Ändern
- **WHEN** das Ändern einer Rolle fehlschlägt
- **THEN** zeigt die Seite eine Fehlermeldung und die Zeile behält ihr bisheriges Rollen-Badge

#### Scenario: Seitenweise blättern
- **WHEN** mehr als 20 Konten existieren und der ADMIN zur nächsten Seite wechselt
- **THEN** zeigt die Liste die nächsten Konten und die Seitennummer steht in der URL

#### Scenario: Navigationseintrag nur für Admins
- **WHEN** ein ADMIN angemeldet ist
- **THEN** zeigt die Sidebar den Abschnitt „Administration“ mit dem Link „Benutzer“

#### Scenario: Kein Navigationseintrag für andere Rollen
- **WHEN** ein Gast, USER oder MODERATOR die Sidebar sieht
- **THEN** ist der Abschnitt „Administration“ nicht sichtbar

#### Scenario: Direktaufruf ohne Admin-Rolle
- **WHEN** ein Gast, USER oder MODERATOR die Adresse der Benutzerverwaltung direkt aufruft
- **THEN** leitet das System auf die Startseite weiter
