import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export type HistoryRow = {
  id: string;
  prompt: string;
  model: string;
  imagePath: string;
  mimeType: string;
  status: "success" | "failed";
  errorMessage: string | null;
  createdAt: string;
};

export function insertHistoryRow(
  input: Omit<HistoryRow, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
) {
  const row: HistoryRow = {
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    prompt: input.prompt,
    model: input.model,
    imagePath: input.imagePath,
    mimeType: input.mimeType,
    status: input.status,
    errorMessage: input.errorMessage ?? null,
  };

  db.prepare(
    `
      INSERT INTO image_history (
        id,
        prompt,
        model,
        image_path,
        mime_type,
        status,
        error_message,
        created_at
      )
      VALUES (
        @id,
        @prompt,
        @model,
        @imagePath,
        @mimeType,
        @status,
        @errorMessage,
        @createdAt
      )
    `,
  ).run(row);

  return row;
}

export function listRecentHistory() {
  return db
    .prepare(
      `
        SELECT
          id,
          prompt,
          model,
          mime_type AS mimeType,
          status,
          created_at AS createdAt
        FROM image_history
        WHERE status = 'success'
          AND created_at >= datetime('now', '-30 days')
        ORDER BY created_at DESC
      `,
    )
    .all() as Array<
    Pick<HistoryRow, "id" | "prompt" | "model" | "mimeType" | "status" | "createdAt">
  >;
}

export function findHistoryById(id: string) {
  return db
    .prepare(
      `
        SELECT
          id,
          prompt,
          model,
          image_path AS imagePath,
          mime_type AS mimeType,
          status,
          error_message AS errorMessage,
          created_at AS createdAt
        FROM image_history
        WHERE id = ?
      `,
    )
    .get(id) as HistoryRow | undefined;
}
