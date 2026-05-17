/** Colonnes « code » masquées dans les listes (libellés métier affichés à la place). */
export function isCodeListColumn(key: string): boolean {
  if (key === 'code' || key === 'id') {
    return true;
  }
  if (/^code[A-Z]/.test(key)) {
    return true;
  }
  return false;
}

export function filterVisibleListColumns(keys: readonly string[]): string[] {
  return keys.filter((k) => !isCodeListColumn(k));
}
