# DocCLI Quick Start Guide

Get started with docpilot in 5 minutes.

## What is docpilot?

docpilot is a documentation indexing and retrieval CLI designed for AI agents. It creates searchable indexes of markdown documentation and provides natural language query capabilities with citation-backed answers.

## Installation

```bash
npm install -g docpilot
# or use directly with npx
npx docpilot --help
```

## Quick Start Workflow

### Step 1: Build Your Documentation Index

Navigate to your project directory and build an index:

```bash
cd /path/to/your/project

docpilot build \
  --src . \
  --library "YourProjectName" \
  --version "1.0.0" \
  --out .docpilot/index.json
```

This scans all markdown files in your project and creates a searchable index.

**Output:**
```
Built index: .docpilot/index.json
Docs: 35, sections: 229
Source hash: sha256:abc123...
```

### Step 2: Create a Manifest (for `use` command)

Create a manifest file so the `use` command can find your docs:

```bash
echo '{
  "schema_version": "1",
  "library": "YourProjectName",
  "library_version": "1.0.0",
  "index_path": "index.json"
}' > .docpilot/docpilot.json
```

### Step 3: Explore Your Documentation

#### Check what's indexed:

```bash
# Summary statistics
docpilot stats

# Output:
# YourProjectName@1.0.0
# Docs: 35
# Sections: 229
# Code blocks: 12
# Built at: 2026-02-27T08:00:00.000Z

# List all documents
docpilot list | head -20
```

#### Search for topics:

```bash
docpilot search "authentication" --max-results 5

# Output:
# Results for "authentication" in YourProjectName@1.0.0:
# - [8.5] docs/auth-guide#oauth-setup :: OAuth Setup
# - [7.2] docs/security#authentication :: Authentication
# - [5.1] README#getting-started :: Getting Started
```

#### Open a specific document section:

```bash
docpilot open "docs/auth-guide#oauth-setup"

# Output:
# docs/auth-guide#oauth-setup (docs/auth-guide.md:45)
# OAuth Setup
#
# To configure OAuth authentication:
# 1. Register your application...
```

#### Get a citation:

```bash
docpilot cite "docs/auth-guide#oauth-setup"

# Output:
# YourProjectName@1.0.0:docs/auth-guide#oauth-setup:45-67
# docs/auth-guide.md:45
```

### Step 4: Task-Based Queries (The Power Feature)

Ask natural language questions and get citation-backed steps:

```bash
docpilot use "YourProjectName" "How do I set up authentication?" \
  --path .docpilot \
  --max-results 5

# Output:
# YourProjectName@1.0.0 :: How do I set up authentication? [authoritative]
# step_1 [confidence: 1]. Register your OAuth application with the provider...
#   command: oauth-cli register --provider github
#   prerequisites: API credentials from your OAuth provider
#   cite: YourProjectName@1.0.0:docs/auth-guide#registration:12-25
#
# step_2 [confidence: 0.9]. Configure environment variables...
#   command: export OAUTH_CLIENT_ID=your_client_id
#   cite: YourProjectName@1.0.0:docs/auth-guide#configuration:26-40
#
# Related docs: docs/auth-guide, docs/security
```

## Pre-Install Library Research (New)

Use this workflow when the library is not installed locally and you want to research docs first.

### Step A: Discover candidate libraries

```bash
docpilot discover "axios" --provider npm --max-results 5 --json
```

### Step B: Fetch and pin docs snapshot

```bash
docpilot fetch "npm:axios" --json
```

The fetch response includes:
- `resolved_ref` (immutable version/ref)
- `docs_dir` (snapshot docs path)
- `source_manifest_path` (provenance metadata)

### Step C: Build index from fetched docs with provenance

```bash
docpilot build \
  --src /path/to/fetched/docs \
  --library "axios" \
  --version "1.13.6" \
  --source-manifest /path/to/.docpilot/source.json \
  --out .docpilot/index.json
```

Then create `.docpilot/docpilot.json` and use normal `search/open/cite/use`.

## Common Workflows

### Developer Documentation Lookup

```bash
# 1. What's available?
docpilot stats

# 2. Find relevant docs
docpilot search "deployment"

# 3. Read the doc
docpilot open "docs/deployment-guide"

# 4. Get citation for reference
docpilot cite "docs/deployment-guide#production"
```

### AI Agent Integration

```bash
# 1. Understand the corpus
docpilot stats --json | jq '.docs_count'

# 2. Natural language query
docpilot use "MyProject" "How do I deploy to production?" \
  --path . --json | jq '.steps[0].instruction'

# 3. Follow related docs
docpilot open "docs/deployment-guide" --json | jq '.content'
```

### Continuous Documentation

```bash
# Update your docs, rebuild index
docpilot build --src . --library "MyProject" --version "1.0.1" --out .docpilot/index.json

# Update manifest version
jq '.library_version = "1.0.1"' .docpilot/docpilot.json > .docpilot/docpilot.json.tmp
mv .docpilot/docpilot.json.tmp .docpilot/docpilot.json
```

## Command Reference

### Core Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `build` | Create searchable index | `docpilot build --src . --library "Foo" --version "1.0.0"` |
| `list` | Show all indexed docs | `docpilot list` |
| `stats` | Show index statistics | `docpilot stats` |
| `search` | Keyword/phrase search | `docpilot search "backup"` |
| `open` | View document section | `docpilot open "readme#installation"` |
| `cite` | Get citation string | `docpilot cite "readme#features"` |
| `use` | Task-based query | `docpilot use "Foo" "How do I...?"` |
| `discover` | Find external docs/library candidates | `docpilot discover "express" --provider npm` |
| `fetch` | Snapshot external docs with pinned ref | `docpilot fetch "npm:express"` |

### Common Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--json` | Output as JSON | Human-readable |
| `--index <file>` | Index file path | `.docpilot/index.json` |
| `--path <dir>` | Manifest search path | current dir + node_modules |
| `--max-results <n>` | Limit results | 5 (`search`/`discover`), 3 (`use`) |
| `--max-chars <n>` | Limit content length | 2000 |
| `--source-manifest <file>` | Attach provenance to build output | none |

## JSON Output

All commands support `--json` for programmatic use:

```bash
# Structured search results
docpilot search "api" --json | jq '.results[] | {heading, score}'

# Task steps with confidence
docpilot use "Foo" "How to deploy?" --json | jq '.steps[] | {confidence, instruction}'

# Index statistics
docpilot stats --json | jq '{docs: .docs_count, sections: .sections_count}'
```

See [json_output_schema.md](./json_output_schema.md) for complete schemas.

## Tips & Tricks

### 1. Gitignore Your Index

The index can be regenerated, so keep it out of version control:

```bash
echo ".docpilot/index.json" >> .gitignore
```

Keep the manifest in version control:
```bash
git add .docpilot/docpilot.json
```

### 2. Use Relative Paths in CI

```bash
# In CI, use relative paths
docpilot build --src . --library "$PROJECT_NAME" --version "$VERSION"
```

### 3. Search Before Use

The `use` command is powerful but can be overkill for simple lookups:

```bash
# Simple lookup: use search
docpilot search "configuration"

# Complex task: use use
docpilot use "MyProject" "How do I configure authentication with OAuth?"
```

### 4. Chain Commands

```bash
# Find doc, then open it
DOC_ID=$(docpilot search "deploy" --json | jq -r '.results[0].doc_id')
docpilot open "$DOC_ID"
```

### 5. Related Docs Are Gold

The `use` command returns related docs - follow them for deeper understanding:

```bash
docpilot use "Foo" "How do I backup?" --json | jq -r '.related_docs[]'
# Output: docs/backup-guide, docs/restore-guide, readme
```

## Troubleshooting

### "Could not locate docs manifest"

**Error:**
```
RESOLUTION_FAILED: Could not locate docs manifest for library MyProject
```

**Solution:**
```bash
# Ensure docpilot.json exists
ls .docpilot/docpilot.json

# Or create it:
echo '{"schema_version":"1","library":"MyProject","library_version":"1.0.0","index_path":"index.json"}' > .docpilot/docpilot.json
```

### "No section found for doc_id"

**Error:**
```
REF_NOT_FOUND: No section found for my-doc#my-section
```

**Solution:**
```bash
# List available docs to find the correct ID
docpilot list | grep "my-doc"

# Or search for the topic
docpilot search "my topic"
```

### Empty Search Results

```bash
# Check what's indexed
docpilot stats

# Rebuild if needed
docpilot build --src . --library "MyProject" --version "1.0.0"
```

## Next Steps

- Read the [Agent Integration Guide](./docpilot-agent-integration.md) for AI agent workflows
- Read [Best Practices](./docpilot-best-practices.md) for optimization tips
- Check [JSON Output Schema](./json_output_schema.md) for programmatic integration

## Examples

### Example 1: Daily Developer Use

```bash
# Morning: check what changed
docpilot stats

# Find deployment docs
docpilot search "production deploy" --max-results 3

# Read the guide
docpilot open "docs/deployment#production"

# Share citation with team
docpilot cite "docs/deployment#production"
# Copy: MyProject@1.0.0:docs/deployment#production:45-67
```

### Example 2: AI Agent Assistance

```bash
# Agent receives task: "Deploy to production"

# 1. Find relevant docs
docpilot use "MyProject" "How do I deploy to production?" --path .docpilot --json

# 2. Extract high-confidence steps
# {
#   "steps": [
#     {"confidence": 1.0, "instruction": "Run ./deploy.sh prod", "command": "./deploy.sh prod"},
#     {"confidence": 0.8, "instruction": "Verify health checks", "command": "curl /health"}
#   ]
# }

# 3. Follow related docs for details
docpilot open "docs/deployment-guide" --json
```

### Example 3: Documentation as Code

```bash
#!/bin/bash
# In your CI/CD pipeline

set -e

VERSION=$(cat VERSION)

# Rebuild docs index
docpilot build --src . --library "MyProject" --version "$VERSION" --out .docpilot/index.json

# Update manifest
cat > .docpilot/docpilot.json <<EOF
{
  "schema_version": "1",
  "library": "MyProject",
  "library_version": "$VERSION",
  "index_path": "index.json"
}
EOF

# Validate index
docpilot stats --json | jq -e '.docs_count > 0'

echo "Documentation index built successfully"
```

## Support

- Documentation: [GitHub Repo](https://github.com/your-org/docpilot)
- Issues: [GitHub Issues](https://github.com/your-org/docpilot/issues)
- Schema Reference: [json_output_schema.md](./json_output_schema.md)
