/**
 * Client-side Lunr.js index (English).
 * Builds an index from search.json and provides a searchDocs() API.
 */
import lunr from 'lunr';
import data from '@/layouts/helpers/.json/search.json' assert { type: 'json' };

export type DocItem = { title: string; slug: string; excerpt?: string };

const items: DocItem[] = data as DocItem[];

// Build index
const idx = lunr(function () {
  this.ref('slug');
  this.field('title', { boost: 10 });
  this.field('excerpt');

  for (const doc of items) {
    this.add(doc as any);
  }
});

/** Full-text search with stemming and ranking. */
export async function searchDocs(q: string, limit = 20): Promise<DocItem[]> {
  const query = q.trim();
  if (!query) return [];
  const res = idx.search(query);
  const out: DocItem[] = [];
  const seen = new Set<string>();
  for (const r of res) {
    if (seen.has(r.ref)) continue;
    seen.add(r.ref);
    const doc = items.find(i => i.slug === r.ref);
    if (doc) out.push(doc);
    if (out.length >= limit) break;
  }
  return out;
}
