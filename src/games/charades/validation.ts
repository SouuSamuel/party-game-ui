import { charadesCategories, difficultyLabels, normalizeTerm } from './content';
import type { CharadesDifficulty, CharadesTerm } from './types';

export type CharadesValidationReport = {
  valid: boolean;
  totalTerms: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<CharadesDifficulty, number>;
  errors: string[];
  warnings: string[];
};

const difficulties: CharadesDifficulty[] = ['easy', 'medium', 'hard'];
const actionLikePatterns = [
  /\b(jogando|sentindo|andando|abrindo|fechando|correndo|fazendo|pegando|olhando|comendo)\b/i,
  /\buma pessoa\b/i,
];

export function validateCharadesTerms(terms: CharadesTerm[]): CharadesValidationReport {
  const categoryIds = new Set(charadesCategories.map((category) => category.id));
  const ids = new Set<string>();
  const normalizedTerms = new Set<string>();
  const byCategory: Record<string, number> = Object.fromEntries(charadesCategories.map((category) => [category.id, 0]));
  const byDifficulty: Record<CharadesDifficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const term of terms) {
    if (!term.id || !term.term || !term.categoryId || !term.difficulty) {
      errors.push(`Termo com campos obrigatórios ausentes: ${JSON.stringify(term)}`);
      continue;
    }

    if (ids.has(term.id)) {
      errors.push(`ID duplicado: ${term.id}`);
    }
    ids.add(term.id);

    if (!categoryIds.has(term.categoryId)) {
      errors.push(`Categoria inexistente em "${term.term}": ${term.categoryId}`);
    } else {
      byCategory[term.categoryId] += 1;
    }

    if (!difficulties.includes(term.difficulty)) {
      errors.push(`Dificuldade inválida em "${term.term}": ${term.difficulty}`);
    } else {
      byDifficulty[term.difficulty] += 1;
    }

    if (term.points !== { easy: 1, medium: 2, hard: 3 }[term.difficulty]) {
      errors.push(`Pontuação incorreta em "${term.term}"`);
    }

    const normalized = normalizeTerm(term.term);
    if (normalizedTerms.has(normalized)) {
      errors.push(`Duplicata normalizada: ${term.term}`);
    }
    normalizedTerms.add(normalized);

    if (term.term.length > 64) {
      warnings.push(`Termo longo: ${term.term}`);
    }

    if (actionLikePatterns.some((pattern) => pattern.test(term.term))) {
      errors.push(`Termo parece frase de ação: ${term.term}`);
    }
  }

  if (terms.length < 5000) {
    errors.push(`Catálogo abaixo do mínimo: ${terms.length}/5000`);
  }

  for (const category of charadesCategories) {
    if (byCategory[category.id] < 120) {
      errors.push(`Categoria com pouco conteúdo: ${category.name} (${byCategory[category.id]})`);
    }
  }

  for (const difficulty of difficulties) {
    if (byDifficulty[difficulty] < 800) {
      errors.push(`Dificuldade com pouco conteúdo: ${difficultyLabels[difficulty]} (${byDifficulty[difficulty]})`);
    }
  }

  return {
    valid: errors.length === 0,
    totalTerms: terms.length,
    byCategory,
    byDifficulty,
    errors,
    warnings,
  };
}
