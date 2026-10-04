# Your Book Title

An interactive online book built with [mdBook](https://rust-lang.github.io/mdBook/),
with quizzes, reader highlights/comments, code badges, semantic notes, and numbered listings.

This repo started as a content-free template of the interactive Rust Book
(<https://rust-book.cs.brown.edu>). **See [GUIDE.md](GUIDE.md)** for how every
interactive element works, how to author content with it, and how to build new ones.

## Quick start

```bash
cargo install mdbook --locked --version 0.5.2
cargo install mdbook-quiz --locked --version 0.5.0
npm i -g pnpm

(cd js-extensions && pnpm init-repo)   # build browser extensions
mdbook serve --open                     # live preview at http://localhost:3000
```

The output of `mdbook build` goes to `book/`.

## License

Template code is MIT / Apache-2.0 (see `COPYRIGHT`). Choose a license for your own content.
