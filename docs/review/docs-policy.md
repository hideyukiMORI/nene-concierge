# Self-Review: Documentation Changes

Use this checklist for PRs that primarily change documentation (README, roadmap, ADRs, guides, glossary, etc.).

## Content

- [ ] New terms are added to `docs/explanation/glossary.md`
- [ ] Decisions are recorded in `docs/adr/` if they affect architecture or strategy
- [ ] `docs/roadmap.md` reflects the current phase state
- [ ] `docs/todo/current.md` reflects the current task state
- [ ] No contradictions with `docs/inheritance-from-nene2.md`

## Language

- [ ] Public docs (README, roadmap, ADRs, development guides) are in English
- [ ] No mixed canonical terms (use glossary terms consistently)
- [ ] No "Do not use" terms from the glossary

## Format

- [ ] Markdown renders correctly (headings, tables, code blocks)
- [ ] File is placed in the correct `docs/` subdirectory
- [ ] File name is kebab-case

## Links

- [ ] Internal links use relative paths and point to existing files
- [ ] External links are intentional and accurate
