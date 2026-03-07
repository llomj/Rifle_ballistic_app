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
