export type CleanupCandidate = {
  id: string;
  imagePath: string;
  createdAt: string;
};

export function buildCleanupPlan(rows: CleanupCandidate[], now: Date) {
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const expired = rows.filter((row) => {
    return new Date(row.createdAt).getTime() < cutoff;
  });

  return {
    deleteIds: expired.map((row) => row.id),
    deleteFiles: expired.map((row) => row.imagePath),
  };
}
