# Scentboxd — Projektfortschritt

Dieses Dokument dient dazu, unseren Entwicklungsfortschritt zu tracken. Hier notieren wir alle bereits erledigten Features, Bugfixes und Datenbankänderungen.

## ✅ Erledigt (Stand: 01.05.2026)

### Fokus: Datenbank, Supabase & API

**1. Datenbank Schema & RLS (Row Level Security)**
- Redundante und überlappende RLS-Policies auf allen Tabellen aufgeräumt und durch ein klares, sicheres Konzept ersetzt.
- `created_at` Feld zur `profiles` Tabelle hinzugefügt.
- Neue Tabelle `follows` erstellt (follower_id, following_id) für das Follow-System (Auto-Accept Modus).
- Neue Tabelle `comments` erstellt für Kommentare unter Reviews.
- RLS so konfiguriert, dass Sammlungen (`user_perfumes`) öffentlich auf Profilen sichtbar sind, während Schreibrechte streng auf den eigenen User beschränkt bleiben.

**2. Supabase Storage**
- Neuen öffentlichen Bucket `avatars` für Profilbilder erstellt.
- Datei-Upload auf max. 2 MB begrenzt und auf Bildformate limitiert (JPEG, PNG, WEBP, GIF).
- Storage-RLS eingerichtet: User können Bilder nur in ihren eigenen Ordner (`avatars/<uid>/`) hochladen, aktualisieren oder löschen.

**3. API & Services (Frontend)**
- `followService.js` neu angelegt: Bietet Methoden zum Folgen, Entfolgen und Abrufen von Followern/Followings.
- `commentService.js` neu angelegt: Bietet Methoden zum Erstellen, Bearbeiten, Löschen und Abrufen von Review-Kommentaren.
- Bugfix: Pagination in der Duft-Suche repariert, indem der `noteFamily`-Filter serverseitig über eine neue Supabase RPC-Funktion (`get_perfumes_by_note_family`) ausgeführt wird.

**4. Sonstige Fixes & Setup**
- Memory-Leak im `authStore.js` (Zustand) behoben, indem der Supabase Auth-Listener nun korrekt beim Unmount aufgeräumt wird (Cleanup-Funktion in `App.jsx`).
- Bugfix in `ProfilePage.jsx`: Das Anmeldedatum ("Joined") nutzt nun korrekterweise `created_at` statt `updated_at`.
- Vorlage `.env.example` mit den nötigen Supabase-Variablen erstellt.
- **Supabase Security Fixes (Advisor Warnings):**
  - Alle Datenbankfunktionen (RPCs) auf `SECURITY INVOKER` umgestellt und expliziten `search_path` gesetzt, um "Search Path Injection"-Schwachstellen zu vermeiden.
  - Supabase-Erweiterung `pg_trgm` ins `extensions`-Schema verschoben.
  - Großzügige `SELECT`-Policy vom `avatars`-Bucket entfernt, um unerwünschtes Auflisten (Directory Listing) der Avatare zu unterbinden (Lesezugriff funktioniert weiterhin via Direct-URL).

---

## 🚀 Nächste Schritte (Frontend-Fokus)

*(Basierend auf dem Projektplan)*
- UI für Avatar-Upload in der Profilbearbeitung einbauen.
- Follow-Button und Follower-Liste im Profil verdrahten.
- Kommentar-Komponente für Reviews im Frontend bauen.
- Protected Routes (`<RequireAuth>`) und Error-Boundaries implementieren.
