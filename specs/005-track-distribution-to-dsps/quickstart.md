# Quickstart: Distribution (web app, manual)

1. Backend 005 stack up (a Phase 3 track marked distributed is now submitted); `docker compose up --build` here.
2. Signed out: open a track – deliveries table or "Not sent to any platform yet."; no Distribute, no answer buttons.
3. Sign in; open a submitted track: status control shows only "Withdraw to draft"; Distribute is enabled.
4. Distribute → choose Spotify and Apple Music → "Send to 2 platforms" → pending rows with sent times; badge distributed.
5. Mark Spotify live, Apple Music rejected → answer times; open Distribute: Apple Music "Send again", YouTube Music selectable, Spotify disabled (Live).
6. Send Apple Music again → pending with a new sent time.
7. Send all remaining → Distribute disabled ("Sent to every platform").
8. Desktop light + 400 px dark: no horizontal overflow; dialog usable by keyboard; no console errors.
