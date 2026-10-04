# Session State (as of 2026-10-05)

Handoff notes so a fresh session can pick up where the last one left off.
This file is about **three related projects**. Paths are absolute.

---

## 1. mdBook template: `/Users/louis/Downloads/rust-book-main`

- **What it is:** the interactive Rust Book (Brown University fork) with all of
  its content removed, kept as a reusable template. It has quizzes
  (mdbook-quiz), Aquascope, highlights/notes (`js-extensions/packages/feedback`),
  Ferris code badges, notes and listings (`packages/mdbook-trpl`), and CI
  deploying to GitHub Pages.
- **`GUIDE.md`** explains how each interactive element works and how to build
  a book from scratch.
- **Git:** `main`. Commits: `3f6bd4d Interactive mdBook template`, then a
  second commit that adds this STATE.md. The tree is clean and nothing has
  been pushed.
- **Backup of the original repo:** `/Users/louis/Downloads/rust-book-main-ORIGINAL-backup.tar.gz`.
- **Changes from upstream:**
  - The telemetry package now only sends anything when `TELEMETRY_URL` is set
    at build time. It previously posted to the original authors' server.
  - The consent-form package is deleted.
  - `quiz` and `aquascope` are marked `optional = true` in `book.toml`.
- **Build:** `(cd js-extensions && npx pnpm@8 init-repo) && mdbook build`.
  mdBook 0.5 **fails** (it doesn't just warn) if `js-extensions/.../dist` is
  missing.
- **Installed in `~/.cargo/bin`:** `mdbook 0.5.2` and `mdbook-quiz 0.5.0`.
  Not installed: pnpm (use `npx pnpm@8`) and `mdbook-aquascope`.
- **Not done:**
  - The user said "make this a template". The local commit is done. Making it a
    GitHub template repo (push it, then Settings → Template repository) was
    offered but not requested.

## 2. Maths book: `/Users/louis/Desktop/quadratics-book`

- **What it is:** a book built from the mdBook template above. It is titled
  "Solving Quadratics: An Interactive Introduction", author "Louis", and uses
  Australian spelling.
  - **Chapters:**
    - `src/ch01-quadratics-and-parabolas.md`
    - `src/ch02-solving-by-factorising.md`
    - `src/ch03-the-quadratic-formula.md`
    - `src/ch04-solver-playground.md`
  - **Quizzes:** one per chapter for chapters 1–3, 4 questions each, in `quizzes/`.
  - **Interactive grapher:** `graph.js` + `graph.css`, used as
    `<div class="quadratic-graph" data-a data-b data-c [data-controls="none"] [data-solution="none"] [data-range]>`.
    It has a/b/c sliders, a hover trace, roots and vertex markers, and the
    quadratic-formula working step by step.
  - **Removed from the template:** Ferris, aquascope and the listing plugin.
- **Verified** in headless Chrome: the maths, the theme redraw and the quizzes.
- **Git:** this is a clone of the template commit `3f6bd4d` with its remote
  removed. The maths-book changes are **UNCOMMITTED** (29 paths), because the
  user didn't ask for a commit.
- **Run:** `cd ~/Desktop/quadratics-book && mdbook serve --open`. The JS
  extensions are already built.

## 3. TypeScript template (no Rust): `/Users/louis/Downloads/book-template-ts`

- **What it is:** a port of the mdBook template that runs on Node/TypeScript
  only, with no Rust toolchain. It keeps the same authoring format:
  `SUMMARY.md`, `{{#include}}`, `{{#quiz}}` with mdbook-quiz TOML minus the
  Rust-only `Tracing` type, `> Note:`/`Tip:`/`Warning:`, and `<Listing>`.
- **Git:** `main`, clean, not pushed.
  - `a3a9435 Interactive book template (TypeScript, no Rust)`
  - `537311c Harden TS template from review findings` (fixes from 5 parallel
    Sonnet reviews: security, engine, client/a11y, TS practices, tests/CI)
- **Layout:**
  - `engine/` is the build. Files: `cli.ts` (build + dev server with SSE
    livereload), `build.ts`, `summary.ts`, `markdown.ts` (markdown-it +
    highlight.js), `layout.ts`, `search.ts`, `text.ts` (`outsideCode`,
    `\{{#` escape), `config.ts`, and `index.ts` (the public API: `defineConfig`,
    `definePlugin`, types).
  - `engine/plugins/` holds `include`, `listing`, `quiz`, `notes` and `runnable`.
  - `client/` is the browser code, bundled by esbuild: `chrome.ts` (sidebar,
    theme disclosure, ←/→ navigation, copy, `trapFocus`), `quiz.ts`,
    `search.ts`, `runnable.ts` (sandboxed iframe), `badges.ts`, and
    `feedback/` (web-highlighter, vanilla TS). CSS is in `client/styles/`, and
    every colour is in `theme.css` (light/dark/sepia, WCAG AA checked).
  - `shared/` holds the quiz types and the runtime guards.
  - `scripts/check-links.ts` checks links in the built book.
  - `tests/` uses vitest (32 tests), with happy-dom for `client-dom.test.ts`.
- **tsconfigs:** `tsconfig.base.json` holds the strict flags.
  `tsconfig.engine.json` is Node with no DOM, `tsconfig.client.json` is DOM
  with no Node, and `tsconfig.json` is for the editor and tests.
- **Commands:**
  - `npm run dev [-- --port N --host H]` (localhost only by default)
  - `npm run build`
  - `npm test`
  - `npm run typecheck`
  - `npm run check` (typecheck + test + build + check-links; this is what CI runs)
- **CI:** `.github/workflows/main.yml` runs a read-only check on Node 22 and 24,
  then a separate deploy job publishes to the gh-pages branch from main.
- **Versions:** TypeScript **7.0.2** (the native compiler, which has no JS API,
  so typescript-eslint can't run and there's deliberately no ESLint),
  vitest 4, esbuild 0.28, markdown-it 15 (ships its own types, so don't add
  `@types/markdown-it`), `@types/node@^22`, engines `>=22`, `.nvmrc` 22.
  Local Node is 25.9.
- **Gotchas found along the way:**
  - The dev server's livereload SSE keeps a connection open, so puppeteer
    must use `waitUntil: "networkidle2"`.
  - Node 25 ships a global `localStorage` stub that shadows happy-dom's. The
    DOM tests stub it with `vi.stubGlobal`.
  - Changes to `engine/` or `book.config.ts` need a dev-server restart. It
    prints a reminder.
- **Known gaps / possible next steps (not done):**
  - Highlights aren't keyboard-accessible (no focus, so the tooltip can't be
    opened from the keyboard).
  - There's no fallback for browsers without `<dialog>` (Safari before 15.4)
    in the highlight note dialog.
  - Pressing Escape in a fullscreen quiz discards in-progress answers without
    confirming.
  - The runnable iframe timeout is only verified in Chrome; Firefox and Safari
    may differ.
  - Runnable code isn't type-checked (syntax only). `editable` works only for
    `js` blocks.
  - Mobile sidebar: Escape doesn't close it, and focus doesn't move into it
    when it opens.
  - Add ESLint once typescript-eslint supports TS 7.

---

## Testing tools available

- **Headless Chrome via puppeteer v16:** require it from
  `/Users/louis/Desktop/quadratics-book/js-extensions/node_modules/puppeteer` and launch with
  `{ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" }`.
  The bundled Chromium doesn't start on this Mac.
- The Claude in Chrome extension wasn't connected during the last session.

## User preferences seen

- Commits only when asked. Commit attribution lines are used.
- Asked for Sonnet subagents for the parallel review (5 at most). Their
  findings were fixed by the main session, not by the agents.
