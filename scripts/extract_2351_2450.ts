// Extract questions 2351-2450 with e and de for translation
// Run: npx tsx scripts/extract_2351_2450.ts

import { QUESTIONS_BANK } from '../src/questionsBank';
import * as fs from 'fs';

const out: { id: number; e: string; de: string }[] = QUESTIONS_BANK
  .filter(q => q.id >= 2351 && q.id <= 2450)
  .map(q => ({ id: q.id, e: q.explanation, de: q.detailedExplanation || '' }));

fs.writeFileSync('scripts/extract_2351_2450.json', JSON.stringify(out, null, 2));
console.log(`Extracted ${out.length} questions to scripts/extract_2351_2450.json`);
