# Spec Delta

## Purpose

Angemeldete Nutzer können ihr eigenes Konto löschen, damit ihre personenbezogenen Daten entfernt werden (DSGVO, Recht auf Löschung). Ihre Inhalte im Forum bleiben unter einem anonymisierten Namen erhalten.

## ADDED Requirements

### Requirement: Nur angemeldete Nutzer löschen ihr eigenes Konto
Das System SHALL angemeldeten Nutzern mit der Rolle USER, MODERATOR oder ADMIN erlauben, ihr eigenes Konto zu löschen, ohne Sonderregel für eine Rolle. Gäste MUST abgewiesen werden. Ein Nutzer MUST immer nur sein eigenes Konto löschen können.

#### Scenario: USER löscht sein Konto
- **WHEN** ein angemeldeter USER die Löschung seines Kontos mit seinem korrekten Passwort anfordert
- **THEN** antwortet das System mit 204 und sein Konto ist gelöscht

#### Scenario: MODERATOR und ADMIN löschen ihr Konto
- **WHEN** ein angemeldeter MODERATOR oder ADMIN die Löschung seines Kontos mit seinem korrekten Passwort anfordert
- **THEN** antwortet das System mit 204 und sein Konto ist gelöscht

#### Scenario: Gast wird abgewiesen
- **WHEN** ein Gast die Löschung eines Kontos anfordert
- **THEN** antwortet das System mit 401 und kein Konto wird gelöscht

#### Scenario: Andere Konten bleiben unberührt
- **WHEN** ein angemeldeter USER sein Konto löscht und ein anderer Nutzer ein Konto hat
- **THEN** kann sich der andere Nutzer weiterhin anmelden und sein Profil ist unverändert

### Requirement: Löschung erfordert das aktuelle Passwort
Das System SHALL eine Kontolöschung nur ausführen, wenn der Nutzer sein aktuelles Passwort mitschickt. Bei falschem oder fehlendem Passwort MUST das Konto vollständig unverändert bleiben und der Nutzer angemeldet bleiben.

#### Scenario: Korrektes Passwort
- **WHEN** ein angemeldeter USER die Löschung mit seinem korrekten Passwort anfordert
- **THEN** antwortet das System mit 204

#### Scenario: Falsches Passwort
- **WHEN** ein angemeldeter USER die Löschung mit einem falschen Passwort anfordert
- **THEN** antwortet das System mit 403 und einer deutschen Fehlermeldung, sein Konto und sein Profil bleiben unverändert und er bleibt angemeldet

#### Scenario: Passwort fehlt
- **WHEN** ein angemeldeter USER die Löschung ohne oder mit leerem Passwort anfordert
- **THEN** antwortet das System mit 400 und sein Konto bleibt unverändert

### Requirement: Login-Daten werden entfernt
Nach einer Kontolöschung SHALL das System die Login-Daten des Nutzers (E-Mail-Adresse, Passwort, Rolle) vollständig entfernen. Eine Anmeldung mit den alten Zugangsdaten MUST danach scheitern. Die E-Mail-Adresse MUST danach für eine neue Registrierung frei sein.

#### Scenario: Anmeldung nach der Löschung scheitert
- **WHEN** ein Nutzer sein Konto gelöscht hat und sich mit seiner alten E-Mail-Adresse oder seinem alten Benutzernamen und seinem alten Passwort anmelden will
- **THEN** antwortet das System mit 401

#### Scenario: E-Mail-Adresse ist wieder frei
- **WHEN** ein Nutzer mit der E-Mail „blackbird@example.com“ sein Konto gelöscht hat und sich jemand mit dieser E-Mail-Adresse neu registriert
- **THEN** antwortet das System mit 201

### Requirement: Profil wird anonymisiert
Nach einer Kontolöschung SHALL das Profil des Nutzers erhalten bleiben, aber keinem Konto mehr zugeordnet sein. Sein Benutzername MUST zu `deleted-<id>` werden, und es MUST kein Avatar mehr zugeordnet sein. Der alte Benutzername MUST danach für eine neue Registrierung frei sein.

#### Scenario: Benutzername wird anonymisiert
- **WHEN** der Nutzer „blackbird“ sein Konto löscht
- **THEN** trägt sein Profil den Benutzernamen `deleted-<id>`, und „blackbird“ erscheint nirgends mehr im Forum

#### Scenario: Benutzername ist wieder frei
- **WHEN** der Nutzer „blackbird“ sein Konto gelöscht hat und sich jemand mit dem Benutzernamen „blackbird“ neu registriert
- **THEN** antwortet das System mit 201

#### Scenario: Fehlgeschlagene Löschung lässt das Profil unverändert
- **WHEN** der Nutzer „blackbird“ die Löschung mit einem falschen Passwort anfordert
- **THEN** antwortet das System mit 403 und sein Profil trägt weiterhin den Benutzernamen „blackbird“

### Requirement: Inhalte bleiben anonymisiert erhalten
Threads, Beiträge und Anhänge eines gelöschten Kontos SHALL mit unverändertem Inhalt erhalten bleiben und für alle Besucher (Gast, USER, MODERATOR, ADMIN) unter dem Benutzernamen `deleted-<id>` erscheinen. Eine Kontolöschung MUST NOT Threads oder Beiträge löschen oder als gelöscht markieren.

#### Scenario: Beiträge erscheinen unter dem anonymisierten Namen
- **WHEN** der Nutzer „blackbird“ einen Thread und eine Antwort geschrieben hat und danach sein Konto löscht
- **THEN** liefert das System den Thread und die Antwort weiterhin mit 200, mit unverändertem Titel und Inhalt und dem Benutzernamen `deleted-<id>`

#### Scenario: Aktivität anderer Nutzer bleibt unverändert
- **WHEN** ein anderer Nutzer im Thread von „blackbird“ geantwortet hat und „blackbird“ danach sein Konto löscht
- **THEN** erscheint die Antwort des anderen Nutzers weiterhin unter dessen Benutzernamen

#### Scenario: Fehlgeschlagene Löschung lässt die Inhalte unverändert
- **WHEN** der Nutzer „blackbird“ die Löschung mit einem falschen Passwort anfordert
- **THEN** erscheinen seine Beiträge weiterhin unter dem Benutzernamen „blackbird“

### Requirement: Nutzer ist nach der Löschung abgemeldet
Nach einer erfolgreichen Kontolöschung SHALL die Sitzung, aus der gelöscht wurde, beendet sein. Andere Sitzungen desselben Nutzers werden nicht aktiv beendet und laufen nach dem Session-Timeout aus.

#### Scenario: Sitzung ist nach der Löschung beendet
- **WHEN** ein angemeldeter USER sein Konto löscht und danach mit derselben Sitzung seine Profildaten abruft
- **THEN** antwortet das System mit 401

#### Scenario: Sitzung bleibt bei falschem Passwort bestehen
- **WHEN** ein angemeldeter USER die Löschung mit einem falschen Passwort anfordert und danach seine Profildaten abruft
- **THEN** antwortet das System mit 200 und liefert seine Profildaten

### Requirement: Konto löschen im Frontend
Die Profilseite SHALL angemeldeten Nutzern (USER, MODERATOR, ADMIN) einen Bereich „Konto löschen“ bieten. Dort MUST ein Hinweis stehen, dass die Löschung endgültig ist und Threads und Beiträge anonymisiert erhalten bleiben. Die Löschung MUST erst nach Eingabe des Passworts und ausdrücklicher Bestätigung ausgelöst werden. Gäste MUST den Bereich nicht sehen.

#### Scenario: Nutzer löscht sein Konto über die Profilseite
- **WHEN** ein angemeldeter USER auf der Profilseite „Konto löschen“ wählt, sein korrektes Passwort eingibt und bestätigt
- **THEN** ist er abgemeldet, landet auf der Startseite, und die Sidebar zeigt keinen angemeldeten Nutzer mehr

#### Scenario: Hinweis vor der Bestätigung
- **WHEN** ein angemeldeter USER auf der Profilseite „Konto löschen“ wählt
- **THEN** sieht er vor der Bestätigung den Hinweis, dass die Löschung endgültig ist und seine Threads und Beiträge anonymisiert erhalten bleiben

#### Scenario: Falsches Passwort im Frontend
- **WHEN** ein angemeldeter USER ein falsches Passwort eingibt und bestätigt
- **THEN** zeigt die Profilseite eine Fehlermeldung, er bleibt angemeldet und auf der Profilseite

#### Scenario: Nutzer bricht ab
- **WHEN** ein angemeldeter USER „Konto löschen“ wählt und danach abbricht
- **THEN** wird keine Löschung angefordert und die Passworteingabe verschwindet wieder

#### Scenario: Gast sieht keinen Lösch-Bereich
- **WHEN** ein Gast die Profilseite öffnet
- **THEN** sieht er keinen Bereich „Konto löschen“
