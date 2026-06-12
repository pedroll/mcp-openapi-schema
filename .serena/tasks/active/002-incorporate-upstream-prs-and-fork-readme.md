# Task: Incorporate Upstream PRs, Add Fork Notice, Open Upstream PR

**Status**: 🔄 In Progress
**Priority**: 🔥 High
**Effort**: 2-4 hours
**Started**: 2026-06-13
**Completed**: —

## Objective

Clarify in the README that this repo is a fork of `hannesj/mcp-openapi-schema` (original appears unmaintained, open PRs unattended), incorporate worthwhile open upstream PRs, and contribute our changes back upstream as a PR.

## Context

- Remotes: `origin` = `pedroll/mcp-openapi-schema` (our fork), `originalForked` = `hannesj/mcp-openapi-schema` (upstream).
- Upstream has a single commit `f676a03` — identical to our base, so our history is a clean fast-forward of upstream.
- Open upstream PRs evaluated 2026-06-13:
  - **PR #4** "feat: support URL for OpenAPI schema source" (@ppspps824, 2026-01-31): adds `isUrl` helper, URL pass-through in `loadSchema`, URL-aware schema naming (incl. `.yml`), help/README updates. **Verdict: incorporate** — useful, composes with our `bundle()` loading (URLs + remote `$refs` work). Must be adapted: upstream diff targets the old `validate()`-based `loadSchema`.
  - **PR #3** "Add MseeP.ai badge" (@lwsinclair, 2025-07-05): README badge linked to the original repo's MseeP listing. **Verdict: skip** — promotional, tied to upstream's listing, no functional value.

## Approach

1. Re-implement PR #4 adapted to our bundle-based `loadSchema`; credit author via `Co-authored-by`.
2. Add fork notice to README (fork-only content — must NOT go upstream).
3. Build a curated branch off `originalForked/master` with only upstream-relevant changes (split-spec fix + URL support + their README/test changes; NO fork notice, NO `.serena/`, NO task docs), push to `origin`, open PR against `hannesj/mcp-openapi-schema`.

## Implementation Steps

- [x] Adapt PR #4 into `index.mjs`: `isUrl` helper, URL pass-through (skip `resolve()` for URLs), URL-aware `schemaName` (also fixes `.yml` stripping), updated `--help` text.
- [x] README: URL usage examples (command line, Claude Desktop, Claude Code) from PR #4.
- [x] README: fork notice at top (fork of hannesj/mcp-openapi-schema, why, changes offered back upstream).
- [x] Verify: `npm test` (both suites) + manual URL load smoke test (petstore3.swagger.io) — all pass.
- [x] Commit URL support (`e03fd92` on `dev`, Co-authored-by: ppspps824). Note: work landed on `dev` (branch created from `master` in IDE), not `master`.
- [x] Commit fork notice (separate commit — fork-only).
- [ ] Create curated branch `feat/split-refs-and-url-support` from `originalForked/master`; apply code + upstream-relevant docs only; push to `origin`; open PR to upstream.
- [ ] Update `mem:core` if invariants change (URL input now allowed).

## Files to Modify

- `index.mjs` — URL support in `loadSchema` + `schemaName`, help text.
- `README.md` — fork notice (fork-only) + URL examples (also upstream).
- `.serena/memories/core.md` — note URL schema sources.

## Testing Plan

- [ ] `npm test` — both local suites pass.
- [ ] `node index.mjs https://petstore3.swagger.io/api/v3/openapi.json` — loads remote spec, server starts.
- [ ] `node index.mjs sample-petstore.yaml` — local path behavior unchanged.

## Risks

- Pushing/opening the upstream PR requires GitHub auth (`gh` currently unauthenticated) — may need user to run `gh auth login`.
- Upstream is unresponsive; PR may sit unmerged — acceptable, the fork remains the maintained line.

## Notes

- PR #3 deliberately not incorporated (see Context).
