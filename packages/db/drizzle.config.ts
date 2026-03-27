import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../apps/web/.env",
});

const defaultDbPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../lukeroes.db",
);

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH || defaultDbPath,
  },
  tablesFilter: ["!posts_fts*"],
});
