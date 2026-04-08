/** Accepte un tableau JSON ou une page Spring (`content`). */
export function unwrapListBody(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }
  if (body && typeof body === 'object' && 'content' in body) {
    const c = (body as { content: unknown }).content;
    return Array.isArray(c) ? c : [];
  }
  return [];
}
