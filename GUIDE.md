# Building an Interactive Digital Book From Scratch

This repo is an empty template of the interactive Rust Book
(<https://rust-book.cs.brown.edu>). All of the book's content has been removed;
the structure, styling, and interactive machinery are still here. This guide
covers how each piece works, how to write content that uses it, and how to
build your own interactive elements.

---

## Contents

1. [How the pieces fit together](#1-how-the-pieces-fit-together)
2. [Install the toolchain](#2-install-the-toolchain)
3. [Project layout](#3-project-layout)
4. [Writing pages: the basics](#4-writing-pages-the-basics)
5. [Interactive element: quizzes](#5-interactive-element-quizzes)
6. [Interactive element: Aquascope diagrams (Rust only)](#6-interactive-element-aquascope-diagrams-rust-only)
7. [Interactive element: semantic notes](#7-interactive-element-semantic-notes)
8. [Interactive element: numbered listings and figures](#8-interactive-element-numbered-listings-and-figures)
9. [Interactive element: code badges](#9-interactive-element-code-badges)
10. [Interactive element: highlights and comments](#10-interactive-element-highlights-and-comments)
11. [Build your own: three patterns](#11-build-your-own-three-patterns)
12. [Build, preview, test, deploy](#12-build-preview-test-deploy)
13. [Checklist for a new book](#13-checklist-for-a-new-book)

---

## 1. How the pieces fit together

The book is a static website built by **[mdBook](https://rust-lang.github.io/mdBook/)**.
You write Markdown, and mdBook turns it into HTML. Interactivity is added in two places:

```
 src/*.md  ──►  PREPROCESSORS  ──►  mdBook HTML renderer  ──►  book/*.html  ──►  BROWSER
 quizzes/*.toml   (build time)                                                  (run time)
                  • mdbook-quiz        rewrites {{#quiz}} into a quiz widget
                  • mdbook-aquascope   rewrites ```aquascope into diagrams
                  • trpl-note          rewrites "> Note:" into <section class="note">
                  • trpl-listing       rewrites <Listing> into <figure class="listing">
                                                                                 • ferris.js     code badges
                                                                                 • feedback/     highlight + comment
                                                                                 • quiz/aquascope JS (injected by their preprocessors)
```

- **Preprocessors** run at build time. They take the parsed book as JSON,
  rewrite the Markdown, and hand it back. Use one when the source syntax has to
  change.
- **Additional JS/CSS** (`additional-js` / `additional-css` in `book.toml`) is
  loaded on every page and runs in the reader's browser. Use it when you want
  behavior added to HTML that's already rendered.

Every element in this book uses one of those two mechanisms, or both.

---

## 2. Install the toolchain

| Tool | Needed for | Install |
|---|---|---|
| Rust + Cargo | mdBook and the preprocessors | <https://rustup.rs> |
| mdBook | Building the book | `cargo install mdbook --locked --version 0.5.2` |
| mdbook-quiz | Quizzes | `cargo install mdbook-quiz --locked --version 0.5.0` (or a prebuilt binary from its [releases page](https://github.com/cognitive-engineering-lab/mdbook-quiz/releases)) |
| mdbook-aquascope | Rust memory diagrams (optional) | See <https://github.com/cognitive-engineering-lab/aquascope#installation> (needs a pinned nightly toolchain) |
| Node 20 + pnpm 8 | Building the highlight/comment JS extension (required: `mdbook build` fails without its `dist/`) | `npm i -g pnpm@8` |
| cargo-make (optional) | One-command build/watch | `cargo install cargo-make` |

Keep the mdBook and mdbook-quiz versions matched. The pinned pair is listed in
`.github/workflows/main.yml`.

The note and listing preprocessors come with this repo (`packages/mdbook-trpl`).
`book.toml` runs them through `cargo run`, so you don't need to install them.
For faster builds, install them once:

```bash
cargo install --locked --path packages/mdbook-trpl
# then in book.toml change   command = "cargo run ... --bin mdbook-trpl-note"
#                     to     command = "mdbook-trpl-note"   (same for listing)
```

`book.toml` marks `quiz` and `aquascope` as `optional = true`. If they aren't
installed, the book still builds and mdBook prints a warning; those widgets just
won't render.

---

## 3. Project layout

```
.
├── book.toml                 # Book config: title, preprocessors, extra CSS/JS
├── src/
│   ├── SUMMARY.md            # Table of contents. Controls which pages exist and in what order
│   ├── how-to-use.md         # Reader-facing explanation of the interactive features
│   ├── title-page.md, introduction.md
│   ├── chNN-00-*.md          # Chapter landing page
│   ├── chNN-MM-*.md          # Sections within a chapter
│   ├── ch01-01-section-title.md   # ◄ TEMPLATE PAGE showing every element's syntax
│   └── img/                  # Images (img/ferris/ holds the code-badge icons)
├── quizzes/
│   ├── example-quiz.toml
│   └── ch01-01-section-title.toml # ◄ TEMPLATE QUIZ showing every question type
├── theme/                    # CSS for notes and listings
├── ferris.js / ferris.css    # Code badges (pure client-side JS)
├── js-extensions/            # TypeScript/React browser extensions, built with esbuild
│   └── packages/
│       ├── feedback/         # Highlight + comment feature
│       └── telemetry/        # Optional logging hook used by feedback (off by default)
├── packages/mdbook-trpl/     # Rust source for the note/listing/heading/figure preprocessors
├── words.dic                 # Extra words for the quiz spellchecker
├── Makefile.toml             # cargo-make tasks: build, watch
└── .github/workflows/main.yml  # CI: build and deploy to GitHub Pages
```

**Naming convention.** Use `chNN-MM-short-slug.md` for pages, and name each
quiz after the page it belongs to, adding a suffix when a page has more than
one (`chNN-MM-slug-sec1.toml`, `-sec2.toml`, ...). That makes it easy to find
the quiz for a page and keeps files sorted in reading order.

---

## 4. Writing pages: the basics

### 4.1 Table of contents (`src/SUMMARY.md`)

```markdown
# Your Book Title

[How to Use This Book](how-to-use.md)        <- prefix chapters (unnumbered)
[Introduction](introduction.md)

- [Chapter 1 Title](ch01-00-chapter-title.md) <- numbered chapter
  - [Section 1.1](ch01-01-section-title.md)  <- nested = numbered section

- [Appendix](appendix-00.md)
```

A page has to be listed here to be built. When you run `mdbook build`, any file
listed here that doesn't exist yet gets created empty.

### 4.2 Standard Markdown plus mdBook extras

- Code blocks get syntax highlighting. A `rust` block also gets a ▶ Run button
  that runs it on the Rust Playground.
- `rust,ignore` turns off the Run button and leaves the block out of `mdbook test`.
- If a line in a `rust` block starts with `# `, it's hidden from readers but still compiled.
- `{{#include ../path/file.rs}}` pulls in a file, and
  `{{#include ../path/file.rs:5:10}}` pulls in a line range. Keeping code in real
  files means you can compile and test it.
- Images use `![alt](img/file.svg)`, or raw HTML `<img src="img/file.svg" class="center" width="300">`.
- Readers can search the whole book (configured in `[output.html.search]`).

### 4.3 Renaming pages without breaking links

If you rename or renumber a page, add an entry under `[output.html.redirect]`
in `book.toml`:

```toml
[output.html.redirect]
"ch17-00-old-name.html" = "ch18-00-new-name.html"
```

---

## 5. Interactive element: quizzes

**What readers see:** a "Start" button that opens a full-screen quiz. They
answer, get a score, can retry, and see the correct answers with explanations.
Answers are cached in the browser.

**Powered by:** [`mdbook-quiz`](https://github.com/cognitive-engineering-lab/mdbook-quiz),
a preprocessor that also ships the quiz's React UI.

### 5.1 Embed a quiz in a page

At the end of a section, write:

```markdown
{{#quiz ../quizzes/ch01-01-section-title.toml}}
```

The path is relative to the `.md` file.

### 5.2 Configure (in `book.toml`)

```toml
[preprocessor.quiz]
fullscreen = true      # quiz opens as an overlay (false = inline)
validate = true        # check every quiz file at build time; typos fail the build
cache-answers = true   # remember answers in localStorage
more-words = "words.dic"  # extra words for the spellchecker run by `validate`
```

### 5.3 Write questions (`quizzes/*.toml`)

Every question has an `id`, a `type`, a `prompt`, an `answer`, and a `context`
(the explanation shown afterwards). The `id` has to be a **unique UUID that
never changes**, because cached answers are keyed on it. Generate one with
`uuidgen`.

`quizzes/ch01-01-section-title.toml` has a working example of every type:

| `type` | Reader does | Key fields |
|---|---|---|
| `MultipleChoice` | Picks one option | `answer.answer = "..."`, `prompt.distractors = [...]` |
| `MultipleChoice` (multi-select) | Ticks every correct option | `answer.answer = ["a", "b"]`, `prompt.sortAnswers = true` |
| `ShortAnswer` | Types a word or number | `answer.answer = "..."` (exact match) |
| `Tracing` | Says whether a program compiles, and gives its output or the error line | `prompt.program`, `answer.doesCompile`, `answer.stdout` or `answer.lineNumber` |

Minimal multiple-choice question:

```toml
[[questions]]
id = "d172fc53-0220-4ff4-83c9-9c0a6834dd8e"
type = "MultipleChoice"
prompt.prompt = "What is 1 + 1?"
answer.answer = "2"
prompt.distractors = ["0", "11", "-999"]
context = """
Explanation in **Markdown**.
"""
```

**Multipart questions** let several questions share one scenario. Define the
scenario once, then point questions at it:

```toml
[multipart]
scenario = """
**Context:** a long code sample or situation...
"""

[[questions]]
id = "..."
multipart = "scenario"
type = "MultipleChoice"
...
```

**Tips**
- Prompts and contexts are Markdown, so they can contain fenced code. In this
  book they can also contain ` ```aquascope ` diagrams (see §6).
- `Tracing` questions are compiled during validation, so they only work for Rust.
  For other languages, use `MultipleChoice` or `ShortAnswer`.
- Aim for 1–5 questions after each major section, and always write a `context`.
  The explanation is what readers learn from.

---

## 6. Interactive element: Aquascope diagrams (Rust only)

**What readers see:** step-by-step pictures of Rust's stack and heap, and
annotations showing borrow-checker "permissions", all generated from real code.

**Powered by:** [`mdbook-aquascope`](https://github.com/cognitive-engineering-lab/aquascope).
It compiles every snippet with a pinned nightly Rust and caches the results in
`.aquascope-cache`.

**Not writing about Rust?** Delete `[preprocessor.aquascope]` from `book.toml`.
To get the same kind of thing for another language, build your own
preprocessor (§11.2) that runs your language's tooling at build time and
outputs HTML or SVG.

### 6.1 Syntax

````markdown
```aquascope,<mode>[,<flags>...]
fn main() {
    let a = Box::new(1);`[]`
    let b = a;`[]`
}
```
````

| Piece | Meaning |
|---|---|
| `interpreter` | Run the program and draw memory (stack + heap) |
| `permissions` | Show the borrow checker's R/W/O permissions on each path |
| `interpreter+permissions` | Both |
| `` `[]` `` (end of a line) | Interpreter: take a memory snapshot here. Each one becomes a labelled diagram (L1, L2, ...) |
| `#` line prefix | Hidden from the reader but still compiled |
| `stepper` | Permissions: show permission changes line by line |
| `boundaries` | Permissions: show which permissions each operation needs |
| `showFlows` | Permissions: show lifetime/flow constraints |
| `shouldFail` | The snippet is *expected* to fail to compile or to hit undefined behavior. The build fails if it doesn't |
| `horizontal` | Lay snapshots out side by side |
| `concreteTypes`, `hideCode` | Show concrete types / show only the diagram |

In prose, `@Perm{read}`, `@Perm{write}`, and `@Perm{own}` render as inline permission badges.

See the Aquascope repo for the full, current flag list. It changes between versions.

---

## 7. Interactive element: semantic notes

**What readers see:** a highlighted callout box.

**Source:**

```markdown
> Note: Anything after "Note:" becomes the callout body. It can span
> multiple lines and contain **Markdown**.
```

**How it works:** the `trpl-note` preprocessor (`packages/mdbook-trpl/src/note/`)
turns any blockquote that starts with `Note:` into
`<section class="note" aria-role="note">…</section>`.
`theme/semantic-notes.css` styles it using mdBook's theme variables, so it
works with every color theme.

**To add another callout type** (for example `> Warning:`), copy the note
module, change the prefix it matches and the class it emits, add a `[[bin]]`
entry in `packages/mdbook-trpl/Cargo.toml`, register it in `book.toml`, and add
CSS for the new class.

---

## 8. Interactive element: numbered listings and figures

**Source:**

````markdown
<Listing number="1-1" file-name="src/main.rs" caption="What this code shows">

```rust
fn main() {}
```

</Listing>
````

All three attributes are optional. The caption can contain inline Markdown.

**Output:** a `<figure class="listing">` with a "Filename: …" label above the
code and "Listing 1-1: …" below it, styled by `theme/listing.css`.

**Figures** use plain HTML that mdBook passes through as-is:

```markdown
<figure>

<img src="img/diagram.svg" alt="..." class="center" width="400" />

<figcaption>Figure 1-1: Caption text</figcaption>

</figure>
```

Keep the blank lines. They let the Markdown inside the HTML block render.

> `trpl-figure` and `trpl-heading` (also in `packages/mdbook-trpl`) only do
> anything when `output-mode = "simple"`. They flatten the HTML for print/PDF
> exports. You don't need them for the website.

---

## 9. Interactive element: code badges

**What readers see:** a small mascot icon in the corner of a code block, with a
red-tinted background, flagging code that's meant to be wrong.

**Source:** add a class to the code block's info string:

````markdown
```rust,ignore,does_not_compile
```
```rust,should_panic,panics
```
```rust,not_desired_behavior
```
````

**How it works (`ferris.js`, ~100 lines, no build step):**
1. mdBook adds every word in the info string to the `<code>` element as a CSS class.
2. On `DOMContentLoaded`, `ferris.js` finds `.does_not_compile`, `.panics`, and
   `.not_desired_behavior`.
3. It inserts an `<img src="img/ferris/<class>.svg">` linked to
   `introduction.html#code-badges`. Blocks with fewer than 4 lines get a small
   icon, longer ones get a large icon.
4. `ferris.css` tints the background for each theme (`body.light`, `body.coal`, ...).

**To make your own badges:** edit the `FERRIS_TYPES` array (class name + tooltip),
put an SVG with the same name in `src/img/ferris/`, and add the class to the
selectors in `ferris.css`. You can also replace the mascot with your own icons.

---

## 10. Interactive element: highlights and comments

**What readers see:** they select text, click ✏️, and optionally type a
comment. The highlight stays on the page across visits, and hovering it shows
the comment and a delete button.

**Source:** `js-extensions/packages/feedback/` (TypeScript + React).

| File | Role |
|---|---|
| `lib/index.tsx` | Creates a `web-highlighter` instance and mounts a React root inside `.page` |
| `lib/selection.tsx` | Tooltip with the ✏️ button over the current selection; saves new highlights |
| `lib/modal.tsx` | Comment entry dialog |
| `lib/renderer.tsx` | Tooltip shown on hover over a saved highlight (view/delete) |
| `lib/utils.ts` | Saving to and loading from `localStorage` (`mdbook-quiz:highlights`), plus DOM hashing |
| `feedback.scss` | Styles |

**Highlights you update content under:** every saved highlight stores an MD5
hash of the DOM node it sits in. If you edit that paragraph, the hash no longer
matches and the highlight is dropped on the next load. That stops highlights
from landing on the wrong text.

**Build:**

```bash
cd js-extensions
pnpm init-repo        # pnpm install && build every package into packages/*/dist/
pnpm watch            # rebuild on change while you're writing
```

`book.toml` loads `packages/feedback/dist/index.{js,css}`. If `dist/` hasn't
been built, `mdbook build` **fails** with "failed to open ... for hashing". Run
`pnpm init-repo` first, or take the entries out of `book.toml`.

**Telemetry (off by default).** `feedback` calls `window.telemetry?.log(...)` if
a `window.telemetry` object exists. The `telemetry` package provides one that
POSTs to a server you choose. To turn it on, add
`"js-extensions/packages/telemetry/dist/index.js"` to `additional-js` and set
the `TELEMETRY_URL` environment variable when building (`TELEMETRY_URL=https://your-server/logs pnpm build`). If it is unset, logging does nothing. **Readers need to give consent before you
collect anything.** The original book showed a consent form first.

---

## 11. Build your own: three patterns

### 11.1 Pattern A: plain client-side JS (like code badges)

Use this when the HTML already has what you need and you want to add behavior
on top of it. No build step.

Example: a **"Show solution"** toggle. Source:

````markdown
```python,solution
print("hidden until clicked")
```
````

`solution.js`:

```js
document.addEventListener("DOMContentLoaded", () => {
  for (const code of document.querySelectorAll("code.solution")) {
    const pre = code.parentElement;
    pre.hidden = true;
    const btn = document.createElement("button");
    btn.textContent = "Show solution";
    btn.className = "solution-toggle";
    btn.onclick = () => {
      pre.hidden = !pre.hidden;
      btn.textContent = pre.hidden ? "Show solution" : "Hide solution";
    };
    pre.before(btn);
  }
});
```

Register it in `book.toml` with `additional-js = [..., "solution.js"]` (and
`additional-css` if you style it).

**Rules of thumb**
- Use mdBook's CSS variables (`var(--fg)`, `var(--bg)`, `var(--quote-bg)`,
  `var(--links)`, …) so your element works in all five themes.
- mdBook loads pages fully, with no client-side routing, so `DOMContentLoaded`
  fires on every page.
- For per-reader state (progress, bookmarks), use `localStorage` with a
  namespaced key, and handle the case where it's unavailable.

### 11.2 Pattern B: a preprocessor (like notes, listings, quizzes)

Use this when you want **new authoring syntax**, or need to do work at build
time (compiling code, generating diagrams, checking content).

A preprocessor is just a program. mdBook:
1. calls it with `supports <renderer>`, and exit code 0 means "yes";
2. otherwise sends it `[context, book]` as JSON on stdin and reads the modified
   book back as JSON on stdout.

Here is a minimal Rust preprocessor that turns `> Tip:` into a styled section.
It's modelled on `packages/mdbook-trpl/src/bin/note.rs`:

```toml
# packages/mdbook-tip/Cargo.toml
[package]
name = "mdbook-tip"
version = "0.1.0"
edition = "2021"

[dependencies]
mdbook-preprocessor = "0.5.1"
serde_json = "1"
```

```rust
// packages/mdbook-tip/src/main.rs
use std::io;
use mdbook_preprocessor::{book::{Book, BookItem}, errors::Result,
                          Preprocessor, PreprocessorContext};

struct Tip;

impl Preprocessor for Tip {
    fn name(&self) -> &str { "tip" }

    fn run(&self, _ctx: &PreprocessorContext, mut book: Book) -> Result<Book> {
        book.for_each_mut(|item| {
            if let BookItem::Chapter(ch) = item {
                ch.content = ch.content
                    .lines()
                    .map(|l| match l.strip_prefix("> Tip: ") {
                        Some(rest) => format!(
                            "<section class=\"tip\">\n\n{rest}\n\n</section>"),
                        None => l.to_string(),
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
            }
        });
        Ok(book)
    }
}

fn main() -> std::result::Result<(), String> {
    if std::env::args().nth(1).as_deref() == Some("supports") {
        return Ok(()); // supports every renderer
    }
    let (ctx, book) = mdbook_preprocessor::parse_input(io::stdin())
        .map_err(|e| e.to_string())?;
    let out = Tip.run(&ctx, book).map_err(|e| e.to_string())?;
    serde_json::to_writer(io::stdout(), &out).map_err(|e| e.to_string())
}
```

```toml
# book.toml
[preprocessor.tip]
command = "cargo run --quiet --manifest-path packages/mdbook-tip/Cargo.toml"
```

Line-by-line string matching like this is fine for single-line syntax. For
anything that nests (blocks, HTML tags), parse properly with `pulldown-cmark`,
the way `packages/mdbook-trpl/src/note/mod.rs` does.

You don't have to use Rust. Any language that can read stdin and write stdout
works (Python, Node, …). Point `command` at the script.

**Pattern B + A together (how quizzes work):** the preprocessor swaps
`{{#quiz file.toml}}` for a placeholder `<div>` holding the quiz data as JSON,
and adds a `<script>` tag. That JS bundle finds the placeholders in the
browser and mounts the interactive widget. Use the same split for any rich
widget: the preprocessor emits data, the client JS renders it.

### 11.3 Pattern C: a bundled TypeScript/React extension (like feedback)

Use this when the browser-side UI is big enough that you want TypeScript,
React, npm packages, or tests.

1. Create `js-extensions/packages/my-widget/` with:
   - `package.json` containing `{"scripts": {"build": "node build.mjs"}, "devDependencies": {...}}`
   - `build.mjs`, copied from `packages/feedback/build.mjs` (esbuild, IIFE format, Sass plugin)
   - `tsconfig.json`, copied from feedback
   - `lib/index.tsx` as the entry point. Find your mount points and `createRoot(...).render(...)`.
2. `cd js-extensions && pnpm init-repo` builds every workspace package into `dist/`.
3. Add `js-extensions/packages/my-widget/dist/index.js` (and `.css`) to `book.toml`.
4. Optional: write browser tests with jest-puppeteer, using
   `packages/feedback/tests/feedback.test.ts` as the model (`pnpm test`).

---

## 12. Build, preview, test, deploy

```bash
# one-off build (output in ./book)
cd js-extensions && pnpm init-repo && cd ..
mdbook build
open book/index.html

# live preview while writing (rebuilds JS + book on save)
cargo make watch          # or: mdbook serve --open   (+ `pnpm watch` in js-extensions)

# compile and run every ```rust block that isn't marked ignore
mdbook test
```

**Deploy:** `.github/workflows/main.yml` builds the JS extensions and the book
on each push, and on `main` it publishes `./book` to GitHub Pages. To use it:
1. Push the repo to GitHub.
2. Under Settings → Pages, set the source to the `gh-pages` branch.
3. Optional: set `cname:` in the workflow for a custom domain.

The output is a static site, so any static host (Netlify, Cloudflare Pages, S3)
works too. Upload the `book/` folder.

---

## 13. Checklist for a new book

- [ ] `book.toml`: set `title`, `authors`, `git-repository-url`
- [ ] Delete `[preprocessor.aquascope]` if the book isn't about Rust
- [ ] `src/SUMMARY.md`: lay out your chapters
- [ ] `src/how-to-use.md`: explain the interactive features to readers
- [ ] `src/introduction.md#code-badges`: explain your code badges, or remove `ferris.*` from `book.toml`
- [ ] Use `src/ch01-01-section-title.md` and `quizzes/ch01-01-section-title.toml`
      as references, then replace them with real content
- [ ] One quiz file per section, with a fresh `uuidgen` id on every question
- [ ] Add domain terms to `words.dic` so quiz validation doesn't flag them
- [ ] Build the JS extensions once (`pnpm init-repo`) before `mdbook build`
- [ ] Update `README.md`, `COPYRIGHT`, and the licenses for your content.
      The template code stays under MIT/Apache-2.0. Your prose can use any
      license you choose.
