# Quickstart: verify Phase 1 (web app)

Backend stack running with `ADMIN__EMAIL`/`ADMIN__PASSWORD` set; `docker compose up --build` here; open http://localhost:8081.

1. Header shows "Sign in". Open `/account` → redirected to `/login?redirect=%2Faccount`.
2. Wrong password → "The email or password is incorrect.", password cleared and focused.
3. Correct credentials → back on `/account` with email, role "Admin", session end time.
4. Reload → still signed in. Open a second tab → signed in.
5. Sign out → toast "Signed out", taken to `/`, header "Sign in"; other tab signs out on focus/next request.
6. In devtools set `trackmgmt.session.state.session.expiresAt` to the past and reload → signed out.
7. 11 quick wrong attempts → "Too many attempts. Try again in N seconds."
8. Stop the API, try to sign in → "Can't reach the server", email kept.
9. Width 360 px: login form and header fit; keyboard-only sign-in works.
