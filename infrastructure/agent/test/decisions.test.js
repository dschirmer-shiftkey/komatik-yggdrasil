import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("decisions module", () => {
  it("exports expected functions", async () => {
    const mod = await import("../lib/decisions.js");
    assert.equal(typeof mod.logDecision, "function");
    assert.equal(typeof mod.updateDecisionOutcome, "function");
    assert.equal(typeof mod.retractDecision, "function");
    assert.equal(typeof mod.getRecentDecisions, "function");
    assert.equal(typeof mod.getDecisionsByType, "function");
  });
});
