import * as SQLite from 'expo-sqlite';
import { CHARADES_CONTENT_VERSION, charadesCategories, charadesTerms } from './content';
import type { CharadesDifficulty, CharadesTerm } from './types';
import { validateCharadesTerms } from './validation';

type SQLiteDatabase = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;

const DATABASE_NAME = 'groupgames.db';
const EXPECTED_COUNT = charadesTerms.length;

export async function openGroupGamesDatabase() {
  return SQLite.openDatabaseAsync(DATABASE_NAME);
}

export async function migrateCharadesDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS content_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS charades_categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      content_version INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS charades_terms (
      id TEXT PRIMARY KEY NOT NULL,
      term TEXT NOT NULL,
      normalized TEXT NOT NULL UNIQUE,
      difficulty TEXT NOT NULL,
      points INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      content_version INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS charades_term_categories (
      term_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      PRIMARY KEY (term_id, category_id),
      FOREIGN KEY (term_id) REFERENCES charades_terms(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES charades_categories(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_charades_terms_difficulty ON charades_terms(difficulty);
    CREATE INDEX IF NOT EXISTS idx_charades_term_categories_category ON charades_term_categories(category_id);
  `);
}

async function readMeta(db: SQLiteDatabase, key: string) {
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM content_meta WHERE key = ?', [key]);
  return rows[0]?.value;
}

async function writeMeta(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync('INSERT OR REPLACE INTO content_meta (key, value) VALUES (?, ?)', [key, value]);
}

function sqlValue(value: string | number) {
  if (typeof value === 'number') return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

async function execInChunks(db: SQLiteDatabase, statements: string[], chunkSize = 450) {
  for (let index = 0; index < statements.length; index += chunkSize) {
    await db.execAsync(statements.slice(index, index + chunkSize).join('\n'));
  }
}

export async function seedCharadesDatabase(db: SQLiteDatabase) {
  const report = validateCharadesTerms(charadesTerms);
  if (!report.valid) {
    throw new Error(`Conteúdo da Mímica inválido: ${report.errors.slice(0, 5).join('; ')}`);
  }

  const version = await readMeta(db, 'charades_content_version');
  const count = await readMeta(db, 'charades_content_count');
  if (version === String(CHARADES_CONTENT_VERSION) && count === String(EXPECTED_COUNT)) {
    return report;
  }

  await db.execAsync('BEGIN TRANSACTION;');
  try {
    await db.runAsync('DELETE FROM charades_term_categories');
    await db.runAsync('DELETE FROM charades_terms');
    await db.runAsync('DELETE FROM charades_categories');

    await execInChunks(
      db,
      charadesCategories.map(
        (category) =>
          `INSERT INTO charades_categories (id, name, icon, description, content_version, active) VALUES (${sqlValue(category.id)}, ${sqlValue(category.name)}, ${sqlValue(category.icon)}, ${sqlValue(category.description)}, ${CHARADES_CONTENT_VERSION}, 1);`
      )
    );

    await execInChunks(
      db,
      charadesTerms.map(
        (term) =>
          `INSERT INTO charades_terms (id, term, normalized, difficulty, points, active, content_version) VALUES (${sqlValue(term.id)}, ${sqlValue(term.term)}, ${sqlValue(term.normalized)}, ${sqlValue(term.difficulty)}, ${term.points}, ${term.active ? 1 : 0}, ${term.contentVersion});`
      )
    );

    await execInChunks(
      db,
      charadesTerms.map((term) => `INSERT INTO charades_term_categories (term_id, category_id) VALUES (${sqlValue(term.id)}, ${sqlValue(term.categoryId)});`)
    );

    await writeMeta(db, 'charades_schema_version', '1');
    await writeMeta(db, 'charades_content_version', String(CHARADES_CONTENT_VERSION));
    await writeMeta(db, 'charades_content_count', String(EXPECTED_COUNT));
    await db.execAsync('COMMIT;');
    return report;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export async function initializeCharadesDatabase() {
  const db = await openGroupGamesDatabase();
  await migrateCharadesDatabase(db);
  const report = await seedCharadesDatabase(db);
  return { db, report };
}

export async function getCharadesTerms(
  db: SQLiteDatabase,
  categoryIds: string[],
  difficulties: CharadesDifficulty[]
): Promise<CharadesTerm[]> {
  if (categoryIds.length === 0 || difficulties.length === 0) return [];
  const categoryPlaceholders = categoryIds.map(() => '?').join(', ');
  const difficultyPlaceholders = difficulties.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{
    id: string;
    term: string;
    normalized: string;
    category_id: string;
    difficulty: CharadesDifficulty;
    points: number;
    active: number;
    content_version: number;
  }>(
    `SELECT t.id, t.term, t.normalized, tc.category_id, t.difficulty, t.points, t.active, t.content_version
     FROM charades_terms t
     INNER JOIN charades_term_categories tc ON tc.term_id = t.id
     WHERE t.active = 1
       AND tc.category_id IN (${categoryPlaceholders})
       AND t.difficulty IN (${difficultyPlaceholders})`,
    [...categoryIds, ...difficulties]
  );

  return rows.map((row) => ({
    id: row.id,
    term: row.term,
    normalized: row.normalized,
    categoryId: row.category_id,
    difficulty: row.difficulty,
    points: row.points,
    active: row.active === 1,
    contentVersion: row.content_version,
  }));
}
