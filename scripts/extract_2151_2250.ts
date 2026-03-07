// Extract questions 2151-2250 for translation
// Run with: npx tsx scripts/extract_2151_2250.ts

import { QUESTIONS_BANK } from '../src/questionsBank';
import * as fs from 'fs';

const result: Record<number, { e: string; de: string }> = {};

for (const q of QUESTIONS_BANK) {
  if (q.id >= 2151 && q.id <= 2250) {
    result[q.id] = { e: q.explanation, de: q.detailedExplanation || '' };
  }
}

fs.writeFileSync('scripts/extract_2151_2250.json', JSON.stringify(result, null, 2));
console.log(`Extracted ${Object.keys(result).length} questions (IDs 2151-2250)`);
