/**
 * Structured finding extraction helpers.
 *
 * Synthesis agents can publish machine-readable findings by including JSON
 * fenced code blocks in their normal markdown output. Markdown permits code
 * fences of three or more matching backticks or tildes, so the parser accepts
 * all of those forms instead of only the common ```json variant.
 */

export function parseJsonBlocks(content, { onInvalid } = {}) {
  if (!content) return [];

  const blocks = [];
  const fencePattern = /(^|\n)(`{3,}|~{3,})[ \t]*json[ \t]*\r?\n([\s\S]*?)(?:\r?\n)?\2[ \t]*(?=\n|$)/gi;

  for (const match of content.matchAll(fencePattern)) {
    try {
      blocks.push(JSON.parse(match[3].trim()));
    } catch (err) {
      if (onInvalid) onInvalid(err);
    }
  }

  return blocks;
}

export function extractStructuredFindings(content, opts = {}) {
  return parseJsonBlocks(content, opts).flatMap((block) => {
    if (Array.isArray(block?.world_tree_findings)) return block.world_tree_findings;
    if (Array.isArray(block?.findings)) return block.findings;
    if (block?.title && block?.summary && block?.content) return [block];
    return [];
  });
}
