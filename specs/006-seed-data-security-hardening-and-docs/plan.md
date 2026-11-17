# Implementation Plan: Security Hardening, Documentation and End-to-End Check (web app)

**Branch**: `006-seed-data-security-hardening-and-docs` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-seed-data-security-hardening-and-docs/spec.md`

**Skills**: react-frontend-stack, frontend-design (font), git-workflow, decisions-log

## Summary

Remove the unused shadcn CLI (and its 9 audit findings), pin eslint's `minimatch` to a fixed version if
the toolchain still passes, serve the font from the app and drop Google from the CSP, put the nginx
security headers in one snippet without duplicating the API's, finish the README, run the end-to-end
check against the full stack with the sample data, and verify a clean clone. The findings rows for the web
app go into the backend's `docs/security-review.md`.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19, Vite 8, Node 26.13.1

**Primary Dependencies**: **removed** `shadcn` (devDependency). **Added**: none. Font files (Readex Pro,
OFL-1.1) committed as static assets. Possible `overrides` entry for `minimatch` 11.0.4 (BlueOak-1.0.0).

**Testing**: Vitest + RTL (unchanged suite must stay green); headers checked against the running
container; end-to-end in Edge (scratch script, not committed).

**Constraints**: no third-party request from any page; bundle budget 250 kB gzip (fonts are not JS).

## Constitution Check

| Principle | Status |
|---|---|
| Typed contract, TanStack Query, zustand | Unchanged. ✅ |
| Tests ship with features | Existing suite + header/CSP evidence + E2E record. ✅ |
| Security by default | This phase. ✅ |
| License hygiene | Package removed; font OFL-1.1 with license file; override BlueOak-1.0.0. ✅ |
| README rule (v1.2.0) | README finished; describes the product only. ✅ |

## Project Structure

```text
package.json, package-lock.json   # - shadcn; + overrides (if kept)
components.json                   # removed (CLI config only)
index.html                        # Google font links removed
public/fonts/                     # Readex Pro woff2 + OFL.txt
src/index.css                     # @font-face
nginx/default.conf.template       # include the snippet in / and /assets/; /api passes API headers
nginx/security-headers.conf       # the one header list (copied into the image)
Dockerfile                        # copy the snippet
README.md, docs/walkthrough.md, Memory.md
```

## Key design decisions (details in research.md)

1. Audit: remove shadcn CLI; try minimatch override; accept picomatch (no fix exists) (R1).
2. Font from the app; CSP without third-party hosts (R2).
3. One nginx header snippet; no duplicates on `/api` (R3).
4. Image scan + `.dockerignore` check (R4).
5. End-to-end in a real browser against the full stack (R5).
6. Dead code check + clean clone (R6).

## Complexity Tracking

None.
