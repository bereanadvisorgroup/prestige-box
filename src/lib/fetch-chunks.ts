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

/**
 * Automatically paginates through all pages of a Supabase PostgREST query in chunks of 1,000 rows
 * to bypass PostgREST's default max_rows limit (1,000 rows per query).
 */
export async function fetchAllRows<T = any>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000,
): Promise<T[]> {
  let from = 0;
  const allRows: T[] = [];

  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw new Error((error as { message: string }).message || String(error));
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}
