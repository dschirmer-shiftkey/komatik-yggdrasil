/**
 * RBAC Policy Engine
 *
 * Loads rbac-policies.yaml and enforces tool-level access control.
 * Maps agents -> roles -> allowed tools. Default policy: deny_unspecified.
 */

import fs from "node:fs";
import yaml from "js-yaml";

let policies = null;

export function loadPolicies(configPath) {
  if (!fs.existsSync(configPath)) {
    console.warn(`[rbac] Policy file not found at ${configPath}, using permissive defaults`);
    policies = { default_policy: "allow", roles: {}, agents: {} };
    return policies;
  }
  policies = yaml.load(fs.readFileSync(configPath, "utf-8"));
  const agentCount = Object.keys(policies.agents || {}).length;
  const roleCount = Object.keys(policies.roles || {}).length;
  console.log(`[rbac] Loaded ${roleCount} roles, ${agentCount} agents, default: ${policies.default_policy}`);
  return policies;
}

export function authorize(agentId, toolName) {
  if (!policies) return { allowed: true, reason: "no policies loaded" };

  const agentEntry = policies.agents?.[agentId];
  if (!agentEntry) {
    if (policies.default_policy === "deny_unspecified") {
      return { allowed: false, reason: `agent '${agentId}' not in policy file` };
    }
    return { allowed: true, reason: "default allow" };
  }

  const roleName = agentEntry.role;
  const role = policies.roles?.[roleName];
  if (!role) {
    return { allowed: false, reason: `role '${roleName}' not defined` };
  }

  const allowed = role.allowed_tools?.includes(toolName) ?? false;
  if (!allowed) {
    return { allowed: false, reason: `tool '${toolName}' not in role '${roleName}' (${role.description})` };
  }

  return { allowed: true, reason: `role '${roleName}'` };
}

export function getAgentRole(agentId) {
  return policies?.agents?.[agentId]?.role || null;
}

export function getRoleTools(roleName) {
  return policies?.roles?.[roleName]?.allowed_tools || [];
}
