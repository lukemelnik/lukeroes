import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const defaultDbPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../lukeroes.db",
);
const sqlite = new Database(process.env.DATABASE_PATH || defaultDbPath);
sqlite.pragma("journal_mode = WAL");

type SqliteDatabase = InstanceType<typeof Database>;

export const sqlite3: SqliteDatabase = sqlite;
export const db = drizzle(sqlite);

export function initFTS() {
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
      title,
      excerpt,
      content,
      content=posts,
      content_rowid=id
    );

    CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
      INSERT INTO posts_fts(rowid, title, excerpt, content)
      VALUES (new.id, new.title, new.excerpt, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, content)
      VALUES ('delete', old.id, old.title, old.excerpt, old.content);
      INSERT INTO posts_fts(rowid, title, excerpt, content)
      VALUES (new.id, new.title, new.excerpt, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, content)
      VALUES ('delete', old.id, old.title, old.excerpt, old.content);
    END;
  `);
}
