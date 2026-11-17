# Quickstart: Tracks (manual validation)

Backend stack with the Phase 3 API running, then `docker compose up --build -d` here; open http://localhost:8081.

1. `/` as a visitor: track list (skeleton first), status badges, Arabic titles right-to-left; header dot → `/status`.
2. Filter status "Submitted", genre "R&B", an artist (type "amr"); reload and Back keep the view; "Clear filters".
3. Next/Previous; `?page=999` → empty-page state; `?status=bogus` → ignored.
4. Open a track: all fields, "Not sent to any platform yet"; `/tracks/<random guid>` → not found.
5. Sign in, "Add track": empty submit (5 messages), bad ISRC, duplicate ISRC (under ISRC), success → track page + toast.
6. On the track: Submit → Withdraw to draft → Submit → Mark as distributed (confirm) → no controls, final note.
7. Two tabs on one submitted track: withdraw in one, distribute in the other → conflict message, page refreshes.
8. Sign out on a track page → `/login`; visitor sees no controls. Repeat 1 and 5 at 400 px dark.
