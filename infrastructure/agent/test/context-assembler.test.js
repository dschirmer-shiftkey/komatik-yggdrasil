import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadContextBudget,
  getBudgetForRole,
  loadCategoryFindings,
} from "../lib/context-assembler.js";

describe("loadContextBudget", () => {
  it("returns defaults when file does not exist", () => {
    const budget = loadContextBudget("/nonexistent/path.yaml");
    assert.ok(budget.defaults);
    assert.equal(budget.defaults.max_context_tokens, 8000);
    assert.equal(budget.defaults.max_memory_tokens, 2000);
  });
});

describe("getBudgetForRole", () => {
  const config = {
    defaults: { max_context_tokens: 8000, max_memory_tokens: 2000 },
    overrides: {
      mission: { max_context_tokens: 12000, max_memory_tokens: 3000 },
    },
  };

  it("returns defaults for unknown role", () => {
    const budget = getBudgetForRole(config, "unknown");
    assert.equal(budget.max_context_tokens, 8000);
    assert.equal(budget.max_memory_tokens, 2000);
  });

  it("merges overrides for known role", () => {
    const budget = getBudgetForRole(config, "mission");
    assert.equal(budget.max_context_tokens, 12000);
    assert.equal(budget.max_memory_tokens, 3000);
  });

  it("inherits defaults not overridden", () => {
    const budget = getBudgetForRole(config, "mission");
    assert.ok(budget.max_context_tokens);
  });
});

describe("loadCategoryFindings", () => {
  it("returns empty string when file does not exist", () => {
    const result = loadCategoryFindings("/nonexistent/SHARED-FINDINGS.md");
    assert.equal(result, "");
  });

  it("returns empty string for placeholder content", () => {
    const tmpFile = path.join(os.tmpdir(), "test-shared-findings-placeholder.md");
    fs.writeFileSync(tmpFile, "# Shared Findings\n\n*No shared findings yet*\n");
    try {
      const result = loadCategoryFindings(tmpFile);
      assert.equal(result, "");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("returns formatted content for real findings", () => {
    const tmpFile = path.join(os.tmpdir(), "test-shared-findings-real.md");
    fs.writeFileSync(tmpFile, "# Shared Findings\n\nHousing First reduces chronic homelessness by 80%.\n");
    try {
      const result = loadCategoryFindings(tmpFile);
      assert.ok(result.includes("Category Shared Knowledge"));
      assert.ok(result.includes("Housing First reduces"));
      assert.ok(result.includes("do not re-research"));
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("returns empty string for empty file", () => {
    const tmpFile = path.join(os.tmpdir(), "test-shared-findings-empty.md");
    fs.writeFileSync(tmpFile, "");
    try {
      const result = loadCategoryFindings(tmpFile);
      assert.equal(result, "");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});
