# Spec Delta

## ADDED Requirements

### Requirement: Beitrag ist direkt anspringbar
Jeder Beitrag auf der Detailseite SHALL über die Adresse `/threads/<id>?seite=<n>#beitrag-<beitrags-id>` direkt anspringbar sein, für alle Besucher (Gast, USER, MODERATOR, ADMIN) gleich. Steht der Beitrag auf der geöffneten Seite, MUST die Detailseite nach dem Laden der Beiträge zu ihm scrollen. Steht er nicht auf dieser Seite, MUST die Seite ohne Fehlermeldung wie gewohnt erscheinen.

#### Scenario: Beitrag auf der geöffneten Seite
- **WHEN** ein Gast `/threads/<id>?seite=2#beitrag-25` öffnet und Beitrag 25 auf Seite 2 steht
- **THEN** zeigt die Detailseite Seite 2 und Beitrag 25 ist im sichtbaren Bereich

#### Scenario: Angemeldeter Nutzer springt zum selben Beitrag
- **WHEN** ein angemeldeter USER dieselbe Adresse öffnet
- **THEN** zeigt die Detailseite denselben Beitrag im sichtbaren Bereich

#### Scenario: Beitrag steht nicht auf der Seite
- **WHEN** ein Besucher `/threads/<id>#beitrag-999` öffnet und es auf Seite 1 keinen Beitrag 999 gibt
- **THEN** zeigt die Detailseite Seite 1 ohne Fehlermeldung
