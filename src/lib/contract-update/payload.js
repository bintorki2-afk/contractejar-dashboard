import { humanizeFieldKeys } from "@/src/lib/field-labels";
import { CONTRACT_STEP_KEYS } from "./step-values";
import {
  parseTenantRoleIds,
  tenantRoleIdsEqual,
  tenantRoleValuesEqual,
  filterTenantRoleValuesForIds,
} from "./tenant-roles";
import { otherConditionsListEqual, sanitizeOtherConditionsList } from "./other-conditions";
import { FILE_FIELD_KEYS, REQUIRED_BOOLEAN_DEFAULTS } from "./field-normalize";

export function buildContractUpdatePayload(step, form, initialForm) {
  const allowed = new Set(CONTRACT_STEP_KEYS[step] ?? []);
  const payload = {};

  for (const [key, value] of Object.entries(form)) {
    if (!allowed.has(key)) continue;
    const initial = initialForm?.[key];

    if (key === "tenant_role_ids") {
      const ids = parseTenantRoleIds(value);
      if (!tenantRoleIdsEqual(ids, initial)) {
        payload[key] = ids;
      }
      continue;
    }

    if (key === "tenant_role_values") {
      if (!tenantRoleValuesEqual(value, initial)) {
        payload[key] = filterTenantRoleValuesForIds(value, form.tenant_role_ids ?? initialForm?.tenant_role_ids);
      }
      continue;
    }

    if (key === "other_conditions_list") {
      if (!otherConditionsListEqual(value, initial)) {
        payload[key] = sanitizeOtherConditionsList(value);
      }
      continue;
    }

    if (value === initial) continue;
    if (value === "" && (initial === "" || initial === undefined)) continue;

    // Existing file URLs are display-only; only new File uploads are sent.
    if (FILE_FIELD_KEYS.has(key) && !(typeof File !== "undefined" && value instanceof File)) {
      continue;
    }

    if (
      ["furnished", "kitchen_tank", "add_legal_agent_of_owner", "is_there_a_legal_representative_of_the_tenant"].includes(
        key
      )
    ) {
      payload[key] = value === 1 || value === "1" || value === true ? 1 : 0;
      continue;
    }

    payload[key] = value;
  }

  // Keep tenant role flag + values in sync whenever selection changes.
  if (allowed.has("tenant_role_ids") && ("tenant_role_ids" in payload || "tenant_role_values" in payload)) {
    const ids = parseTenantRoleIds(form.tenant_role_ids);
    payload.tenant_role_ids = ids;
    if (allowed.has("tenant_roles")) {
      payload.tenant_roles = ids.length > 0 ? 1 : 0;
    }
    if (allowed.has("tenant_role_values")) {
      payload.tenant_role_values = filterTenantRoleValuesForIds(form.tenant_role_values, ids);
    }
  }

  // Keep conditions flag + list in sync.
  if (allowed.has("other_conditions_list") && ("other_conditions_list" in payload || "conditions" in payload)) {
    const enabled = form.conditions === true || form.conditions === 1 || form.conditions === "1";
    if (allowed.has("conditions")) {
      payload.conditions = enabled ? 1 : 0;
    }
    payload.other_conditions_list = enabled ? sanitizeOtherConditionsList(form.other_conditions_list) : [];
  }

  for (const [key, defaultValue] of Object.entries(REQUIRED_BOOLEAN_DEFAULTS)) {
    if (!allowed.has(key) || key in payload) continue;
    if (!(key in form)) continue;
    const value = form[key];
    payload[key] = value === 1 || value === "1" || value === true ? 1 : defaultValue;
  }

  return payload;
}

export function mapApiValidationErrors(errors) {
  if (!errors || typeof errors !== "object") return {};
  const mapped = {};
  for (const [key, messages] of Object.entries(errors)) {
    const message = humanizeFieldKeys(Array.isArray(messages) ? messages[0] : String(messages));
    mapped[key] = message;
    // Laravel-style nested keys: tenant_role_values.3
    if (key.startsWith("tenant_role_values.")) {
      mapped[key] = message;
    }
  }
  return mapped;
}
