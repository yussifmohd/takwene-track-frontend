# Quickstart: Artists (manual validation)

Prerequisites: backend Phase 2 stack running (`docker compose up --build` in backend), then
`docker compose up --build` here → http://localhost:8081.

1. Signed out, open Artists → skeleton, then the list (or "No artists yet" without an action). No emails, no "Add artist".
2. Open `/artists/new` directly → sent to sign-in → after signing in, back on the form.
3. Submit empty → messages under Name and Country, focus on Name, no request in the network tab.
4. Name "عمرو دياب" (types right-to-left), Country Egypt, email of an existing artist → message under Email (409).
5. Fix the email → submit → back on Artists with "Artist added", the artist listed with "Egypt"; emails visible as admin.
6. Add 21+ artists (script in backend quickstart) → Next/Previous, address shows `?page=2`, reload keeps the page.
7. Stop the API container → Artists shows the error with Retry; start it → Retry loads.
8. Sign out → emails and "Add artist" disappear.
9. Repeat 1 and 5 at 360 px and in dark mode (DevTools script) → no horizontal scroll, names wrap.
