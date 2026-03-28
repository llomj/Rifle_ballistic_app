# Debug Report: Question Anomalies

This file documents anomalies found in questions where the logic doesn't make sense or questions are unclear.

## Summary

**Status**: CLI question bank (3300 questions across 11 levels).  
**Note**: Python-related content was removed. This app is CLI/terminal focused only.

---

## How Question IDs Work

- **Total questions**: 3300 (300 per level × 11 levels)
- **IDs**: 1–3300
- **Level 0 (Tadpole)**: IDs 1–300
- **Level 1 (Plankton)**: IDs 301–600
- **Level 2 (Shrimp)**: IDs 601–900
- **Level 3 (Crab)**: IDs 901–1200
- **Level 4 (Small Fish)**: IDs 1201–1500
- **Level 5 (Octopus)**: IDs 1501–1800
- **Level 6 (Seal)**: IDs 1801–2100
- **Level 7 (Dolphin)**: IDs 2101–2400
- **Level 8 (Shark)**: IDs 2401–2700
- **Level 9 (Whale)**: IDs 2701–3000
- **Level 10 (God Whale)**: IDs 3001–3300

---

## Anomaly Types to Check

### 1. Unclear Questions
- Questions that reference commands or flags without enough context
- Pattern: vague phrasing or missing examples

### 2. Code Formatting Issues
- Code snippets split across lines when they should stay on one line
- Shell syntax that might display incorrectly

### 3. Duplicate/Unclear Options
- Options that look identical (especially spacing differences)
- Options that can't be distinguished visually

### 4. Missing Context
- Questions that reference commands without showing usage
- Explanations that don't match the question

---

## Review Process

1. Check each level's questions for unclear patterns
2. Verify code formatting for CLI commands
3. Check for duplicate or confusing options
4. Ensure explanations match the correct answer

---

## Recommendations

1. **Systematic review**: Go through each level's questions for clarity
2. **User testing**: Have users report unclear questions
3. **Validation script**: Run `scripts/validate_cli_questions.py` after changes

---

## Rifle ballistic app — trajectory solver (March 2026)

- **Engine:** Drop vs bore uses **Ingalls G1 tables** scaled by published **G1 BC** (same family as GNU exterior ballistics / `pg-drag`: velocity vs range, time of flight, then \( \frac{1}{2} g t^2 \) drop). This replaces an earlier toy model (gravity + fake velocity decay) that did not match real tables.
- **Zero / LOS:** Elevation **relative to line of sight** at the profile zero distance uses the linear LOS crossing model (scope height + bullet path vs zero range); at the zero range, correction is 0 cm / 0 clicks.
- **Reference card** (`rifle_distance.py` / AGENTS.md turret lines): numbers are a **fixed** hunting card; the live solver varies with **MV, BC, scope height, zero**. Mid-range rows (e.g. 150–400 m) should track the card closely for the default .300 Win Mag load; very long range may differ from any printed card due to atmosphere, G7 vs G1, etc.
- **G7 bullets:** The app may pass **G7 BC** into the G1 Ingalls path when the catalog marks G7 — acceptable for a field app; for best G7 long-range accuracy, a future **G7 drag curve** would be needed.
