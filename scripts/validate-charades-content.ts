import { charadesCategories, charadesTerms, difficultyLabels } from '../src/games/charades/content';
import { validateCharadesTerms } from '../src/games/charades/validation';

const report = validateCharadesTerms(charadesTerms);

console.log(`Total de termos: ${report.totalTerms}`);
console.log('Por categoria:');
for (const category of charadesCategories) {
  console.log(`- ${category.name}: ${report.byCategory[category.id] ?? 0}`);
}
console.log('Por dificuldade:');
for (const difficulty of ['easy', 'medium', 'hard'] as const) {
  console.log(`- ${difficultyLabels[difficulty]}: ${report.byDifficulty[difficulty]}`);
}

if (report.warnings.length > 0) {
  console.log('Avisos:');
  report.warnings.slice(0, 20).forEach((warning) => console.log(`- ${warning}`));
}

if (!report.valid) {
  console.error('Erros:');
  report.errors.slice(0, 40).forEach((error) => console.error(`- ${error}`));
  if (report.errors.length > 40) {
    console.error(`...mais ${report.errors.length - 40} erro(s).`);
  }
  process.exit(1);
}

console.log('Validação concluída sem erros estruturais.');
