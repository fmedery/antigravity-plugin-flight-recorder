# Changelog

All notable changes to **Flight Recorder** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **PATCH (`0.0.x`)**: Bug fixes, copy/tooltip refinements, and security hardening.
- **MINOR (`0.x.0`)**: Backwards-compatible dashboard features, metrics, analytics, and optional MCP tool fields.
- **MAJOR (`x.0.0`)**: Breaking MCP tool schema changes or incompatible hook/storage format changes.

## [Unreleased]

### Changed

- Completed Antigravity Marketplace manifest metadata (`$schema`, `license`, `keywords`, structured `author`, and 144-char card description).
- Moved passive hook spooler to `scripts/record-event.mjs` to match Marketplace bundle script conventions (`0755`).
- Added `license`/`compatibility` metadata and non-UI CLI `app_*` guardrail to `skills/flight-recorder/SKILL.md`.
- Bounded `open_flight_recorder` initial `pluginSkillMetrics` payload to stay safely under Antigravity's 1 MiB trajectory result cap.
- Updated `README.md` to lead with Antigravity Marketplace install/update instructions and absolute screenshot URLs for pre-install card rendering.
- Removed internal planning specs under `docs/superpowers/` from the published repository bundle.

## [0.4.0] - 2026-11-26

### Added

- Hardened single-source-of-truth versioning (`scripts/version-utils.mjs`, `npm run version:check`, `npm run release`), `CHANGELOG.md`, and GitHub Actions CI + tag-release workflows.
- Marketplace-aware and GitHub Releases-aware manual update check.

## [0.3.0] - 2026-11-25

### Added

- Manual **Updates** check button and header version badge (`app_check_update`).
- **Context Health** KPI (`200k` cliff / `256k` compaction tracking) and period-over-period delta pills (`Today`, `7d`, `30d`).
- Time-range filter bar, compact cost cells, Recent Chats tab, interactive error guidance drawers, and inline panel captions/tooltips.
- `npm run version:bump` helper script.

### Documentation

- Rewrote `README.md` with architecture diagram, annotated dashboard screenshots, and cross-platform update/uninstall guides.

## [0.2.0] - 2026-11-23

### Added

- Zero-install prebuilt `dist/server/index.js` and `dist/ui/index.html` bundles (no `npm install` or Python required).
- Cross-platform Windows, macOS, and Linux support (RFC 8089 `file://` URIs, Windows backslash paths, `.exe`/`.cmd` plugin CLI discovery).
- Passive Node.js lifecycle hook spooler (`hooks/record-event.mjs`).
- Parent-first plugin & skill efficiency attribution and KPI help tooltips.

### Security

- Added secret redaction (`src/shared/redact.ts`), ANSI/OSC control-character stripping, POSIX `0700`/`0600` data permissions, ReDoS-safe pricing glob matching, bounded hook ingestion, `SECURITY.md`, and `MIT` `LICENSE`.

[Unreleased]: https://github.com/fmedery/antigravity-plugin-flight-recorder/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/fmedery/antigravity-plugin-flight-recorder/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/fmedery/antigravity-plugin-flight-recorder/commits/69efe49
[0.2.0]: https://github.com/fmedery/antigravity-plugin-flight-recorder/commits/0ef1c88
