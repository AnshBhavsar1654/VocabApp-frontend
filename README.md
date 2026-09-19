# VocabApp Frontend

React app for the VocabApp German vocabulary trainer: add
words, hear them spoken, sort them into groups, and drill them in quiz
sessions. Deployed on Vercel; talks to the FastAPI backend with the
user's Supabase JWT on every request.

## Stack

- React 19 + Vite 8, React Router 7, TanStack Query 5
- Tailwind CSS v4 (+ hand-maintained `index.css` / `tokens.css` theme:
  light/dark, CSS variables, no blanket resets — see note below)
- Supabase JS (Google OAuth + session), dnd-kit (drag-to-reorder),
  Framer Motion (transitions), Lucide icons, oxlint

## Structure

| Path | Purpose |
|---|---|
| `src/api.js` | Backend client (auth headers, prod-vs-local URL guard, audio unlock helper) |
| `src/routes/` | Route table + paths |
| `src/pages/` | Landing, Login, Signup, OAuthConsent, AuthCallback, AddWord, Words, Groups, Quiz, NotFound |
| `src/components/` | AddWordForm, WordList, Groups, Quiz, StatStrip, WordBadge, layout/, auth/ |
| `src/context/AuthContext.jsx` | Session state, sign-in/out, Google OAuth |
| `src/lib/` | Supabase client, error formatting |
| `src/tokens.css` | Design tokens (both themes, incl. gender colors) |
| `vercel.json` | SPA rewrites for Vercel |

## Setup

```bash
# from frontend/
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle -> dist/
npm run lint     # oxlint
```

Environment (`.env`, see build-time note):

```
VITE_MODE=dev
VITE_API_URL=http://localhost:8000
VITE_API_URL_PROD=https://vocabapp-backend.onrender.com
VITE_SUPABASE_URL=https://....supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

`api.js` resolves the backend URL from `VITE_MODE`, then guards: a
non-localhost host never talks to `localhost`, even if the bundle was
built with dev defaults. Callback route is `/auth/callback` — it must be
listed in Supabase URL config alongside the Google OAuth redirect
(`<supabase-url>/auth/v1/callback`, see backend README / `issues.md` #8).

## Features

- **Add word** (`AddWordForm`): type EN or DE, auto language toggle;
  optional part-of-speech override, otherwise the backend
  auto-detects (DWDS + heuristic fallback, cached). Shows the
  resolved part-of-speech badge on the confirmation.
- **My Words** (`WordList`): searchable, group-filterable card grid with
  audio playback, inline edit (text + POS), group assignment,
  optimistic delete/update. POS shown as a pill badge.
- **Groups** (`Groups`): group strip + word panel with drag-to-reorder
  (debounced autosave to `PATCH /groups/{id}/order`), add/remove words.
- **Quiz** (`Quiz`): sized sessions (up to 20 cards, needs 10+ words),
  flip card, type-and-check (case-insensitive), Space/Enter shortcuts,
  session summary.
- **Caching**: TanStack Query keys `['words']`, `['groups']`,
  `['groupWords', id]`, `['quizNext]` (60s stale, quiz always fresh on
  demand); `isLoading` = skeleton, `isFetching` = quiet "updating"
  indicator; mutations invalidate the affected keys.

## Styling notes

- Tailwind v4 (`@import "tailwindcss"` + preflight owns spacing). Do not
  re-add a global `* { margin: 0; padding: 0 }` after the import — it
  silently cancels utilities like `mx-auto` (regression documented in
  `../issues.md` #4).
- Theme via `html[data-theme]` variables in `tokens.css`; components use
  `var(--color-*)` so light/dark stay in sync.