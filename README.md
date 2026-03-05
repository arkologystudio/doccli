# 🥾 Trail Docs

**Natural language documentation retrieval for AI agents — via CLI.**

`trail-docs` turns markdown docs into a searchable, citation-backed knowledge base. It gives agents a faster trail through your documentation than reading every file or grepping in the dark.

Built *for* agents. Usable by humans. No LLM required.

```bash
npm install -g trail-docs
```

---

## Why Trail Docs

AI agents navigating software libraries typically do one of two things:

1. **Read everything** — dump 30 files into context, burn tokens, hope for the best.
2. **Grep and pray** — `rg "configureSSL" --type js` returns 14 lines across 6 files. Good luck figuring out the order and what's actually relevant.

Trail Docs offers a third path: **build an index once, query it many times.**

### Grep vs Trail Docs

```bash
# Grep: "here are some lines that match"
$ rg "configure SSL" ./docs
docs/security.md:12:  To configure SSL, first generate a certificate...
docs/deployment.md:45:  SSL is configured via the server options...
docs/cli-reference.md:89:  --secure  Enable SSL (requires configure SSL step)
docs/changelog.md:201:  v2.1: Fixed configure SSL regression
docs/troubleshooting.md:34:  If configure SSL fails, check permissions...
# 5 files, 5 fragments, no structure, no sequence, no context.
# Agent now has to open each file and read surrounding lines.
```

```bash
# Trail Docs: "here's what the docs say about that, with citations"
$ trail-docs use "MyProject" "How do I configure SSL?" --json
{
  "task": "How do I configure SSL?",
  "results": [
    {
      "instruction": "Generate a TLS certificate using the built-in CLI...",
      "confidence": 0.95,
      "command": "my-project cert generate --out ./certs",
      "citations": ["MyProject@2.4.1:docs/security#ssl-setup:10-30"]
    },
    {
      "instruction": "Enable TLS in your server configuration...",
      "confidence": 0.82,
      "command": "my-project serve --secure --cert ./certs/server.pem",
      "citations": ["MyProject@2.4.1:docs/deployment#tls:42-55"]
    }
  ]
}
# Structured results. Exact file + line citations. Code examples extracted.
# Agent can act on this immediately.
```

**Grep gives you fragments. Trail Docs gives you cited, structured results.**

They're different tools. Grep answers "where is this string?" Trail Docs answers "what do the docs say about this topic?" Agents need both — but only had good tooling for the first one.

### How it works under the hood

Trail Docs is **purely algorithmic**. No LLM in the retrieval loop. No vector embeddings. No magic.

- **Indexing:** Parses markdown into sections (by heading), extracts code blocks, normalizes text, stores everything in a flat JSON index.
- **Search:** Tokenizes your query, counts keyword frequency against each section. Headings weighted 2x. Intent detection (action? debugging? release?) reranks results.
- **Results:** Ordered by relevance score, not by logical sequence. Each result includes the section's text, extracted code/commands, and exact file + line range citations.

This means: results are **deterministic and fast**, but they're ranked by keyword relevance, not by an LLM's understanding of logical order. The "steps" are really "most relevant sections, structured and cited." That's the honest trade-off — you get speed, reproducibility, and zero external dependencies, but not the reasoning of a language model.

For most agent workflows, this is the right trade-off. The agent already has an LLM — it just needs the *right documentation* fed to it efficiently.

---

## Core Workflows

### 🥾 Trail 1: Local docs (your own project)

Index your project's markdown docs and query them:

```bash
# Build the index
trail-docs build --src . --library "MyProject" --version "1.0.0" \
  --out .trail-docs/index.json

# Create the manifest
echo '{"schema_version":"1","library":"MyProject","library_version":"1.0.0","index_path":"index.json"}' \
  > .trail-docs/trail-docs.json

# Ask a question
trail-docs use "MyProject" "How do I deploy to production?" --path .trail-docs
```

### 🔭 Trail 2: Pre-install research (unknown library)

Evaluate a library's docs and API surface *before* installing it:

```bash
# Discover candidates
trail-docs discover "axios" --provider npm --max-results 5 --json

# Fetch docs snapshot with pinned source ref
trail-docs fetch "npm:axios" --json

# Build index from fetched docs
trail-docs build \
  --src .trail-docs/cache/sources/<snapshot>/docs \
  --library "axios" \
  --version "1.13.6" \
  --source-manifest .trail-docs/cache/sources/<snapshot>/.trail-docs/source.json \
  --out .trail-docs/index.json

# Or do it all in one shot:
trail-docs prep "axios" --path .trail-docs --json

# One-shot URL ingestion:
trail-docs index "https://raw.githubusercontent.com/axios/axios/v1.x/README.md" \
  --path .trail-docs --json
```

### 🗺️ Trail 3: API surface + callable guidance

Understand a library's shape without reading its source:

```bash
# Extract exported API + signatures
trail-docs surface npm:openai --json

# Look up a specific callable
trail-docs fn "npm:openai#OpenAI.complete" --json

# Route a task across multiple candidate libraries
trail-docs use "extract structured data from text" --libs npm:openai,npm:transformers --json
```

---

## Commands

| Command | What it does |
|---|---|
| `bootstrap` | Generate markdown from codebase and build index |
| `build` | Build deterministic index from markdown |
| `list` | List indexed documents |
| `stats` | Index metadata and coverage |
| `discover` | Find external libraries/docs candidates |
| `fetch` | Fetch docs snapshot with pinned source metadata |
| `prep` / `index` | One-shot discover → fetch → build → manifest |
| `surface` | Extract library API exports, symbols, signatures |
| `fn` | Resolve one callable/type with signature-level citations |
| `search` | Lexical section search |
| `open` | Open section content |
| `cite` | Emit canonical citation |
| `use` | Task-based retrieval with structured results and citations |

All commands support `--json` for agent-friendly output.

---

## Agent Integration

Trail Docs is designed to slot into any agent workflow that can run shell commands. No MCP server, no protocol negotiation — just a CLI and JSON responses.

**Why CLI over MCP?** Agents already know CLIs. Every major agent framework — Claude Code, Cursor, Aider, OpenHands — can run shell commands out of the box. CLI is the lowest common denominator. Zero infrastructure, maximum compatibility.

```bash
# Agent's typical workflow:
trail-docs prep "some-library" --path .trail-docs --json   # research
trail-docs use "some-library" "How do I authenticate?" --json  # query
trail-docs fn "npm:some-library#Client.auth" --json            # drill down
```

The `--json` flag is the key. Every command returns structured, parseable output that agents can consume directly. No screen-scraping, no output parsing heuristics.

---

## Project Config (`trail-docs.toml`)

Optional project-level defaults:

```toml
library = "MyProject"
index_path = ".trail-docs/index.json"
manifest_path = ".trail-docs"
output = "json"

[trust]
policy = "trail-docs.policy.json"

[federation]
indexes = [".trail-docs/index.json", "../plugin/.trail-docs/index.json"]
```

Run `trail-docs --help` for full flags.

---

## JSON Output

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

---

## Safety Model for External Docs

Fetched documentation is treated as **untrusted input**. Always.

`fetch` supports policy controls via `trail-docs.policy.json`:

```json
{
  "allowed_hosts": ["registry.npmjs.org", "api.github.com", "github.com", "codeload.github.com"],
  "blocked_hosts": [],
  "allowed_extensions": [".md", ".markdown", ".mdx", ".txt"],
  "max_files": 2000,
  "max_total_bytes": 20971520
}
```

The source manifest tracks: canonical URL, requested/resolved refs, integrity hash, fetch timestamp, and suspicious-pattern trust signals. No execution of fetched content, ever.

---

## Performance

- **Build once, query many.** The index is deterministic and cacheable.
- **Use `--json`** for agent integrations — structured output, no parsing needed.
- **Reuse cached snapshots** from `.trail-docs/cache/sources` for repeated external research.

---

## Testing

```bash
npm test
```

Covers: deterministic builds, retrieval commands, manifest resolution, bootstrap flows, discovery/fetch, and end-to-end pre-install research.

---

## Documentation

1. [Quick Start](./docs/trail-docs-quick-start.md)
2. [Agent Integration](./docs/trail-docs-agent-integration.md)
3. [Best Practices](./docs/trail-docs-best-practices.md)
4. [JSON Output Schema](./docs/json_output_schema.md)
5. [V1 Publishing Plan](./docs/v1_publishing_plan.md)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The codebase is intentionally simple — Node 20+, minimal dependencies, fun to hack on.

---

## License

MIT — see [LICENSE](./LICENSE).
