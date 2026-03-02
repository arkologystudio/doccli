import fs from "node:fs";
import path from "node:path";
import { toPosixPath } from "./utils.mjs";

const SEARCH_ROOTS = ["examples", "example", "test", "tests", "__tests__", "README.md", "docs"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".mts", ".cts"]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdx"]);

function walkFiles(rootDir, output) {
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (CODE_EXTENSIONS.has(extension) || MARKDOWN_EXTENSIONS.has(extension)) {
        output.push(fullPath);
      }
    }
  }
}

function collectSearchFiles(rootDir) {
  const candidates = [];

  for (const entry of SEARCH_ROOTS) {
    const fullPath = path.join(rootDir, entry);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      candidates.push(fullPath);
      continue;
    }

    if (stat.isDirectory()) {
      walkFiles(fullPath, candidates);
    }
  }

  candidates.sort((left, right) => left.localeCompare(right));
  return candidates;
}

function lineNumberFromIndex(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function markdownBlocks(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let inFence = false;
  let fenceStart = 1;
  let current = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith("```")) {
      if (inFence) {
        blocks.push({
          code: current.join("\n").trim(),
          line_start: fenceStart,
          line_end: index + 1
        });
        current = [];
        inFence = false;
      } else {
        inFence = true;
        fenceStart = index + 1;
      }
      continue;
    }

    if (inFence) {
      current.push(line);
    }
  }

  return blocks.filter((entry) => entry.code);
}

function snippetAroundLine(content, lineNumber, window = 6) {
  const lines = content.split(/\r?\n/);
  const start = Math.max(1, lineNumber - window);
  const end = Math.min(lines.length, lineNumber + window);
  return {
    code: lines.slice(start - 1, end).join("\n").trim(),
    line_start: start,
    line_end: end
  };
}

function pushExample(resultMap, symbolId, example, maxExamples) {
  if (!resultMap.has(symbolId)) {
    resultMap.set(symbolId, []);
  }

  const list = resultMap.get(symbolId);
  const key = `${example.source_path}:${example.line_start}:${example.code}`;
  if (list.some((entry) => `${entry.source_path}:${entry.line_start}:${entry.code}` === key)) {
    return;
  }

  if (list.length < maxExamples) {
    list.push(example);
  }
}

function matchIndexes(content, matcher) {
  const output = [];
  let index = content.indexOf(matcher);
  while (index >= 0) {
    output.push(index);
    index = content.indexOf(matcher, index + matcher.length);
  }
  return output;
}

export function mineExamples({ rootDir, symbols, maxExamples = 3 }) {
  const files = collectSearchFiles(rootDir);
  const resultMap = new Map();

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, "utf8");
    const normalizedPath = toPosixPath(path.relative(rootDir, filePath));

    for (const symbol of symbols) {
      const primaryNeedle = symbol.fq_name;
      const secondaryNeedle = `${symbol.name}(`;
      const matchedIndexes = [];

      if (primaryNeedle) {
        matchedIndexes.push(...matchIndexes(content, primaryNeedle));
      }
      if (matchedIndexes.length === 0 && secondaryNeedle) {
        matchedIndexes.push(...matchIndexes(content, secondaryNeedle));
      }

      if (matchedIndexes.length === 0) {
        continue;
      }

      if (MARKDOWN_EXTENSIONS.has(extension)) {
        const blocks = markdownBlocks(content);
        for (const block of blocks) {
          if (!block.code.includes(primaryNeedle) && !block.code.includes(secondaryNeedle)) {
            continue;
          }

          pushExample(
            resultMap,
            symbol.symbol_id,
            {
              code: block.code,
              source_path: normalizedPath,
              line_start: block.line_start,
              line_end: block.line_end
            },
            maxExamples
          );
        }
        continue;
      }

      for (const index of matchedIndexes) {
        const line = lineNumberFromIndex(content, index);
        const snippet = snippetAroundLine(content, line, 6);
        if (!snippet.code) {
          continue;
        }

        pushExample(
          resultMap,
          symbol.symbol_id,
          {
            code: snippet.code,
            source_path: normalizedPath,
            line_start: snippet.line_start,
            line_end: snippet.line_end
          },
          maxExamples
        );
      }
    }
  }

  for (const [key, value] of resultMap.entries()) {
    value.sort((left, right) => {
      if (left.source_path !== right.source_path) {
        return left.source_path.localeCompare(right.source_path);
      }
      return left.line_start - right.line_start;
    });
    resultMap.set(key, value.slice(0, maxExamples));
  }

  return resultMap;
}
