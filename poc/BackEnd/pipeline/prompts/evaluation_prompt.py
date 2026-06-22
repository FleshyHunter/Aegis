"""Task-specific prompt text for one test-case evaluation."""

EVALUATION_PROMPT_TEMPLATE = """Evaluate the provided derived test case against the supplied BA and Building Block evidence.

Evaluate two independent axes:

1. Frame conformance
- Determine whether the test case belongs to one Building Block.
- If no Building Block matches, mark the route as not found.
- If a Building Block matches, compare the test case steps against the canonical Building Block steps.
- The test case must contain all canonical Building Block steps.
- Extra test case steps are allowed.
- Matching is semantic and evidence-based, not strict row-by-row position matching.

2. Requirement currency
- If BA rules are provided, use the test case result_code to find the latest BA rule.
- If BA rules are provided, compare the test case evidence against the latest BA rule.
- If BA rules are unavailable, requirement currency is not assessed.
- Use historical BA rows only as context for explaining staleness when BA rules are provided.
- Steps and expected results are stronger evidence than title wording.
- Check BA fields that define current expected behaviour, including action labels, status/display values, automation flags, notification requirements, permission flags, validity, and deprecated/obsolete status.

Use project context only as reusable domain background. Use any user prompt only as run-specific clarification. Do not let either override BA or Building Block truth.

Required JSON response shape:
{
  "building_block": {
    "matched": true,
    "building_block_id": "",
    "block_id": "",
    "title": "",
    "version": "",
    "explanation": ""
  },
  "frame": {
    "passed": true,
    "missing_steps": [],
    "explanation": ""
  },
  "currency": {
    "passed": true,
    "ba_rule_id": "",
    "ba_version_used": "",
    "explanation": ""
  }
}
"""


def get_evaluation_prompt() -> str:
    return EVALUATION_PROMPT_TEMPLATE.strip()
