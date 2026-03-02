# DocCLI

Natural language documentation retrieval for AI agents – via CLI!

`docpilot` turns markdown docs into a searchable, citation-backed knowledge base and now supports pre-install research for external libraries.

`docpilot`'s purpose is to improve codebase comprehension and navitation for agents – ultimately making it easier, faster and cheaper to use software libraries. 

`docpilot` was designed primarily _for_ agents, although it can be used by human developers as well.


## Why DocCLI

AI agents typically either:

1. Read too many files (high token cost), or
2. Use brittle grep loops (high latency, weak traceability).

`docpilot` provides:

1. Fast local retrieval from an index.
2. Deterministic JSON output.
3. Precise citations with line ranges.
4. Optional external-source provenance for pre-install research.

## Install

```bash
npm install -g docpilot
```

## Core Workflows

### 1) Local docs workflow (existing project docs)

```bash
docpilot build --src . --library "MyProject" --version "1.0.0" --out .docpilot/index.json

echo '{"schema_version":"1","library":"MyProject","library_version":"1.0.0","index_path":"index.json"}' > .docpilot/docpilot.json

docpilot use "MyProject" "How do I deploy to production?" --path .docpilot
```

### 2) Pre-install research workflow (unknown library)

```bash
# Discover candidates
# (providers: all|catalog|npm|github)
docpilot discover "axios" --provider npm --max-results 5 --json

# Fetch docs snapshot and pin source ref
docpilot fetch "npm:axios" --json

# Build index from fetched docs with provenance
# (using the fetch output paths)
docpilot build \
  --src .docpilot/cache/sources/<snapshot>/docs \
  --library "axios" \
  --version "1.13.6" \
  --source-manifest .docpilot/cache/sources/<snapshot>/.docpilot/source.json \
  --out .docpilot/index.json

# One-shot alternative (discover/fetch/build/manifest):
docpilot prep "axios" --path .docpilot --json

# One-shot URL ingestion:
docpilot index "https://raw.githubusercontent.com/axios/axios/v1.x/README.md" --path .docpilot --json
```

### 3) API surface + callable guidance workflow

```bash
# Extract exported API + signatures
docpilot surface npm:openai --json

# Look up a concrete callable
docpilot fn "npm:openai#OpenAI.complete" --json

# Route a task across multiple candidate libraries
docpilot use "extract structured data from text" --libs npm:openai,npm:transformers --json
```

## Commands

| Command | Purpose |
|---|---|
| `bootstrap` | Generate markdown from codebase and build index |
| `build` | Build deterministic index from markdown |
| `list` | List indexed documents |
| `stats` | Index metadata and coverage |
| `discover` | Discover external libraries/docs candidates |
| `fetch` | Fetch docs snapshot with pinned source metadata |
| `prep` / `index` | One-shot discover/fetch/build/manifest pipeline |
| `surface` | Extract library API exports, symbols, signatures, and examples |
| `fn` | Resolve one callable/type with signature-level citations |
| `search` | Lexical section search |
| `open` | Open section content |
| `cite` | Emit canonical citation |
| `use` | Task-based steps with citations |

## Project Config (`docpilot.toml`)

Optional project defaults:

```toml
library = "MyProject"
index_path = ".docpilot/index.json"
manifest_path = ".docpilot"
output = "json"

[trust]
policy = "docpilot.policy.json"

[federation]
indexes = [".docpilot/index.json", "../plugin/.docpilot/index.json"]
```

Run `docpilot --help` for full flags.

## JSON Output

All commands support `--json`.

Example (`use`):

```json
{
  "task": "How do I configure SSL?",
  "library": "MyProject",
  "version": "1.0.0",
  "confidence": "authoritative",
  "steps": [
    {
      "id": "step_1",
      "instruction": "...",
      "confidence": 0.95,
      "command": "...",
      "citations": ["MyProject@1.0.0:docs/security#ssl:10-30"]
    }
  ],
  "citations": ["MyProject@1.0.0:docs/security#ssl:10-30"],
  "citation_details": [
    {
      "citation_id": "...",
      "provenance": {
        "source_type": "registry",
        "provider": "npm",
        "canonical_url": "https://...",
        "resolved_ref": "1.13.6"
      }
    }
  ]
}
```

Full schema: [docs/json_output_schema.md](./docs/json_output_schema.md)

## Safety Model for External Docs

Fetched documentation is treated as untrusted input.

`fetch` supports policy controls via `docpilot.policy.json`:

```json
{
  "allowed_hosts": ["registry.npmjs.org", "api.github.com", "github.com", "codeload.github.com"],
  "blocked_hosts": [],
  "allowed_extensions": [".md", ".markdown", ".mdx", ".txt"],
  "max_files": 2000,
  "max_total_bytes": 20971520
}
```

The source manifest stores:

1. Canonical source URL.
2. Requested and resolved refs.
3. Integrity/hash signal.
4. Fetch timestamp.
5. Suspicious-pattern trust signals.

## Performance Notes

`docpilot` is optimized for deterministic local retrieval.

1. Build once, query many.
2. Use `--json` for agent integrations.
3. For repeated external research, reuse cached snapshots from `.docpilot/cache/sources`.

## Testing

```bash
npm test
```

Current suite covers deterministic builds, retrieval commands, manifest resolution, bootstrap flows, discovery/fetch basics, and end-to-end pre-install research.

## Documentation

1. [Quick Start](./docs/docpilot-quick-start.md)
2. [Agent Integration](./docs/docpilot-agent-integration.md)
3. [Best Practices](./docs/docpilot-best-practices.md)
4. [JSON Output Schema](./docs/json_output_schema.md)
5. [V1 Publishing Plan](./docs/v1_publishing_plan.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT, see [LICENSE](./LICENSE).
