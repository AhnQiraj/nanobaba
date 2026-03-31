import { existsSync, rmSync } from "node:fs";
import { db } from "../lib/db.ts";
import { buildCleanupPlan } from "../lib/cleanup.ts";

const rows = db
  .prepare(
    `
      SELECT id, image_path AS imagePath, created_at AS createdAt
      FROM image_history
    `,
  )
  .all();

const plan = buildCleanupPlan(rows, new Date());

for (const imagePath of plan.deleteFiles) {
  if (existsSync(imagePath)) {
    rmSync(imagePath);
  }
}

if (plan.deleteIds.length > 0) {
  const placeholders = plan.deleteIds.map(() => "?").join(", ");
  db.prepare(`DELETE FROM image_history WHERE id IN (${placeholders})`).run(
    ...plan.deleteIds,
  );
}

console.log(`cleanup complete: ${plan.deleteIds.length} rows removed`);
