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

## ✅ Erledigt (Stand: 04.05.2026)

### Durchschnittsbewertung (Community Ratings)

**1. Datenbank**
- Neue View `perfume_avg_ratings` erstellt: Aggregiert `AVG(rating)`, `COUNT(*)`, `AVG(longevity)`, `AVG(sillage)` pro Parfüm aus der `reviews`-Tabelle.
- Neue RPC-Funktion `get_perfume_rating(p_perfume_id)` für Einzelabfragen (z.B. auf der Detailseite). Konfiguriert als `SECURITY INVOKER` mit explizitem `search_path`.

**2. Frontend Service (`perfumeService.js`)**
- `getPerfumeRatings(perfumeIds)` — Batch-Abruf der Ratings für eine Liste von Parfüm-IDs. Gibt eine `Map<perfumeId, {avg_rating, review_count, ...}>` zurück.
- `getPerfumeRating(perfumeId)` — Einzelabruf via RPC für die Detailseite.

**3. Frontend Komponenten**
- `PerfumeCard.jsx` akzeptiert jetzt `avgRating` und `reviewCount` Props. Zeigt numerischen Durchschnitt (z.B. "4.2") + Anzahl Reviews (z.B. "(12)") neben den Sternen an. Fallback auf statischen `performance`-Wert wenn keine Reviews existieren.
- `PerfumeGrid.jsx` akzeptiert `ratingsMap` und gibt die Ratings an die einzelnen PerfumeCards weiter.
- `PerfumeCard.css` um Styles für Rating-Text und Review-Count erweitert.

**4. Seiten-Integration**
- `ExplorePage.jsx` — Batch-Fetch der Ratings nach dem Laden der Parfüms.
- `HomePage.jsx` — Batch-Fetch für die "Recently Added"-Sektion.
- `BrandPage.jsx` — Batch-Fetch für alle Parfüms der Marke.
- `PerfumeDetailPage.jsx` — Nutzt jetzt `getPerfumeRating()` statt client-seitiger Berechnung. Rating wird nach Review-Erstellen, -Bearbeiten und -Löschen automatisch aktualisiert.

### Review-Likes & ListService Fix
- **Review-Likes RLS:** Geprüft. Die Policies in Supabase (Auth Insert/Delete, Public Read) sind bereits korrekt und vollständig eingerichtet. Das UI kann gefahrlos an `reviewService.js` angebunden werden.
- **Bugfix #7:** `listService.js` (`createList`) setzt nun explizit die `user_id` aus der aktiven Supabase-Session, um verwaiste Listen zu verhindern.

### Volltext-Suche (Fuzzy Search mit pg_trgm)
- **Datenbank:** 
  - GIN-Indizes (`gin_trgm_ops`) für `perfumes.name` und `brands.name` erstellt, um Suchen drastisch zu beschleunigen.
  - Neue RPC-Funktion `search_perfumes_table` erstellt, die Trigram-Similarity (`word_similarity`) und `ILIKE` kombiniert, um Parfüms über Parfüm-Namen oder Marken-Namen zu finden (toleriert Tippfehler). Gibt `SETOF perfumes` zurück.
- **Frontend (`perfumeService.js`):** 
  - Die Suche nutzt nun die neue `search_perfumes_table` RPC. Da diese RPC einen kompletten Table-RowType zurückgibt, können `.select()` und Joins (`brands`, `perfume_notes`) nahtlos angehängt werden!
  - **Bugfix (Pagination Count stuck):** Vorher wurden große Listen von IDs via `.in('id', array)` übergeben, was zu "URI Too Long" Fehlern bei PostgREST führte. Die neue Architektur filtert komplett serverseitig (RPC + `!inner` Joins für Duftfamilien), wodurch die Pagination und Total Counts zu 100% verlässlich bleiben und URLs kurz sind.

### Avatar Upload (Backend)
- Neue Methode `uploadAvatar(file)` in `profileService.js` implementiert. Lädt Bilder in den `avatars`-Bucket hoch (sicher durch bestehende RLS-Policies im Pfad `user.id/filename`), holt die Public-URL und aktualisiert automatisch die `avatar_url` des User-Profils. Das Frontend kann dies nun in der Profilbearbeitung einbauen.

### Security & Stabilität (Frontend)
- `<RequireAuth>` Komponente gebaut (`client/src/components/auth/RequireAuth.jsx`), mit der das Frontend private Ansichten absichern und unberechtigte Nutzer sauber zum Login umleiten kann.
- `<ErrorBoundary>` Komponente gebaut (`client/src/components/common/ErrorBoundary.jsx`) und um die gesamte `App.jsx` gelegt. Sie fängt jegliche Frontend-Abstürze elegant ab und zeigt dem Nutzer einen hilfreichen Fehler-Screen ("Oops, something went wrong!"), statt eine kaputte weiße Seite zu hinterlassen.

---

## 🚀 Nächste Schritte (Frontend-Fokus)

*(Basierend auf dem Projektplan)*
- UI für Avatar-Upload in der Profilbearbeitung einbauen.
- Follow-Button und Follower-Liste im Profil verdrahten.
- Kommentar-Komponente für Reviews im Frontend bauen.
