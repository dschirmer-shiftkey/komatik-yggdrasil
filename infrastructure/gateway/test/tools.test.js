import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { TOOL_HANDLERS } from "../tools.js";

describe("Tool registry", () => {
  const expectedTools = [
    "register_identity",
    "create_workflow",
    "get_workflow",
    "advance_workflow",
    "get_agent_queue",
    "complete_step",
    "fail_step",
    "send_agent_message",
    "get_messages",
    "create_task",
    "update_task",
    "write_output",
    "read_project_file",
    "search_codebase",
    "get_system_health",
    "get_circuit_breaker_status",
    "reset_circuit_breaker",
  ];

  it("exports all 17 tools", () => {
    assert.equal(Object.keys(TOOL_HANDLERS).length, 17);
  });

  for (const tool of expectedTools) {
    it(`includes '${tool}' handler`, () => {
      assert.equal(typeof TOOL_HANDLERS[tool], "function");
    });
  }
});
