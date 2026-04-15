import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { loadContextBudget, getBudgetForRole } from "../lib/context-assembler.js";

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
