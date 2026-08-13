/**
 * Batches an array of IDs into smaller chunks (e.g., 100 IDs per chunk)
 * to avoid URL length limits (HTTP 400 Bad Request) when querying Supabase PostgREST with `.in()`.
 */
export async function fetchInChunks<T, ID extends string = string>(
  ids: ID[],
  fetchFn: (chunk: ID[]) => Promise<T[] | null | undefined>,
  chunkSize = 100,
): Promise<T[]> {
  if (!ids || ids.length === 0) return [];
  const uniqueIds = Array.from(new Set(ids));
  const results: T[] = [];

  for (let i = 0; i < uniqueIds.length; i += chunkSize) {
    const chunk = uniqueIds.slice(i, i + chunkSize);
    const data = await fetchFn(chunk);
    if (data && data.length > 0) {
      results.push(...data);
    }
  }

  return results;
}
