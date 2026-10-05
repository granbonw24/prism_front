/** Champs validateurs renvoyés par {@code /api/saisie-workflows/statuses}. */
export type WorkflowValidateurRow = {
  valideCoordNom?: string | null;
  workflowValideCoordPar?: string | null;
  valideSupNom?: string | null;
  workflowValideSupPar?: string | null;
  valideCentralNom?: string | null;
  workflowValideCentralPar?: string | null;
};

export function validateurCoordDisplayName(row: WorkflowValidateurRow | null | undefined): string {
  const nom = row?.valideCoordNom?.trim();
  if (nom) {
    return nom;
  }
  const login = row?.workflowValideCoordPar?.trim();
  return login || '—';
}

export function validateurSupDisplayName(row: WorkflowValidateurRow | null | undefined): string {
  const nom = row?.valideSupNom?.trim();
  if (nom) {
    return nom;
  }
  const login = row?.workflowValideSupPar?.trim();
  return login || '—';
}

export function validateurCentralDisplayName(row: WorkflowValidateurRow | null | undefined): string {
  const nom = row?.valideCentralNom?.trim();
  if (nom) {
    return nom;
  }
  const login = row?.workflowValideCentralPar?.trim();
  return login || '—';
}
