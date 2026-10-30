import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import { DatabaseManager, DatabaseKey, DB_NAMES } from "./connection.js";
import { runMigrations } from "./migrations.js";

// Load environment variables
const rootEnvPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  const altEnvPath = path.resolve(process.cwd(), "../../.env");
  if (fs.existsSync(altEnvPath)) {
    dotenv.config({ path: altEnvPath });
  } else {
    dotenv.config();
  }
}

async function main() {
  console.log(`
======================================================
📦 Nova Studio — Database Cluster Migration Runner
======================================================
Database Directory: ${DatabaseManager.getInstance().getDataDir()}
Starting schema migrations...
`);

  runMigrations();

  const dbManager = DatabaseManager.getInstance();
  const keys: DatabaseKey[] = [
    "user",
    "app",
    "settings",
    "content",
    "activity",
    "api",
    "team",
    "tutorials",
    "command",
  ];

  console.log("Migration Verification Summary:");
  console.log("------------------------------------------------------");

  for (const key of keys) {
    try {
      const db = dbManager.getConnection(key);
      const versionRow = db
        .prepare("PRAGMA user_version")
        .get() as { user_version?: number } | undefined;

      const tablesRow = db
        .prepare(
          "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        .get() as { count: number } | undefined;

      const ver = versionRow?.user_version ?? 0;
      const count = tablesRow?.count ?? 0;

      console.log(
        `  • ${DB_NAMES[key].padEnd(14)} : Version ${ver} | ${count} tables registered`
      );
    } catch (err: any) {
      console.log(`  • ${DB_NAMES[key].padEnd(14)} : Error: ${err.message}`);
    }
  }

  console.log("------------------------------------------------------");
  console.log("✅ All SQLite cluster migrations executed successfully!\n");

  dbManager.closeAll();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Database migration failed:", err);
  process.exit(1);
});
