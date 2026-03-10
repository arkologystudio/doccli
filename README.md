# Trail Docs

Navigation-first documentation retrieval for AI agents.

`trail-docs` builds a deterministic markdown index and serves high-signal evidence units with strict token budgets.

## Install

```bash
npm install -g trail-docs
trail-docs --help
```

## Core Model (v2)

- Agent controls pathfinding.
- `trail-docs` returns citation-backed evidence units.
- Retrieval is deterministic and heuristic-only (no model reranker).

## Primary Workflow

```bash
# Build index
trail-docs build --src . --library "MyProject" --version "1.0.0" --out .trail-docs/index.json

# Hop 1: find starting refs
trail-docs find "oauth refresh token" --index .trail-docs/index.json --budget 400 --max-items 6 --json

# Hop 2: expand one anchor under hard budget
trail-docs expand "auth/oauth#refresh-token" --index .trail-docs/index.json --budget 300 --json

# Hop 2b: graph neighbors
trail-docs neighbors "auth/oauth#refresh-token" --index .trail-docs/index.json --json

# Hop 3: query-conditioned extraction from selected refs
trail-docs extract "oauth refresh token" \
  --from "auth/oauth#refresh-token,webhooks/verify#signature-validation" \
  --index .trail-docs/index.json \
  --budget 700 \
  --max-items 8 \
  --json
```

## Open Modes

```bash
# default: units mode
trail-docs open "auth/oauth#refresh-token" --index .trail-docs/index.json --json

# section mode
trail-docs open "auth/oauth#refresh-token" --mode section --index .trail-docs/index.json --json
```

## Trail State

Persistent notebook state is stored in `.trail-docs/trails/*.json`.

```bash
trail-docs trail create --objective "map auth coverage" --json
trail-docs trail add --trail trail_xxxxx --ref "auth/oauth#refresh-token" --index .trail-docs/index.json --json
trail-docs trail pin --trail trail_xxxxx --citation "MyProject@1.0.0:auth/oauth#refresh-token:10-20" --json
trail-docs trail tag --trail trail_xxxxx --tag "coverage:auth" --json
trail-docs trail show --trail trail_xxxxx --json
```

## Commands

- `bootstrap`
- `build`
- `list`
- `stats`
- `discover`
- `fetch`
- `prep` / `index`
- `surface`
- `fn`
- `find`
- `search` (alias of `find`)
- `expand`
- `neighbors`
- `extract`
- `open`
- `cite`
- `trail`

## Breaking Changes in v2

- `use` command removed.
- `search` now follows navigation-first response shape.
- `open` defaults to `--mode units`.
- Index schema is now `schema_version: "2"` and includes `evidence_units[]` and `anchor_graph[]`.

## Evaluation

```bash
npm test
npm run eval:smoke:ci
node ./eval/src/run-eval.mjs --profile iterative-smoke --config eval/config/eval.config.ci.json --allow-missing-context7
```

Result artifacts are written to `eval/results/` as raw JSONL, summary JSON, and markdown report.

### Benchmark Snapshot (Latest Full CI Run)

Run: `full-2026-03-10T05-55-43-987Z`

- 📌 Scenario: same case set, same judge, same answer model across `trail-docs`, `grep`, and `context7`.
- 🧭 Retrieval flow:
  - `trail-docs`: multi-hop (`find -> expand/neighbors -> extract`)
  - `grep`: direct lexical retrieval baseline
  - `context7`: external retriever adapter
- 📊 Metrics: comprehension, token usage, latency, reliability, and navigation quality.

| Tool | Success | Mean Comprehension | Mean Tokens | Mean Latency |
|---|---:|---:|---:|---:|
| `trail-docs` | ✅ 1.00 | 0.9333 | **487.33** | 5517.49 ms |
| `grep` | ✅ 1.00 | **0.9632** | 984.33 | **5159.75 ms** |
| `context7` | ✅ 1.00 | 0.5450 | 2204.00 | 11616.39 ms |

#### Pairwise Highlights

- 🚀 `trail-docs` vs `context7`
  - +0.3883 comprehension
  - -1716.67 tokens
  - -6098.90 ms latency
  - Win rate: `trail-docs` 1.0
- ⚖️ `trail-docs` vs `grep`
  - -0.0299 comprehension
  - -497.00 tokens
  - +357.74 ms latency
  - Win rate: `trail-docs` 0.6667
- 🎯 Navigation quality (`trail-docs`):
  - first-hop precision@k: 0.5556
  - coverage@2: 0.8333
  - coverage@3: 0.8333
  - citation precision (line-level): 1.0

See:

- `eval/results/full-2026-03-10T05-55-43-987Z.summary.json`
- `eval/results/full-2026-03-10T05-55-43-987Z.report.md`

## JSON Schema

See [docs/json_output_schema.md](./docs/json_output_schema.md).
