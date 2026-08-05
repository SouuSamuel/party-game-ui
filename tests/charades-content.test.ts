import test from 'node:test';
import { charadesTerms } from '../src/games/charades/content';
import { validateCharadesTerms } from '../src/games/charades/validation';

test('charades content validates and has at least 5000 unique terms', () => {
  const report = validateCharadesTerms(charadesTerms);
  if (!report.valid) {
    throw new Error(report.errors.join('\n'));
  }
  if (report.totalTerms < 5000) {
    throw new Error(`Expected at least 5000 terms, received ${report.totalTerms}`);
  }
});
