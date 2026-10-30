import { runMigrations } from "./migrations.js";
import { runSeeds } from "./seeds.js";
import { DatabaseManager } from "./connection.js";

async function main() {
  console.log("[SeedRunner] Running database migrations...");
  runMigrations();
  console.log("[SeedRunner] Seeding initial data...");
  await runSeeds();
  console.log("[SeedRunner] Database migration and seeding complete!");
  DatabaseManager.getInstance().closeAll();
  process.exit(0);
}

main().catch((err) => {
  console.error("[SeedRunner] Error during seeding:", err);
  process.exit(1);
});

