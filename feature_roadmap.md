# Feature Roadmap — Scentboxd

## Kritisch (App ist ohne diese Features unvollständig)

- [x] **Profil bearbeiten** — `profileService.updateProfile()` existiert, aber keine UI. Username, Bio und Avatar müssen änderbar sein.
- [x] **Review bearbeiten & löschen** — `deleteReview()` und `updateReview()` sind im Service und in der UI (ReviewCard, PerfumeDetailPage) eingebaut.
- [x] **Listen erstellen & verwalten** — `createList()`, `addToList()`, `removeFromList()` sind alle im Service fertig, aber es gibt keine UI-Komponente dafür. Listen sind aktuell read-only.
- [ ] **Passwort zurücksetzen** — Kein "Passwort vergessen"-Flow. User die ihr Passwort vergessen haben sind ausgesperrt.

## Wichtig (stark eingeschränkte UX)

- [x] **Parfüm zu Liste hinzufügen** — Von der PerfumeDetailPage aus kann man ein Parfüm nicht zu einer Liste hinzufügen — der typischste Anwendungsfall fehlt.
- [ ] **Review liken** — `toggleReviewLike()` und `getReviewLikeCount()` sind implementiert, aber `ReviewCard.jsx` zeigt keine Like-Schaltfläche an.
- [ ] **404-Seite** — Kein Fallback-Route, ungültige URLs zeigen eine leere Seite.
- [ ] **Filter zurücksetzen** — Auf der ExplorePage gibt es keinen "Filter löschen"-Button. Aktive Filter werden nicht angezeigt.

## Nice-to-have (vollwertige Community-Plattform)

- [ ] **Nutzer folgen / Activity Feed** — Klassisches Social-Feature à la Letterboxd, fehlt komplett, kein DB-Schema sichtbar.
- [ ] **Avatar-Upload** — `updateProfile()` hat ein `avatar_url`-Feld, aber kein Supabase Storage-Upload ist angebunden.
- [ ] **Review-Pagination** — Alle Reviews eines Parfüms werden auf einmal geladen, bei beliebten Parfüms ein Performance-Problem.
- [ ] **E-Mail-Verifizierung** — Nach der Registrierung gibt es keinen Verifizierungshinweis oder Workflow.
