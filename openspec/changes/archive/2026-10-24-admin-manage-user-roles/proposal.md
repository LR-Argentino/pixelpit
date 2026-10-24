# Proposal

## Why

Rollen (USER, MODERATOR, ADMIN) gibt es im Datenmodell schon, ändern lassen sie sich aber nur direkt in der Datenbank. Damit Moderatoren und weitere Admins ernannt werden können, braucht ein Administrator dafür eine Oberfläche: den ersten Teil des Administrator-Dashboards.

## What Changes

- **Backend:** Neuer Endpoint `GET /api/admin/accounts`. Er liefert eine seitenweise Liste aller Konten mit Benutzername, E-Mail und Rolle und ist nur für ADMIN erreichbar.
- **Backend:** Neuer Endpoint `PATCH /api/admin/accounts/{id}/role`. Ein ADMIN weist damit einem Konto eine der Rollen USER, MODERATOR oder ADMIN zu.
- **Backend:** Ein ADMIN kann seine eigene Rolle nicht ändern. Dadurch bleibt immer mindestens ein Admin übrig.
- **Backend:** Erste rollenbasierte Zugriffsregel in der Security-Konfiguration: `/api/admin/**` nur für ADMIN.
- **Frontend:** Neue Seite „Benutzerverwaltung“ unter `/admin/benutzer` nach dem Magic-Patterns-Design. Sie enthält Breadcrumb, Überschrift, eine Mitgliederliste mit Avatar, Name, E-Mail und Rollen-Badge sowie ein „…“-Menü pro Zeile mit der Rollenauswahl und eine Paginierung.
- **Frontend:** Die Sidebar bekommt einen Abschnitt „Administration“ mit dem Link „Benutzer“. Er ist nur für ADMIN sichtbar.
- **Frontend:** Ein Route-Guard lässt nur ADMIN auf die Seite. Alle anderen landen auf der Startseite.

## Capabilities

### New Capabilities
- `user-role-management`: Ein Administrator sieht alle Mitglieder mit ihrer Rolle und weist ihnen eine Rolle zu. Die Funktion ist nur für ADMIN zugänglich, und die eigene Rolle ist geschützt.

### Modified Capabilities
<!-- keine: bestehende Specs beschreiben keine rollenabhängigen Rechte -->

## Nicht im Umfang

Diese Teile zeigt das Design, sie gehören aber nicht zu dieser Story:

- Status-Badges, Sperren von Thread-Erstellung oder Beiträgen, „Eingeschränkt“/„Gesperrt“
- Passwort zurücksetzen, Profil bearbeiten, fremde Konten löschen
- Mehrfachauswahl und Bulk-Aktionen („Rolle zuweisen“ für mehrere)
- Suche und Rollen-Filter-Chips, Stat-Leiste (Mitglieder/Moderatoren/Admins …)
- „Mitglied einladen“, Audit-Log und „Letzte Admin-Aktionen“
- Karten „Rollen & Rechte“ und die Regeln-Box
- Die übrigen Admin-Menüpunkte (Rollen & Rechte, Meldungen, Audit-Log, Forum-Einstellungen) und der Umbau der Sidebar mit Suchfeld und Admin-Badge im Footer
- Rechte für MODERATOR (z. B. fremde Beiträge bearbeiten). Die Rolle wird nur zugewiesen und schaltet noch nichts frei
- Letzte Aktivität eines Mitglieds (wird bisher nicht gespeichert)
- Playwright-E2E-Tests (die Templates bekommen aber `data-testid`s)

## Geklärte Geschäftsregeln

- Nur ADMIN darf die Benutzerliste sehen und Rollen ändern. MODERATOR und USER haben keinen Zugriff.
- Ein ADMIN darf jedem anderen Konto jede Rolle geben, auch ADMIN, und andere Admins herabstufen.
- Ein ADMIN kann seine eigene Rolle nicht ändern (aus dem Design: „Admins können sich nicht selbst herabsetzen“).
- Gelöschte Konten erscheinen nicht in der Liste, weil sie keinen Account mehr haben.

## Offene Fragen

- **Wann wird eine Rollenänderung wirksam?** Vorgeschlagen und so geplant: ab dem nächsten Login der betroffenen Person. Bis dahin behält ihre bestehende Session die alte Rolle. Das ist im Moment unkritisch, weil außer dem Dashboard noch keine Funktion von der Rolle abhängt. Sollen Herabstufungen sofort greifen, müssten die Sessions der Person beendet werden. Das wäre ein eigener Change.

## Impact

- **Betroffene Module:** beide (backend und frontend)
- **Backend:**
  - `account`: öffentliche API zum Auflisten der Konten und zum Ändern der Rolle, neue Exceptions (Konto nicht gefunden, eigene Rolle), `Account` bekommt eine Methode zum Rollenwechsel
  - `profile`: `ProfileLookUp` bekommt eine Abfrage, die die Benutzernamen zu mehreren Account-IDs auf einmal liefert
  - neues Modul `admin`: REST-Controller und Exception-Handler für `/api/admin/**`
  - `configs/SecurityConfig`: Regel `hasRole("ADMIN")` für `/api/admin/**`
  - keine Schemaänderung (die Spalte `accounts.role` existiert bereits)
- **API:** zwei neue Endpoints unter `/api/admin`. Bestehende Endpoints ändern sich nicht.
- **Frontend:** neues Feature `features/admin/user-management`, neuer `core/admin`-Service, Admin-Guard, neue Route in `app.routes.ts`, Sidebar-Abschnitt „Administration“
