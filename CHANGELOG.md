# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- `discover` command for multi-provider library discovery (`catalog`, `npm`, `github`).
- `fetch` command for pre-install documentation acquisition and local snapshotting.
- Source provenance manifest (`.doccli/source.json`) including canonical URL, requested/resolved refs, integrity, and trust signals.
- Optional source provenance in `cite` and `use` (`citation_details`).
- Security policy support via `doccli.policy.json` with host, extension, and size/file limits.
- New deterministic errors for discovery/fetch/policy flows.
- Bootstrap extraction now includes operational/runtime signals from files like `package.json`, `Makefile`, `Dockerfile`, and CI workflows (`signals_detected`).

### Changed
- `build` now accepts `--source-manifest` to embed external source provenance in the index.
- `use` ranking and filtering improved for practical how-to tasks (reduced changelog/meta noise, better command-oriented section selection).
- Query tokenization now removes common stopwords for improved relevance.
- Bootstrap indexes now persist inferred build metadata (`build.inferred`, `build.derivation`), surfaced by `stats`.
- `use` now returns overall `confidence: "partial"` when querying bootstrap-derived/inferred indexes.
- Bootstrap generated docs now include file+line provenance for routes and environment variables.

## [0.1.0] - 2026-02-27

### Added
- Initial release of `doccli` with `bootstrap`, `build`, `list`, `stats`, `search`, `open`, `cite`, and `use`.
- Deterministic markdown indexing and citation-backed retrieval.
- JSON output mode for all commands.
- Fixture-based integration tests.
