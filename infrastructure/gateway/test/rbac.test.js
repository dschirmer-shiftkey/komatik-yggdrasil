import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { loadPolicies, authorize, getAgentRole, getRoleTools } from "../rbac.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RBAC_PATH = path.join(__dirname, "..", "..", "config", "rbac-policies.yaml");

describe("RBAC", () => {
  it("loads policies from YAML", () => {
    const policies = loadPolicies(RBAC_PATH);
    assert.ok(policies.roles);
    assert.ok(policies.agents);
    assert.equal(policies.default_policy, "deny_unspecified");
  });

  it("returns correct role for known agents", () => {
    loadPolicies(RBAC_PATH);
    assert.equal(getAgentRole("mission"), "guardian");
    assert.equal(getAgentRole("research"), "researcher");
    assert.equal(getAgentRole("analysis"), "builder");
    assert.equal(getAgentRole("community"), "moderator");
  });

  it("returns null for unknown agents", () => {
    loadPolicies(RBAC_PATH);
    assert.equal(getAgentRole("unknown"), null);
  });

  it("authorizes allowed tools", () => {
    loadPolicies(RBAC_PATH);
    const result = authorize("mission", "create_workflow");
    assert.equal(result.allowed, true);
  });

  it("denies unallowed tools", () => {
    loadPolicies(RBAC_PATH);
    const result = authorize("research", "create_workflow");
    assert.equal(result.allowed, false);
  });

  it("denies unknown agents under deny_unspecified", () => {
    loadPolicies(RBAC_PATH);
    const result = authorize("hacker", "get_messages");
    assert.equal(result.allowed, false);
  });

  it("returns tools for a role", () => {
    loadPolicies(RBAC_PATH);
    const tools = getRoleTools("guardian");
    assert.ok(tools.includes("create_workflow"));
    assert.ok(tools.includes("reset_circuit_breaker"));
  });
});
